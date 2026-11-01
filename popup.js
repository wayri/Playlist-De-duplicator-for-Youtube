const els = {
  pageState: document.querySelector('#pageState'),
  openPlaylistBtn: document.querySelector('#openPlaylistBtn'),
  playlistTitle: document.querySelector('#playlistTitle'),
  scanStatusBadge: document.querySelector('#scanStatusBadge'),
  stepScan: document.querySelector('#stepScan'),
  stepReview: document.querySelector('#stepReview'),
  stepClean: document.querySelector('#stepClean'),
  statsWrap: document.querySelector('#stats'),
  total: document.querySelector('#totalCount'),
  unique: document.querySelector('#uniqueCount'),
  duplicate: document.querySelector('#duplicateCount'),
  groups: document.querySelector('#groupCount'),
  loadScanBtn: document.querySelector('#loadScanBtn'),
  scanBtn: document.querySelector('#scanBtn'),
  scanMeta: document.querySelector('#scanMeta'),
  cleanState: document.querySelector('#cleanState'),
  tools: document.querySelector('#tools'),
  keepMode: document.querySelector('#keepMode'),
  sortMode: document.querySelector('#sortMode'),
  filterInput: document.querySelector('#filterInput'),
  duplicateList: document.querySelector('#duplicateList'),
  selectedSummary: document.querySelector('#selectedSummary'),
  visibleSummary: document.querySelector('#visibleSummary'),
  selectAllBtn: document.querySelector('#selectAllBtn'),
  selectNoneBtn: document.querySelector('#selectNoneBtn'),
  copyBtn: document.querySelector('#copyBtn'),
  exportBtn: document.querySelector('#exportBtn'),
  diagnostics: document.querySelector('#diagnostics'),
  progressWrap: document.querySelector('#progressWrap'),
  progressBar: document.querySelector('#progressBar'),
  progressText: document.querySelector('#progressText'),
  cancelBtn: document.querySelector('#cancelBtn'),
  cleanupPanel: document.querySelector('#cleanupPanel'),
  cleanupPreview: document.querySelector('#cleanupPreview'),
  cleanupKeepNote: document.querySelector('#cleanupKeepNote'),
  confirmCheck: document.querySelector('#confirmCheck'),
  removeBtn: document.querySelector('#removeBtn'),
  removeFineprint: document.querySelector('#removeFineprint'),
  moreTools: document.querySelector('#moreTools'),
  version: document.querySelector('#version')
};

const PREF_KEY = 'ytpd_preferences';
let activeTabId = null;
let currentState = null;
let lastScan = null;
let working = false;
let selectedIds = new Set();
let busyPoll = null;

function setNotice(text, kind = 'neutral') {
  els.pageState.textContent = text;
  els.pageState.className = `notice ${kind}`;
}

function setStepState(stage) {
  const steps = [els.stepScan, els.stepReview, els.stepClean];
  steps.forEach(step => step.classList.remove('active', 'done'));
  if (stage === 'scan') {
    els.stepScan.classList.add('active');
  } else if (stage === 'review') {
    els.stepScan.classList.add('done');
    els.stepReview.classList.add('active');
  } else if (stage === 'clean') {
    els.stepScan.classList.add('done');
    els.stepReview.classList.add('done');
    els.stepClean.classList.add('active');
  } else if (stage === 'done') {
    steps.forEach(step => step.classList.add('done'));
  }
}

function updateStats(scan) {
  els.total.textContent = scan ? scan.totalCount : '—';
  els.unique.textContent = scan ? scan.uniqueCount : '—';
  els.duplicate.textContent = scan ? scan.duplicateCount : '—';
  els.groups.textContent = scan ? scan.duplicateGroupCount : '—';
  els.statsWrap.classList.toggle('hidden', !scan);
}

function setWorking(value, text = '') {
  working = value;
  els.loadScanBtn.disabled = value;
  els.scanBtn.disabled = value;
  els.keepMode.disabled = value;
  els.sortMode.disabled = value;
  els.filterInput.disabled = value;
  els.confirmCheck.disabled = value;
  els.selectAllBtn.disabled = value;
  els.selectNoneBtn.disabled = value;
  els.copyBtn.disabled = value;
  els.exportBtn.disabled = value;
  updateRemoveEnabled();
  els.progressWrap.classList.toggle('hidden', !value);
  if (text) els.progressText.textContent = text;
}

