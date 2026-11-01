(() => {
  'use strict';

  const RENDERER = 'ytd-playlist-video-renderer';
  const state = {
    operation: null,
    lastScan: null,
    reviewSnapshot: null,
    playlistId: null
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function pageContext() {
    const url = new URL(location.href);
    const playlistId = url.searchParams.get('list');
    const dedicated = url.pathname === '/playlist' && Boolean(playlistId);
    const watchWithPlaylist = url.pathname === '/watch' && Boolean(playlistId);
    return {
      playlistId,
      isPlaylistPage: dedicated,
      isWatchWithPlaylist: watchWithPlaylist,
      canonicalPlaylistUrl: playlistId ? `${location.origin}/playlist?list=${encodeURIComponent(playlistId)}` : null
    };
  }

  function ensurePlaylistState() {
    const { playlistId } = pageContext();
    if (state.playlistId !== playlistId) {
      state.playlistId = playlistId;
      state.lastScan = null;
      state.reviewSnapshot = null;
    }
  }

  function getPlaylistTitle() {
    const candidates = [
      'ytd-playlist-header-renderer h1 yt-formatted-string',
      'ytd-playlist-header-renderer #text',
      'meta[name="title"]'
    ];
    for (const selector of candidates) {
      const el = document.querySelector(selector);
      const value = el?.content || el?.textContent;
      if (value?.trim()) return value.trim();
    }
    return document.title.replace(/\s*-\s*YouTube\s*$/i, '').trim();
  }

  function rendererVideoInfo(renderer, index) {
    const links = [
      renderer.querySelector('a#video-title'),
      renderer.querySelector('a[href*="watch?v="]'),
      renderer.querySelector('a[href*="/shorts/"]')
    ].filter(Boolean);

    let videoId = null;
    let href = '';
    for (const link of links) {
      href = link.href || link.getAttribute('href') || '';
      try {
        const u = new URL(href, location.origin);
        if (u.pathname === '/watch') videoId = u.searchParams.get('v');
        if (!videoId && u.pathname.startsWith('/shorts/')) videoId = u.pathname.split('/')[2] || null;
      } catch (_) {}
      if (videoId) break;
    }

    const titleEl = renderer.querySelector('#video-title');
    const title = titleEl?.getAttribute('title')?.trim() || titleEl?.textContent?.trim() || '';
    return {
      videoId,
      title,
      href,
      index,
      position: index + 1
    };
  }

  function rendererSnapshot() {
    return [...document.querySelectorAll(RENDERER)].map((renderer, index) => ({
      renderer,
      videoId: rendererVideoInfo(renderer, index).videoId
    }));
  }

  function sameSnapshot(expected) {
    const actual = rendererSnapshot();
    return actual.length === expected.length && actual.every((entry, index) =>
      entry.renderer === expected[index].renderer && entry.videoId === expected[index].videoId);
  }

  function startOperation(kind) {
    if (state.operation) throw new Error(`${state.operation.kind} is already in progress. Wait or cancel it first.`);
    const operation = { kind, playlistId: pageContext().playlistId, cancelled: false, interrupted: false };
    if (kind === 'remove') {
      operation.onUserInput = event => {
        if (event.isTrusted) operation.interrupted = true;
      };
      document.addEventListener('pointerdown', operation.onUserInput, true);
      document.addEventListener('keydown', operation.onUserInput, true);
    }
    state.operation = operation;
    return operation;
  }

  function checkOperation(operation) {
    if (state.operation !== operation || operation.cancelled) throw new Error('Cancelled.');
    if (operation.interrupted) throw new Error('User interaction changed the page during cleanup. Scan again.');
    if (!pageContext().isPlaylistPage || pageContext().playlistId !== operation.playlistId) {
      throw new Error('Playlist changed during the operation. Scan it again.');
    }
  }

  async function runOperation(kind, task) {
    const operation = startOperation(kind);
    try {
      checkOperation(operation);
      return await task(operation);
    } finally {
      if (state.operation === operation) {
        if (operation.onUserInput) {
          document.removeEventListener('pointerdown', operation.onUserInput, true);
          document.removeEventListener('keydown', operation.onUserInput, true);
        }
        state.operation = null;
      }
    }
  }

  function scanLoaded(scanMode = 'loaded') {
    ensurePlaylistState();
    const context = pageContext();
    const renderers = [...document.querySelectorAll(RENDERER)];
    const rawEntries = renderers.map(rendererVideoInfo);
    const entries = rawEntries.filter(item => Boolean(item.videoId));
    const skippedEntries = rawEntries.filter(item => !item.videoId);
    const byId = new Map();

    for (const entry of entries) {
      const group = byId.get(entry.videoId) || {
        videoId: entry.videoId,
        title: entry.title,
        count: 0,
        positions: [],
        url: `${location.origin}/watch?v=${encodeURIComponent(entry.videoId)}`
      };
      group.count += 1;
      group.positions.push(entry.position);
      if (!group.title && entry.title) group.title = entry.title;
      byId.set(entry.videoId, group);
    }

    const groups = [...byId.values()]
      .filter(group => group.count > 1)
      .sort((a, b) => (b.count - a.count) || a.positions[0] - b.positions[0]);

    const duplicateCount = groups.reduce((sum, group) => sum + group.count - 1, 0);
    const scan = {
      playlistId: context.playlistId,
      playlistTitle: getPlaylistTitle(),
      totalCount: rawEntries.length,
      identifiedCount: entries.length,
      uniqueCount: byId.size,
      duplicateCount,
      duplicateGroupCount: groups.length,
      skippedCount: skippedEntries.length,
      skippedPositions: skippedEntries.slice(0, 20).map(entry => entry.position),
      largestGroupCount: groups.reduce((max, group) => Math.max(max, group.count), 0),
      groups,
      scanMode,
      scanToken: crypto.randomUUID(),
      scannedAt: Date.now()
    };

    state.lastScan = scan;
    state.reviewSnapshot = renderers.map((renderer, index) => ({
      renderer, videoId: rawEntries[index].videoId
    }));
    return scan;
  }

  function notifyProgress(payload) {
    chrome.runtime.sendMessage({ type: 'YTPD_PROGRESS', ...payload }).catch(() => {});
  }

  function getScrollContainer() {
    return document.scrollingElement || document.documentElement;
  }

  async function loadAllPlaylistItems(operation) {
    let stableRounds = 0;
    let lastCount = -1;
    let rounds = 0;
    const scroller = getScrollContainer();

    while (stableRounds < 4 && rounds < 180) {
      checkOperation(operation);
      rounds += 1;
      const count = document.querySelectorAll(RENDERER).length;
      notifyProgress({
        phase: 'loading',
        current: rounds,
        total: 0,
        text: `Loading playlist… ${count} videos`
      });

      if (count === lastCount) stableRounds += 1;
      else stableRounds = 0;
      lastCount = count;

      window.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' });
      await sleep(stableRounds > 0 ? 800 : 500);
      checkOperation(operation);

      if (document.querySelector(
        'ytd-continuation-item-renderer tp-yt-paper-spinner[active], ' +
        'ytd-continuation-item-renderer #spinner[active]'
      )) {
        await sleep(700);
        checkOperation(operation);
        stableRounds = 0;
      }
    }

    checkOperation(operation);
    window.scrollTo({ top: 0, behavior: 'instant' });
    await sleep(250);
    checkOperation(operation);
    const unresolved = Boolean(document.querySelector('ytd-continuation-item-renderer'));
    return rounds < 180 && !unresolved && stableRounds >= 4 &&
      document.querySelectorAll(RENDERER).length === lastCount;
  }

  function findRenderersByVideoId(videoId) {
    return [...document.querySelectorAll(RENDERER)].filter(
      (renderer, index) => rendererVideoInfo(renderer, index).videoId === videoId
    );
  }

  function findActionMenuButton(renderer) {
    const selectors = [
      '#menu button[aria-label]',
      '#menu yt-icon-button button',
      'ytd-menu-renderer button[aria-label]',
      'button[aria-label*="menu" i]',
      'button[aria-haspopup="true"]'
    ];
    for (const selector of selectors) {
      const buttons = [...renderer.querySelectorAll(selector)];
      if (buttons.length) return buttons[buttons.length - 1];
    }
    return null;
  }

  function visibleMenuPopups() {
    return [...document.querySelectorAll('ytd-menu-popup-renderer')].filter(popup => {
      const rect = popup.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !popup.closest('[aria-hidden="true"]');
    });
  }

  function closeMenu() {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', code: 'Escape', bubbles: true
    }));
  }

  const RESERVED_REMOVE_TARGETS = new Set(['watch later', 'liked videos']);

  function isExactPlaylistRemove(item, playlistTitle) {
    const text = (item.innerText || item.textContent || '').replace(/\s+/g, ' ').trim();
    const title = playlistTitle.replace(/\s+/g, ' ').trim();
    return text === 'Remove from playlist' ||
      (title && !RESERVED_REMOVE_TARGETS.has(title.toLowerCase()) && text === `Remove from ${title}`);
  }

  function menuBelongsToButton(popup, button) {
    const controlledId = button.getAttribute?.('aria-controls');
    if (!controlledId) return true;
    const controlled = document.getElementById(controlledId);
    return Boolean(controlled && (controlled === popup || controlled.contains(popup)));
  }

  async function openMenuAndFindRemove(renderer, operation, playlistTitle) {
    if (visibleMenuPopups().length) throw new Error('Another YouTube menu is open. Close it and scan again.');
    renderer.scrollIntoView({ block: 'center', behavior: 'instant' });
    await sleep(120);
    checkOperation(operation);
    const menuButton = findActionMenuButton(renderer);
    if (!menuButton) throw new Error('Could not find the playlist item action menu.');

    menuButton.click();
    await sleep(350);
    try { checkOperation(operation); }
    catch (err) { closeMenu(); throw err; }
    const popups = visibleMenuPopups();
    if (popups.length !== 1) {
      closeMenu();
      throw new Error('Could not isolate the playlist item menu.');
    }
    if (!menuBelongsToButton(popups[0], menuButton)) {
      closeMenu();
      throw new Error('The visible menu does not belong to the reviewed playlist entry.');
    }
    const menuItems = [...popups[0].querySelectorAll('ytd-menu-service-item-renderer')]
      .filter(item => {
        const rect = item.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
    const matches = menuItems.filter(item => isExactPlaylistRemove(item, playlistTitle));
    if (matches.length !== 1) {
      closeMenu();
      throw new Error('Could not uniquely identify the English “Remove from playlist” action for this playlist.');
    }
    return { removeItem: matches[0], popup: popups[0], menuButton };
  }

  async function removeOneCopy(videoId, survivor, keepMode, operation, expectedSnapshot, playlistTitle) {
    checkOperation(operation);
    if (!sameSnapshot(expectedSnapshot)) throw new Error('Playlist entries changed since review. Scan again.');
    const renderers = findRenderersByVideoId(videoId);
    if (renderers.length < 2 || !renderers.includes(survivor)) {
      throw new Error('The reviewed survivor is no longer present. Scan again.');
    }

    // To preserve the first occurrence, delete from the end. To preserve the last,
    // repeatedly delete from the beginning until only the original last copy remains.
    const target = keepMode === 'last' ? renderers[0] : renderers[renderers.length - 1];
    if (target === survivor) throw new Error('Refusing to remove the survivor.');
    const targetIndex = [...document.querySelectorAll(RENDERER)].indexOf(target);
    const { removeItem, popup, menuButton } = await openMenuAndFindRemove(target, operation, playlistTitle);
    try { checkOperation(operation); }
    catch (err) { closeMenu(); throw err; }
    const before = findRenderersByVideoId(videoId);
    if (before.length < 2 || !before.includes(target) || !before.includes(survivor) ||
        target === survivor || !sameSnapshot(expectedSnapshot) ||
        [...document.querySelectorAll(RENDERER)].indexOf(target) !== targetIndex ||
        visibleMenuPopups().length !== 1 || visibleMenuPopups()[0] !== popup ||
        !menuBelongsToButton(popup, menuButton) || !removeItem.getBoundingClientRect().width) {
      closeMenu();
      throw new Error('Playlist or menu changed before removal. Scan again.');
    }
    const beforeCount = before.length;
    removeItem.click();

    const deadline = Date.now() + 4500;
    while (Date.now() < deadline) {
      await sleep(180);
      const afterCount = findRenderersByVideoId(videoId).length;
      if (afterCount === beforeCount - 1) {
        expectedSnapshot.splice(targetIndex, 1);
        if (!sameSnapshot(expectedSnapshot) || !findRenderersByVideoId(videoId).includes(survivor)) {
          throw new Error('Playlist changed unexpectedly after removal. Scan again.');
        }
        return { removed: true };
      }
      if (afterCount < beforeCount - 1) throw new Error('More than one copy disappeared. Stop and scan again.');
    }
    return { removed: false, reason: 'YouTube did not confirm the item removal.' };
  }

  async function removeDuplicates(options, operation) {
    const initial = state.lastScan;
    if (!initial || !options.scanToken || options.scanToken !== initial.scanToken ||
        options.playlistId !== initial.playlistId || operation.playlistId !== initial.playlistId ||
        !state.reviewSnapshot || !sameSnapshot(state.reviewSnapshot)) {
      throw new Error('Reviewed scan is stale or belongs to another playlist. Scan again.');
    }
    const expectedSnapshot = [...state.reviewSnapshot];
    const keepMode = options.keep === 'last' ? 'last' : 'first';
    const requestedIds = Array.isArray(options.videoIds) ? options.videoIds.filter(Boolean) : [];
    if (!requestedIds.length) {
      return { removed: 0, failed: 0, failures: [], requested: 0, scan: initial };
    }

    const selectedSet = new Set(requestedIds);
    const groups = initial.groups.filter(group => selectedSet.has(group.videoId));
    if (groups.length !== selectedSet.size) throw new Error('Selection differs from the reviewed scan. Scan again.');
    const total = groups.reduce((sum, group) => sum + group.count - 1, 0);

    if (!total) {
      return { removed: 0, failed: 0, failures: [], requested: 0, scan: initial };
    }

    let removed = 0;
    let failed = 0;
    const failures = [];
    const survivors = new Map(groups.map(group => {
      const copies = findRenderersByVideoId(group.videoId);
      return [group.videoId, keepMode === 'last' ? copies[copies.length - 1] : copies[0]];
    }));
    const playlistTitle = initial.playlistTitle;

    for (const group of groups) {
      while (!operation.cancelled && findRenderersByVideoId(group.videoId).length > 1) {
        notifyProgress({
          phase: 'removing',
          current: removed + failed,
          total,
          text: `Removing ${removed + failed + 1} of ${total}…`
        });

        try {
          const result = await removeOneCopy(group.videoId, survivors.get(group.videoId), keepMode,
            operation, expectedSnapshot, playlistTitle);
          if (result.removed) {
            removed += 1;
          } else {
            failed += 1;
            failures.push({ videoId: group.videoId, title: group.title, reason: result.reason || 'Removal was not confirmed.' });
            break;
          }
        } catch (err) {
          console.warn('[Playlist Deduper]', err);
          failed += 1;
          failures.push({ videoId: group.videoId, title: group.title, reason: err.message || 'Unknown removal error.' });
          break;
        }

        await sleep(650);
      }
      if (operation.cancelled || failed) break;
    }

    const scan = scanLoaded('loaded');
    notifyProgress({
      phase: 'done',
      current: Math.min(total, removed + failed),
      total,
      text: operation.cancelled || failed ? 'Stopped.' : 'Finished.'
    });

    return {
      removed,
      failed,
      failures,
      requested: total,
      scan,
      cancelled: operation.cancelled,
      keepMode
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.type) return;
    ensurePlaylistState();

    if (message.type === 'YTPD_PING') {
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'YTPD_GET_STATE') {
      const context = pageContext();
      sendResponse({
        ...context,
        playlistTitle: context.playlistId ? getPlaylistTitle() : '',
        lastScan: state.lastScan,
        operation: state.operation ? {
          kind: state.operation.kind,
          cancelled: state.operation.cancelled
        } : null
      });
      return;
    }

    if (message.type === 'YTPD_CANCEL') {
      if (state.operation) state.operation.cancelled = true;
      sendResponse({ ok: true, active: Boolean(state.operation) });
      return;
    }

    if (message.type === 'YTPD_SCAN') {
      try {
        if (!pageContext().isPlaylistPage) throw new Error('Open the dedicated YouTube playlist page first.');
        const operation = startOperation('scan');
        try { sendResponse({ ok: true, scan: scanLoaded('loaded') }); }
        finally { if (state.operation === operation) state.operation = null; }
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
      return;
    }

    if (message.type === 'YTPD_LOAD_AND_SCAN') {
      (async () => {
        try {
          if (!pageContext().isPlaylistPage) throw new Error('Open the dedicated YouTube playlist page first.');
          const scan = await runOperation('load', async operation => {
            const complete = await loadAllPlaylistItems(operation);
            return scanLoaded(complete ? 'full' : 'loaded');
          });
          sendResponse({ ok: true, scan });
        } catch (err) {
          sendResponse({ ok: false, error: err.message });
        }
      })();
      return true;
    }

    if (message.type === 'YTPD_REMOVE_DUPLICATES') {
      (async () => {
        try {
          if (!pageContext().isPlaylistPage) throw new Error('Open the dedicated YouTube playlist page first.');
          const result = await runOperation('remove', operation => removeDuplicates({
            videoIds: message.videoIds,
            keep: message.keep,
            scanToken: message.scanToken,
            playlistId: message.playlistId
          }, operation));
          sendResponse({ ok: true, ...result });
        } catch (err) {
          sendResponse({ ok: false, error: err.message });
        }
      })();
      return true;
    }
  });
})();
