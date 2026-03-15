/**
 * background.js
 * SmartApply service worker (Manifest V3).
 * Sets the default enabled state on first install so content scripts always
 * have a value to read from chrome.storage.local.
 */

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({ smartapplyEnabled: true });
  }
});