function selectedDuplicateCopies() {
  if (!lastScan) return 0;
  return lastScan.groups.reduce((sum, group) => (
    sum + (selectedIds.has(group.videoId) ? group.count - 1 : 0)
  ), 0);
}

function selectedGroupCount() {
  return lastScan?.groups.filter(group => selectedIds.has(group.videoId)).length || 0;
}

function updateSelectionSummary() {
  const selectedGroups = selectedGroupCount();
  const selectedCopies = selectedDuplicateCopies();
  const keepText = els.keepMode.value === 'last' ? 'last' : 'first';

  els.selectedSummary.textContent = `${selectedGroups} ${selectedGroups === 1 ? 'group' : 'groups'} · ${selectedCopies} to remove`;
  els.cleanupPreview.textContent = selectedCopies
    ? `Remove ${selectedCopies} extra ${selectedCopies === 1 ? 'copy' : 'copies'} from ${selectedGroups} ${selectedGroups === 1 ? 'video' : 'videos'}`
    : 'Select duplicate groups above.';
  els.cleanupKeepNote.textContent = selectedCopies
    ? `The ${keepText} occurrence of each selected video will stay in the playlist.`
    : 'Nothing will be changed until at least one duplicate group is selected.';
  els.removeBtn.textContent = selectedCopies
    ? `Remove ${selectedCopies} extra ${selectedCopies === 1 ? 'copy' : 'copies'}`
    : 'Remove selected duplicates';
  els.removeFineprint.textContent = `Exact video IDs only. The ${keepText} occurrence is preserved, and removals use YouTube's visible playlist menu.`;

  if (lastScan?.duplicateCount > 0) {
    setStepState(selectedCopies > 0 ? 'clean' : 'review');
  }
  updateRemoveEnabled();
}

function updateRemoveEnabled() {
  const count = selectedDuplicateCopies();
  els.removeBtn.disabled = working || !els.confirmCheck.checked || count === 0;
}

function resetConfirmation() {
  els.confirmCheck.checked = false;
  updateRemoveEnabled();
}

function sortedFilteredGroups() {
  if (!lastScan) return [];
  const filter = els.filterInput.value.trim().toLowerCase();
  const groups = lastScan.groups.filter(group => {
    if (!filter) return true;
    return (group.title || '').toLowerCase().includes(filter) || group.videoId.toLowerCase().includes(filter);
  });

  const sortMode = els.sortMode.value;
  groups.sort((a, b) => {
    if (sortMode === 'position') return a.positions[0] - b.positions[0];
    if (sortMode === 'title') return (a.title || a.videoId).localeCompare(b.title || b.videoId);
    return (b.count - a.count) || a.positions[0] - b.positions[0];
  });
  return groups;
}

function renderPositionChips(group) {
  const row = document.createElement('div');
  row.className = 'positionRow';

  const label = document.createElement('span');
  label.className = 'positionLabel';
  label.textContent = 'Positions';
  row.append(label);

  const keepIndex = els.keepMode.value === 'last' ? group.positions.length - 1 : 0;
  const shown = group.positions.slice(0, 7);
  shown.forEach((position, index) => {
    const chip = document.createElement('span');
    chip.className = `positionChip${index === keepIndex ? ' keep' : ''}`;
    chip.textContent = index === keepIndex ? `#${position} keep` : `#${position}`;
    row.append(chip);
  });

  if (group.positions.length > shown.length) {
    const more = document.createElement('span');
    more.className = 'morePositions';
    more.textContent = `+${group.positions.length - shown.length} more`;
    row.append(more);
  }
  return row;
}

