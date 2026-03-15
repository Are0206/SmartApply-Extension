const API_BASE = 'http://localhost:3000/api';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });

  chrome.contextMenus.create({
    id: 'smartapply-autofill',
    title: 'SmartApply: Autocompletar campo',
    contexts: ['editable'],
  });
});

// Log form-fill events sent by content.js and forward to the backend
chrome.runtime.onMessage.addListener((message) => {
  if (message.action !== 'log_form_filled') return;

  chrome.storage.local.get('profileId', ({ profileId }) => {
    if (!profileId) return;

    fetch(`${API_BASE}/webhook/form-filled`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        url: message.url,
        fields: message.fields,
      }),
    }).catch(() => {
      // Silently ignore network errors; the log is best-effort
    });
  });
});

// Context menu: autofill the focused editable field
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'smartapply-autofill') {
    chrome.tabs.sendMessage(tab.id, { action: 'autofill' });
  }
});
