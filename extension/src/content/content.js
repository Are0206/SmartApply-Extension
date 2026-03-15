const API_BASE = 'http://localhost:3000/api';

const FIELD_MAP = {
  name: ['name', 'full_name', 'fullname', 'nombre', 'nombre_completo'],
  email: ['email', 'e-mail', 'correo', 'correo_electronico'],
  phone: ['phone', 'tel', 'telephone', 'telefono', 'mobile', 'celular'],
  address: ['address', 'direccion', 'street', 'calle'],
  linkedin: ['linkedin'],
  portfolio: ['portfolio', 'website', 'sitio_web'],
};

async function getActiveProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['profileId', 'cachedProfile'], ({ profileId, cachedProfile }) => {
      resolve({ profileId, cachedProfile });
    });
  });
}

function matchField(input) {
  const attr = [
    input.name,
    input.id,
    input.placeholder,
    input.getAttribute('autocomplete'),
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase().replace(/[\s-]/g, '_'));

  for (const [key, aliases] of Object.entries(FIELD_MAP)) {
    if (attr.some((a) => aliases.some((alias) => a.includes(alias)))) {
      return key;
    }
  }
  return null;
}

function fillInput(input, value) {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.blur();
}

async function autofill(profile) {
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
  const filled = [];

  inputs.forEach((input) => {
    const field = matchField(input);
    if (field && profile[field] && !input.value) {
      fillInput(input, profile[field]);
      filled.push(field);
    }
  });

  if (filled.length > 0) {
    chrome.runtime.sendMessage({
      action: 'log_form_filled',
      url: window.location.href,
      fields: filled,
    });
  }

  return filled;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'autofill') return;

  chrome.storage.local.get(['enabled', 'cachedProfile'], async ({ enabled, cachedProfile }) => {
    if (!enabled) {
      sendResponse({ filled: [], skipped: true });
      return;
    }

    let profile = cachedProfile;
    if (!profile) {
      try {
        const { profileId } = await new Promise((r) =>
          chrome.storage.local.get('profileId', r)
        );
        if (profileId) {
          const res = await fetch(`${API_BASE}/profile/${profileId}`);
          if (res.ok) {
            profile = await res.json();
            chrome.storage.local.set({ cachedProfile: profile });
          }
        }
      } catch {
        // use cached
      }
    }

    if (!profile) {
      sendResponse({ filled: [], error: 'No profile available' });
      return;
    }

    const filled = await autofill(profile);
    sendResponse({ filled });
  });

  return true; // keep channel open for async response
});