function renderDuplicateList() {
  els.duplicateList.textContent = '';
  const groups = sortedFilteredGroups();
  els.visibleSummary.textContent = `${groups.length} of ${lastScan?.duplicateGroupCount || 0} duplicate ${groups.length === 1 ? 'group' : 'groups'}`;

  if (!groups.length) {
    const empty = document.createElement('div');
    empty.className = 'emptyFilter';
    empty.textContent = lastScan?.groups.length ? 'No duplicate videos match this search.' : 'No duplicates found.';
    els.duplicateList.append(empty);
    updateSelectionSummary();
    return;
  }

  for (const group of groups) {
    const row = document.createElement('div');
    row.className = `duplicateItem${selectedIds.has(group.videoId) ? ' selected' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'groupCheck';
    checkbox.checked = selectedIds.has(group.videoId);
    checkbox.setAttribute('aria-label', `Select ${group.title || group.videoId}`);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedIds.add(group.videoId);
      else selectedIds.delete(group.videoId);
      row.classList.toggle('selected', checkbox.checked);
      resetConfirmation();
      updateSelectionSummary();
    });

    const body = document.createElement('div');
    body.className = 'duplicateBody';

    const titleLine = document.createElement('div');
    titleLine.className = 'duplicateTitleLine';
    const title = document.createElement('div');
    title.className = 'duplicateTitle';
    title.textContent = group.title || group.videoId;
    title.title = group.title || group.videoId;

    const openLink = document.createElement('a');
    openLink.className = 'openLink';
    openLink.href = group.url || `https://www.youtube.com/watch?v=${encodeURIComponent(group.videoId)}`;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.textContent = 'open ↗';
    openLink.title = 'Open video in a new tab';
    titleLine.append(title, openLink);

    const meta = document.createElement('div');
    meta.className = 'duplicateMeta';
    meta.textContent = `${group.count} copies · ${group.count - 1} extra · ${group.videoId}`;

    body.append(titleLine, meta, renderPositionChips(group));

    const badge = document.createElement('div');
    badge.className = 'duplicateBadge';
    badge.textContent = `${group.count}×`;

    row.append(checkbox, body, badge);
    els.duplicateList.append(row);
  }

  updateSelectionSummary();
}

function renderScanMeta(scan) {
  const modeText = scan.scanMode === 'full' ? 'Full scan' : 'Partial scan';
  const largest = scan.largestGroupCount > 1 ? ` · max ${scan.largestGroupCount}×` : '';
  els.scanMeta.textContent = `${modeText} · ${scan.identifiedCount} identified${largest}`;
  els.scanStatusBadge.textContent = scan.scanMode === 'full' ? 'Full scan complete' : 'Partial scan';
  els.scanStatusBadge.className = `statusBadge ${scan.scanMode === 'full' ? 'ok' : 'warn'}`;

  if (scan.skippedCount > 0) {
    const positions = scan.skippedPositions?.length ? ` Positions: ${scan.skippedPositions.map(v => `#${v}`).join(', ')}${scan.skippedCount > scan.skippedPositions.length ? '…' : ''}` : '';
    els.diagnostics.textContent = `${scan.skippedCount} ${scan.skippedCount === 1 ? 'entry was' : 'entries were'} unavailable/private or could not be matched to a video ID. They were left untouched.${positions}`;
    els.diagnostics.classList.remove('hidden');
  } else {
    els.diagnostics.classList.add('hidden');
    els.diagnostics.textContent = '';
  }
}

