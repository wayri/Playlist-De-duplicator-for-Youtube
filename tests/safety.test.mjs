import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const contentSource = readFileSync(new URL('../content.js', import.meta.url), 'utf8');
const popupSource = readFileSync(new URL('../popup.js', import.meta.url), 'utf8');

function contentHarness(ids = ['abc', 'abc'], options = {}) {
  let listener;
  let visible = false;
  let clicks = 0;
  let escapeCount = 0;
  let continuation = Boolean(options.continuation);
  let releaseTimer;
  const eventListeners = new Map();
  const title = options.title || 'Test playlist';
  const location = { href: 'https://www.youtube.com/playlist?list=PL123', origin: 'https://www.youtube.com' };
  const entries = ids.map((id, index) => {
    const link = { href: id ? `https://www.youtube.com/watch?v=${id}` :
      'https://www.youtube.com/watch', getAttribute: () => null };
    const entryTitle = options.entryTitles?.[index] || `Title ${index}`;
    const titleEl = { getAttribute: () => entryTitle, textContent: entryTitle };
    const renderer = {
      id,
      scrollIntoView() { options.onScroll?.(renderer, entries); },
      querySelector(selector) {
        if (selector === 'a#video-title') return link;
        if (selector === '#video-title') return titleEl;
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '#menu button[aria-label]') return [{
          getAttribute: name => name === 'aria-controls' ? options.menuControlId || null : null,
          click() {
            visible = true;
            options.onMenuOpen?.();
          }
        }];
        return [];
      }
    };
    return renderer;
  });
  const menuLabels = options.menuLabels || [`Remove from ${title}`];
  const menuItems = menuLabels.map(label => ({
    innerText: label,
    getBoundingClientRect: () => ({ width: 10, height: 10 }),
    click() {
      clicks += 1;
      visible = false;
      const target = options.removeTarget?.(entries) || entries[entries.length - 1];
      const index = entries.indexOf(target);
      if (index >= 0) entries.splice(index, 1);
    }
  }));
  const popup = {
    id: options.popupId || 'playlist-menu',
    getBoundingClientRect: () => ({ width: 10, height: 10 }),
    closest: () => null,
    querySelectorAll: () => menuItems
  };
  let activePopup = popup;
  const document = {
    title,
    scrollingElement: { scrollHeight: 100 },
    addEventListener(type, fn) { eventListeners.set(type, fn); },
    removeEventListener(type, fn) { if (eventListeners.get(type) === fn) eventListeners.delete(type); },
    getElementById(id) { return id === popup.id ? popup : null; },
    querySelector(selector) {
      if (selector === 'ytd-playlist-header-renderer h1 yt-formatted-string') return { textContent: title };
      if (selector === 'ytd-continuation-item-renderer') return continuation ? {} : null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'ytd-playlist-video-renderer') return entries;
      if (selector === 'ytd-menu-popup-renderer') return visible ? [activePopup] : [];
      return [];
    },
    dispatchEvent() { visible = false; escapeCount += 1; }
  };
  const chrome = {
    runtime: {
      onMessage: { addListener(fn) { listener = fn; } },
      sendMessage: async () => {}
    }
  };
  const timer = options.holdTimer
    ? callback => { releaseTimer = callback; }
    : callback => setImmediate(callback);
  const context = vm.createContext({
    chrome, document, location, URL, Date, console: { warn() {} },
    crypto: { randomUUID: (() => { let n = 0; return () => `token-${++n}`; })() },
    KeyboardEvent: class {},
    window: { scrollTo() {} },
    setTimeout: timer
  });
  vm.runInContext(contentSource, context);
  const send = message => new Promise(resolve => {
    const async = listener(message, null, resolve);
    if (async !== true && message.type === 'YTPD_PROGRESS') resolve();
  });
  return {
    send, entries, location,
    get clicks() { return clicks; },
    get escapeCount() { return escapeCount; },
    release() { const callback = releaseTimer; releaseTimer = null; callback?.(); },
    replaceMenuByUser() {
      eventListeners.get('pointerdown')?.({ isTrusted: true });
      activePopup = { ...popup, id: 'another-menu' };
    },
    setContinuation(value) { continuation = value; }
  };
}

