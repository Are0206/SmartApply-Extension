/**
 * popup.js
 * Manages the activate/deactivate toggle for SmartApply autocomplete.
 * State is persisted in chrome.storage.local so it survives browser restarts.
 */

const toggleInput = document.getElementById('toggleEnabled');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');

/**
 * Updates the UI to reflect the current enabled state.
 * @param {boolean} enabled
 */
function updateUI(enabled) {
  toggleInput.checked = enabled;

  if (enabled) {
    statusBadge.className = 'status-badge enabled';
    statusText.textContent = 'Extensión activa — los formularios serán autocompletados';
  } else {
    statusBadge.className = 'status-badge disabled';
    statusText.textContent = 'Extensión desactivada — no se completará ningún campo';
  }
}

// Load the saved state when the popup opens (default: enabled).
chrome.storage.local.get({ smartapplyEnabled: true }, ({ smartapplyEnabled }) => {
  updateUI(smartapplyEnabled);
});

// Persist the new state whenever the user flips the toggle.
toggleInput.addEventListener('change', () => {
  const enabled = toggleInput.checked;
  chrome.storage.local.set({ smartapplyEnabled: enabled }, () => {
    updateUI(enabled);
  });
});