function renderScan(scan) {
  lastScan = scan;
  updateStats(scan);
  selectedIds = new Set(scan?.groups?.map(group => group.videoId) || []);
  resetConfirmation();
  els.cleanState.classList.add('hidden');

  if (!scan) {
    els.tools.classList.add('hidden');
    els.cleanupPanel.classList.add('hidden');
    els.moreTools.classList.add('hidden');
    els.statsWrap.classList.add('hidden');
    els.scanMeta.textContent = 'No scan yet';
    els.scanStatusBadge.textContent = 'Not scanned';
    els.scanStatusBadge.className = 'statusBadge';
    setStepState('scan');
    return;
  }

  els.playlistTitle.textContent = scan.playlistTitle || currentState?.playlistTitle || 'YouTube playlist';
  els.playlistTitle.title = els.playlistTitle.textContent;
  renderScanMeta(scan);
  els.moreTools.classList.remove('hidden');

  if (scan.duplicateCount === 0) {
    els.tools.classList.add('hidden');
    els.cleanupPanel.classList.add('hidden');
    els.cleanState.classList.remove('hidden');
    if (scan.scanMode === 'full') {
      setNotice(`Clean: no exact duplicate video IDs found in ${scan.totalCount} playlist entries.`, 'ok');
      setStepState('done');
    } else {
      setNotice(`No duplicates found among the ${scan.totalCount} currently loaded entries. Run a full scan for certainty.`, 'ok');
      setStepState('review');
    }
    return;
  }

  els.cleanState.classList.add('hidden');
  els.tools.classList.remove('hidden');
  els.cleanupPanel.classList.remove('hidden');
  renderDuplicateList();

  const scope = scan.scanMode === 'full' ? 'the full playlist' : 'currently loaded entries';
  setNotice(`Found ${scan.duplicateCount} extra ${scan.duplicateCount === 1 ? 'copy' : 'copies'} in ${scan.duplicateGroupCount} repeated ${scan.duplicateGroupCount === 1 ? 'video' : 'videos'} across ${scope}.`, scan.scanMode === 'full' ? 'warn' : 'neutral');
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id ?? null;
  return tab;
}

async function ensureContentScript() {
  if (!activeTabId) await getActiveTab();
  if (!activeTabId) throw new Error('No active tab.');

  try {
    const ping = await chrome.tabs.sendMessage(activeTabId, { type: 'YTPD_PING' });
    if (ping?.ok) return;
  } catch (_) {}

  await chrome.scripting.executeScript({
    target: { tabId: activeTabId },
    files: ['content.js']
  });
}

async function send(message) {
  if (!activeTabId) await getActiveTab();
  if (!activeTabId) throw new Error('No active tab.');
  return chrome.tabs.sendMessage(activeTabId, message);
}

async function loadPreferences() {
  const data = await chrome.storage.local.get(PREF_KEY);
  const prefs = data[PREF_KEY] || {};
  if (prefs.keepMode === 'last' || prefs.keepMode === 'first') els.keepMode.value = prefs.keepMode;
  if (['count', 'position', 'title'].includes(prefs.sortMode)) els.sortMode.value = prefs.sortMode;
}

async function savePreferences() {
  await chrome.storage.local.set({
    [PREF_KEY]: {
      keepMode: els.keepMode.value,
      sortMode: els.sortMode.value
    }
  });
}

async function initialize() {
  els.version.textContent = `v${chrome.runtime.getManifest().version}`;
  await loadPreferences();
  setStepState('scan');

  try {
    const tab = await getActiveTab();
    if (!tab?.url?.startsWith('https://www.youtube.com/')) {
      els.playlistTitle.textContent = 'Open a YouTube playlist';
      setNotice('Open YouTube™ and navigate to a playlist, then reopen this extension.', 'neutral');
      els.loadScanBtn.disabled = true;
      els.scanBtn.disabled = true;
      return;
    }

    await ensureContentScript();
    currentState = await send({ type: 'YTPD_GET_STATE' });
    els.playlistTitle.textContent = currentState.playlistTitle || 'YouTube playlist';
    els.playlistTitle.title = els.playlistTitle.textContent;

    if (currentState.isWatchWithPlaylist && currentState.canonicalPlaylistUrl) {
      setNotice('This is a video watch page inside a playlist. Use the dedicated playlist page so scanning and cleanup are predictable.', 'neutral');
      els.openPlaylistBtn.classList.remove('hidden');
      els.loadScanBtn.disabled = true;
      els.scanBtn.disabled = true;
      return;
    }

    if (!currentState.isPlaylistPage) {
      els.playlistTitle.textContent = 'Not a playlist page';
      setNotice('Open a dedicated YouTube™ playlist page to scan it.', 'neutral');
      els.loadScanBtn.disabled = true;
      els.scanBtn.disabled = true;
      return;
    }

    setNotice('Ready. A full scan is recommended before removing anything.', 'ok');
    if (currentState.lastScan) renderScan(currentState.lastScan);
    if (currentState.operation) showActiveOperation(currentState.operation);
  } catch (err) {
    setNotice('Reload the YouTube™ tab once after installing or updating the extension, then reopen it.', 'error');
  }
}