test('cleanup requires the reviewed playlist, token, and stable renderer order', async () => {
  const h = contentHarness(['a', 'a', 'b']);
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  let result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: 'wrong' });
  assert.equal(result.ok, false);
  assert.equal(h.clicks, 0);
  const identical = contentHarness(['a', 'a']);
  const identicalScan = (await identical.send({ type: 'YTPD_SCAN' })).scan;
  identical.entries.reverse();
  result = await identical.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: identicalScan.playlistId, scanToken: identicalScan.scanToken });
  assert.match(result.error, /stale/);
  assert.equal(identical.clicks, 0);
  h.entries.reverse();
  result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.match(result.error, /stale/);
  assert.equal(h.clicks, 0);
});

test('navigation to another playlist after review rejects cleanup without a click', async () => {
  const h = contentHarness(['a', 'a']);
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  h.location.href = 'https://www.youtube.com/playlist?list=PL456';
  const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.equal(result.ok, false);
  assert.equal(h.clicks, 0);
  assert.equal(h.entries.length, 2);
});

test('navigation during menu wait aborts before removal', async () => {
  let h;
  h = contentHarness(['a', 'a'], {
    onMenuOpen: () => { h.location.href = 'https://www.youtube.com/playlist?list=PL456'; }
  });
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.equal(result.removed, 0);
  assert.equal(h.clicks, 0);
  assert.equal(h.entries.length, 2);
  assert.ok(h.escapeCount > 0);
});

test('scan keys duplicate groups by exact ID and reports skipped positions', async () => {
  const h = contentHarness(['a', 'b', 'a', 'b', null], {
    entryTitles: ['Same title', 'Same title', 'Same title', 'Same title', 'Unavailable']
  });
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  assert.equal(scan.totalCount, 5);
  assert.equal(scan.identifiedCount, 4);
  assert.equal(scan.uniqueCount, 2);
  assert.equal(scan.duplicateCount, 2);
  assert.equal(scan.duplicateGroupCount, 2);
  assert.equal(scan.skippedCount, 1);
  assert.deepEqual([...scan.skippedPositions], [5]);
  const groups = new Map(scan.groups.map(group => [group.videoId, group]));
  assert.equal(groups.get('a').title, 'Same title');
  assert.equal(groups.get('b').title, 'Same title');
  assert.deepEqual([...groups.get('a').positions], [1, 3]);
  assert.deepEqual([...groups.get('b').positions], [2, 4]);
});

test('cancellation after opening a menu closes it without clicking', async () => {
  let h;
  h = contentHarness(['a', 'a'], { onMenuOpen: () => { void h.send({ type: 'YTPD_CANCEL' }); } });
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.equal(result.cancelled, true);
  assert.equal(result.removed, 0);
  assert.equal(h.clicks, 0);
  assert.ok(h.escapeCount > 0);
});

test('ordinary playlist named Watch later cannot match unrelated Watch later command', async () => {
  const h = contentHarness(['a', 'a'], {
    title: 'Watch later', menuLabels: ['Remove from Watch later']
  });
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.equal(result.removed, 0);
  assert.equal(h.clicks, 0);
});

test('user opening another renderer menu aborts before the removal click', async () => {
  let h;
  h = contentHarness(['a', 'a'], { onMenuOpen: () => h.replaceMenuByUser() });
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.equal(result.removed, 0);
  assert.equal(h.clicks, 0);
  assert.ok(h.escapeCount > 0);
});

test('aria-controls mismatch rejects an unrelated popup', async () => {
  const h = contentHarness(['a', 'a'], { menuControlId: 'another-menu' });
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.equal(result.removed, 0);
  assert.equal(h.clicks, 0);
});

test('load lock survives popup reopen and cancellation prevents a scan result', async () => {
  const h = contentHarness(['a', 'a'], { holdTimer: true });
  const loading = h.send({ type: 'YTPD_LOAD_AND_SCAN' });
  const state = await h.send({ type: 'YTPD_GET_STATE' });
  assert.equal(state.operation.kind, 'load');
  assert.equal((await h.send({ type: 'YTPD_SCAN' })).ok, false);
  assert.equal((await h.send({ type: 'YTPD_CANCEL' })).active, true);
  assert.equal((await h.send({ type: 'YTPD_GET_STATE' })).operation.cancelled, true);
  h.release();
  assert.match((await loading).error, /Cancelled/);
  assert.equal((await h.send({ type: 'YTPD_GET_STATE' })).operation, null);
});

