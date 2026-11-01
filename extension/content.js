chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    trackingEnabled: true,
    currentFen: '',
    moveHistory: [],
    lastUpdated: null
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    sendResponse({ ok: false, error: 'Missing message type' });
    return;
  }

  if (message.type === 'TRACK_STATE') {
    const fen = message.fen || '';
    const moves = Array.isArray(message.moves) ? message.moves : [];
    chrome.storage.local.set({
      trackingEnabled: true,
      currentFen: fen,
      moveHistory: moves,
      lastUpdated: new Date().toISOString()
    }, () => {
      sendResponse({ ok: true, fen, moves });
    });
    return true;
  }

  if (message.type === 'GET_STATE') {
    chrome.storage.local.get(['trackingEnabled', 'currentFen', 'moveHistory', 'lastUpdated'], (result) => {
      sendResponse({
        ok: true,
        trackingEnabled: result.trackingEnabled ?? true,
        fen: result.currentFen || '',
        moves: result.moveHistory || [],
        lastUpdated: result.lastUpdated || null
      });
    });
    return true;
  }

  sendResponse({ ok: false, error: 'Unknown message type' });
  return false;
});