function showActiveOperation(operation) {
  const label = operation.kind === 'remove' ? 'Cleanup' : operation.kind === 'load' ? 'Full scan' : 'Scan';
  setWorking(true, `${label} is running in this tab…`);
  els.scanStatusBadge.textContent = 'Working…';
  els.scanStatusBadge.className = 'statusBadge warn';
  setNotice(operation.cancelled ? 'Stop requested. Waiting for the current action.' :
    `${label} is running. You can stop it here.`, 'warn');
  if (busyPoll) clearTimeout(busyPoll);
  busyPoll = setTimeout(async () => {
    try {
      const state = await send({ type: 'YTPD_GET_STATE' });
      if (state.operation) {
        showActiveOperation(state.operation);
      } else {
        currentState = state;
        renderScan(state.lastScan);
        setWorking(false);
        setNotice(operation.cancelled ? 'Operation stopped. Run a scan before continuing.' :
          'Operation finished. Review the current scan before continuing.', 'neutral');
      }
    } catch (err) {
      setWorking(false);
      setNotice(err.message || 'Could not check the operation. Reopen the popup.', 'error');
    }
  }, 900);
}

async function runScan(loadAll) {
  setStepState('scan');
  setWorking(true, loadAll ? 'Loading the full playlist…' : 'Scanning visible playlist entries…');
  els.progressBar.style.width = loadAll ? '8%' : '30%';
  els.scanStatusBadge.textContent = 'Scanning…';
  els.scanStatusBadge.className = 'statusBadge warn';
  try {
    const result = await send({ type: loadAll ? 'YTPD_LOAD_AND_SCAN' : 'YTPD_SCAN' });
    if (!result?.ok) throw new Error(result?.error || 'Scan failed.');
    els.progressBar.style.width = '100%';
    renderScan(result.scan);
  } catch (err) {
    els.scanStatusBadge.textContent = 'Scan failed';
    els.scanStatusBadge.className = 'statusBadge';
    setNotice(err.message || 'Scan failed.', 'error');
  } finally {
    setTimeout(() => setWorking(false), 180);
  }
}

function reportLines() {
  if (!lastScan) return [];
  return [
    'Playlist Deduper report',
    `Playlist: ${lastScan.playlistTitle || '(unknown)'}`,
    `Playlist ID: ${lastScan.playlistId || '(unknown)'}`,
    `Loaded entries: ${lastScan.totalCount}`,
    `Identified videos: ${lastScan.identifiedCount}`,
    `Unique video IDs: ${lastScan.uniqueCount}`,
    `Duplicate groups: ${lastScan.duplicateGroupCount}`,
    `Extra copies: ${lastScan.duplicateCount}`,
    `Skipped/unidentified entries: ${lastScan.skippedCount}`,
    `Keep mode: ${els.keepMode.value === 'last' ? 'last occurrence' : 'first occurrence'}`,
    '',
    ...lastScan.groups.map(group => {
      const selected = selectedIds.has(group.videoId) ? '[selected]' : '[not selected]';
      return `${selected}\t${group.count}x\t${group.title || '(untitled)'}\tpositions ${group.positions.join(',')}\thttps://www.youtube.com/watch?v=${group.videoId}`;
    })
  ];
}

function csvEscape(value) {
  const raw = String(value ?? '');
  const string = /^[\s\uFEFF]*[=+\-@]/u.test(raw) ? `'${raw}` : raw;
  return `"${string.replace(/"/g, '""')}"`;
}

function makeCsv() {
  const rows = [
    ['selected', 'video_id', 'title', 'copies', 'duplicate_copies', 'positions', 'url']
  ];
  for (const group of lastScan?.groups || []) {
    rows.push([
      selectedIds.has(group.videoId) ? 'yes' : 'no',
      group.videoId,
      group.title || '',
      group.count,
      group.count - 1,
      group.positions.join(' | '),
      `https://www.youtube.com/watch?v=${group.videoId}`
    ]);
  }
  return rows.map(row => row.map(csvEscape).join(',')).join('\r\n');
}

