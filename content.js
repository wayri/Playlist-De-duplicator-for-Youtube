(() => {
  'use strict';

  const RENDERER = 'ytd-playlist-video-renderer';
  const state = {
    cancelled: false,
    lastScan: null,
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
      state.cancelled = false;
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

  function collectRawEntries() {
    return [...document.querySelectorAll(RENDERER)].map(rendererVideoInfo);
  }

  function scanLoaded(scanMode = 'loaded') {
    ensurePlaylistState();
    const context = pageContext();
    const rawEntries = collectRawEntries();
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
      scannedAt: Date.now()
    };

    state.lastScan = scan;
    return scan;
  }

  function notifyProgress(payload) {
    chrome.runtime.sendMessage({ type: 'YTPD_PROGRESS', ...payload }).catch(() => {});
  }

  function getScrollContainer() {
    return document.scrollingElement || document.documentElement;
  }

  async function loadAllPlaylistItems() {
    state.cancelled = false;
    let stableRounds = 0;
    let lastCount = -1;
    let rounds = 0;
    const scroller = getScrollContainer();

    while (!state.cancelled && stableRounds < 4 && rounds < 180) {
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

      if (document.querySelector(
        'ytd-continuation-item-renderer tp-yt-paper-spinner[active], ' +
        'ytd-continuation-item-renderer #spinner[active]'
      )) {
        await sleep(700);
        stableRounds = 0;
      }
    }

    if (state.cancelled) throw new Error('Cancelled.');
    window.scrollTo({ top: 0, behavior: 'instant' });
    await sleep(250);
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

  const REMOVE_PATTERNS = [
    /^remove\s+from\b/i,
    /^remove\s+from\s+playlist\b/i,
    /^delete\s+from\b/i,
    /^supprimer\s+de\b/i,
    /^retirer\s+de\b/i,
    /^entfernen\b/i,
    /^aus\s+.*entfernen\b/i,
    /^eliminar\s+de\b/i,
    /^quitar\s+de\b/i,
    /^rimuovi\s+da\b/i,
    /^verwijderen\s+uit\b/i,
    /^remover\s+de\b/i,
    /^remova\s+de\b/i,
    /^usuń\s+z\b/i,
    /^удалить\s+из\b/i,
    /^видалити\s+з\b/i,
    /^xóa\s+khỏi\b/i,
    /^hapus\s+dari\b/i,
    /^kaldır/i,
    /에서\s*삭제/i,
    /から削除/i,
    /从.*中移除/,
    /從.*移除/,
    /إزالة\s+من/,
    /حذف\s+من/
  ];

  function isRemoveMenuItem(item) {
    const text = (item.innerText || item.textContent || '').replace(/\s+/g, ' ').trim();
    return REMOVE_PATTERNS.some(pattern => pattern.test(text));
  }

  async function openMenuAndFindRemove(renderer) {
    renderer.scrollIntoView({ block: 'center', behavior: 'instant' });
    await sleep(120);
    const menuButton = findActionMenuButton(renderer);
    if (!menuButton) throw new Error('Could not find the playlist item action menu.');

    menuButton.click();
    await sleep(350);

    const menuItems = [...document.querySelectorAll(
      'ytd-menu-popup-renderer ytd-menu-service-item-renderer, ' +
      'tp-yt-iron-dropdown ytd-menu-service-item-renderer, ' +
      'ytd-popup-container ytd-menu-service-item-renderer'
    )].filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    const removeItem = menuItems.find(isRemoveMenuItem);
    if (!removeItem) {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true
      }));
      await sleep(100);
      throw new Error('Could not safely identify the “Remove from playlist” action in this YouTube language/layout.');
    }
    return removeItem;
  }

  async function removeOneCopy(videoId, keepMode) {
    const renderers = findRenderersByVideoId(videoId);
    if (renderers.length < 2) return { removed: false, reason: 'No duplicate remains.' };

    // To preserve the first occurrence, delete from the end. To preserve the last,
    // repeatedly delete from the beginning until only the original last copy remains.
    const target = keepMode === 'last' ? renderers[0] : renderers[renderers.length - 1];
    const removeItem = await openMenuAndFindRemove(target);
    const beforeCount = findRenderersByVideoId(videoId).length;
    removeItem.click();

    const deadline = Date.now() + 4500;
    while (Date.now() < deadline) {
      await sleep(180);
      const afterCount = findRenderersByVideoId(videoId).length;
      if (afterCount < beforeCount) return { removed: true };
    }
    return { removed: false, reason: 'YouTube did not confirm the item removal.' };
  }

  async function removeDuplicates(options = {}) {
    state.cancelled = false;
    const initial = scanLoaded('loaded');
    if (!initial.duplicateCount) {
      return { removed: 0, failed: 0, failures: [], requested: 0, scan: initial };
    }

    const keepMode = options.keep === 'last' ? 'last' : 'first';
    const requestedIds = Array.isArray(options.videoIds) ? options.videoIds.filter(Boolean) : [];
    if (!requestedIds.length) {
      return { removed: 0, failed: 0, failures: [], requested: 0, scan: initial };
    }

    const selectedSet = new Set(requestedIds);
    const groups = initial.groups.filter(group => selectedSet.has(group.videoId));
    const total = groups.reduce((sum, group) => sum + group.count - 1, 0);

    if (!total) {
      return { removed: 0, failed: 0, failures: [], requested: 0, scan: initial };
    }

    let removed = 0;
    let failed = 0;
    const failures = [];

    for (const group of groups) {
      while (!state.cancelled && findRenderersByVideoId(group.videoId).length > 1) {
        notifyProgress({
          phase: 'removing',
          current: removed + failed,
          total,
          text: `Removing ${removed + failed + 1} of ${total}…`
        });

        try {
          const result = await removeOneCopy(group.videoId, keepMode);
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
      if (state.cancelled) break;
    }

    const scan = scanLoaded('loaded');
    notifyProgress({
      phase: 'done',
      current: Math.min(total, removed + failed),
      total,
      text: state.cancelled ? 'Stopped.' : 'Finished.'
    });

    return {
      removed,
      failed,
      failures,
      requested: total,
      scan,
      cancelled: state.cancelled,
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
        lastScan: state.lastScan
      });
      return;
    }

    if (message.type === 'YTPD_CANCEL') {
      state.cancelled = true;
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'YTPD_SCAN') {
      try {
        if (!pageContext().isPlaylistPage) throw new Error('Open the dedicated YouTube playlist page first.');
        sendResponse({ ok: true, scan: scanLoaded('loaded') });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
      return;
    }

    if (message.type === 'YTPD_LOAD_AND_SCAN') {
      (async () => {
        try {
          if (!pageContext().isPlaylistPage) throw new Error('Open the dedicated YouTube playlist page first.');
          await loadAllPlaylistItems();
          sendResponse({ ok: true, scan: scanLoaded('full') });
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
          const result = await removeDuplicates({
            videoIds: message.videoIds,
            keep: message.keep
          });
          sendResponse({ ok: true, ...result });
        } catch (err) {
          sendResponse({ ok: false, error: err.message });
        }
      })();
      return true;
    }
  });
})();