test('unresolved continuation yields partial scan', async () => {
  const h = contentHarness(['a', 'a'], { continuation: true });
  const result = await h.send({ type: 'YTPD_LOAD_AND_SCAN' });
  assert.equal(result.ok, true);
  assert.equal(result.scan.scanMode, 'loaded');
});

test('unrelated remove command never receives a click', async () => {
  const h = contentHarness(['a', 'a'], { menuLabels: ['Remove from Watch later'] });
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.equal(result.removed, 0);
  assert.equal(result.failed, 1);
  assert.equal(h.clicks, 0);
  assert.ok(h.escapeCount > 0);
});

test('ambiguity and changed survivor stop all subsequent actions', async () => {
  const h = contentHarness(['a', 'a', 'b', 'b'], {
    menuLabels: ['Remove from playlist', 'Remove from playlist']
  });
  const { scan } = await h.send({ type: 'YTPD_SCAN' });
  const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a', 'b'], keep: 'first',
    playlistId: scan.playlistId, scanToken: scan.scanToken });
  assert.equal(result.failed, 1);
  assert.equal(h.clicks, 0);
  const race = contentHarness(['a', 'a'], { onScroll: (_target, entries) => entries.shift() });
  const reviewed = (await race.send({ type: 'YTPD_SCAN' })).scan;
  const raced = await race.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep: 'first',
    playlistId: reviewed.playlistId, scanToken: reviewed.scanToken });
  assert.equal(raced.removed, 0);
  assert.equal(race.clicks, 0);
});

test('successful removal keeps the reviewed survivor', async () => {
  for (const keep of ['first', 'last']) {
    const h = contentHarness(['a', 'a'], { removeTarget: entries => keep === 'first' ? entries[1] : entries[0] });
    const survivor = keep === 'first' ? h.entries[0] : h.entries[1];
    const { scan } = await h.send({ type: 'YTPD_SCAN' });
    const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep,
      playlistId: scan.playlistId, scanToken: scan.scanToken });
    assert.equal(result.removed, 1);
    assert.equal(h.entries.length, 1);
    assert.equal(h.entries[0], survivor);
  }
});

test('selective cleanup of 3+ copies retains the original first or last survivor', async () => {
  for (const keep of ['first', 'last']) {
    const h = contentHarness(['a', 'b', 'a', 'b', 'a', 'b', 'a'], {
      removeTarget: entries => {
        const selectedCopies = entries.filter(entry => entry.id === 'a');
        return keep === 'first' ? selectedCopies[selectedCopies.length - 1] : selectedCopies[0];
      }
    });
    const originalSelected = h.entries.filter(entry => entry.id === 'a');
    const unselected = h.entries.filter(entry => entry.id === 'b');
    const survivor = keep === 'first' ? originalSelected[0] : originalSelected[originalSelected.length - 1];
    const { scan } = await h.send({ type: 'YTPD_SCAN' });
    const result = await h.send({ type: 'YTPD_REMOVE_DUPLICATES', videoIds: ['a'], keep,
      playlistId: scan.playlistId, scanToken: scan.scanToken });
    assert.equal(result.ok, true);
    assert.equal(result.removed, 3);
    assert.equal(result.failed, 0);
    assert.equal(result.requested, 3);
    assert.equal(h.clicks, 3);
    assert.deepEqual(h.entries.filter(entry => entry.id === 'a'), [survivor]);
    assert.deepEqual(h.entries.filter(entry => entry.id === 'b'), unselected);
  }
});

test('CSV cells neutralize spreadsheet formulas including leading whitespace', () => {
  const listeners = new Map();
  const element = () => ({
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(name, fn) { listeners.set(name, fn); },
    value: '', checked: false, textContent: '', disabled: false,
    style: {}
  });
  const context = vm.createContext({
    document: { querySelector: element },
    chrome: {
      runtime: { getManifest: () => ({ version: '1.3.1' }), onMessage: { addListener() {} } },
      storage: { local: { get: async () => ({}), set: async () => {} } },
      tabs: { query: async () => [] }
    },
    setTimeout, URL, Blob, console
  });
  vm.runInContext(`${popupSource}\nglobalThis.testCsvEscape = csvEscape;`, context);
  assert.equal(context.testCsvEscape('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(context.testCsvEscape(' \t+SUM(1,2)'), '"\' \t+SUM(1,2)"');
  assert.equal(context.testCsvEscape('ordinary'), '"ordinary"');
});