function safeFilename(value) {
  return (value || 'youtube-playlist')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'youtube-playlist';
}

els.openPlaylistBtn.addEventListener('click', async () => {
  if (!activeTabId || !currentState?.canonicalPlaylistUrl) return;
  await chrome.tabs.update(activeTabId, { url: currentState.canonicalPlaylistUrl });
  window.close();
});

els.loadScanBtn.addEventListener('click', () => runScan(true));
els.scanBtn.addEventListener('click', () => runScan(false));
els.confirmCheck.addEventListener('change', updateRemoveEnabled);

els.keepMode.addEventListener('change', async () => {
  resetConfirmation();
  renderDuplicateList();
  await savePreferences();
});

els.sortMode.addEventListener('change', async () => {
  renderDuplicateList();
  await savePreferences();
});

els.filterInput.addEventListener('input', renderDuplicateList);

els.selectAllBtn.addEventListener('click', () => {
  if (!lastScan) return;
  selectedIds = new Set(lastScan.groups.map(group => group.videoId));
  resetConfirmation();
  renderDuplicateList();
});

els.selectNoneBtn.addEventListener('click', () => {
  selectedIds.clear();
  resetConfirmation();
  renderDuplicateList();
});

els.copyBtn.addEventListener('click', async () => {
  if (!lastScan) return;
  await navigator.clipboard.writeText(reportLines().join('\n'));
  const old = els.copyBtn.textContent;
  els.copyBtn.textContent = 'Copied ✓';
  setTimeout(() => { els.copyBtn.textContent = old; }, 1100);
});

els.exportBtn.addEventListener('click', () => {
  if (!lastScan) return;
  const blob = new Blob([makeCsv()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFilename(lastScan.playlistTitle)}-duplicates.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

els.removeBtn.addEventListener('click', async () => {
  const copies = selectedDuplicateCopies();
  if (!lastScan || !copies || !els.confirmCheck.checked) return;

  setWorking(true, `Removing 0 of ${copies}…`);
  els.progressBar.style.width = '0%';
  try {
    const result = await send({
      type: 'YTPD_REMOVE_DUPLICATES',
      videoIds: [...selectedIds],
      keep: els.keepMode.value,
      scanToken: lastScan.scanToken,
      playlistId: lastScan.playlistId
    });
    if (!result?.ok) throw new Error(result?.error || 'Removal failed.');

    renderScan(result.scan);
    if (result.cancelled) {
      setNotice(`Stopped after removing ${result.removed}. Run a full scan before continuing.`, 'warn');
    } else if (result.failed > 0) {
      const firstReason = result.failures?.[0]?.reason;
      setNotice(`Removed ${result.removed}. ${result.failed} action${result.failed === 1 ? '' : 's'} could not be completed safely${firstReason ? `: ${firstReason}` : '.'}`, 'warn');
    } else if (result.scan?.duplicateCount === 0) {
      setNotice(`Done — removed ${result.removed} duplicate ${result.removed === 1 ? 'copy' : 'copies'} and verified the remaining entries.`, 'ok');
      setStepState('done');
    } else {
      setNotice(`Removed ${result.removed} duplicate ${result.removed === 1 ? 'copy' : 'copies'}. Review any remaining duplicate groups before continuing.`, 'ok');
    }
  } catch (err) {
    setNotice(err.message || 'Removal failed.', 'error');
  } finally {
    setWorking(false);
  }
});

els.cancelBtn.addEventListener('click', async () => {
  try { await send({ type: 'YTPD_CANCEL' }); } catch (_) {}
  setNotice('Stop requested. The current YouTube action may finish first.', 'warn');
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'YTPD_PROGRESS') return;
  const { phase, current = 0, total = 0, text = '' } = message;
  if (text) els.progressText.textContent = text;
  if (total > 0) {
    const pct = Math.max(0, Math.min(100, (current / total) * 100));
    els.progressBar.style.width = `${pct}%`;
  } else if (phase === 'loading') {
    els.progressBar.style.width = `${Math.min(85, 10 + current * 4)}%`;
  }
});

initialize();
