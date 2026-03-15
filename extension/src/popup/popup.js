const API_BASE = 'http://localhost:3000/api';

const toggleEl = document.getElementById('toggle-enabled');
const profileInfoEl = document.getElementById('profile-info');
const statusBadgeEl = document.getElementById('status-badge');
const connectionStatusEl = document.getElementById('connection-status');
const notificationEl = document.getElementById('notification');
const btnAutofill = document.getElementById('btn-autofill');
const btnSync = document.getElementById('btn-sync');

function showNotification(message, type = 'success') {
  notificationEl.textContent = message;
  notificationEl.className = type;
  setTimeout(() => {
    notificationEl.className = '';
    notificationEl.textContent = '';
  }, 3000);
}

async function loadSettings() {
  const { enabled = true } = await chrome.storage.local.get('enabled');
  toggleEl.checked = enabled;
}

async function loadProfile() {
  try {
    const { profileId } = await chrome.storage.local.get('profileId');
    if (!profileId) {
      profileInfoEl.innerHTML = '<p>No hay perfil configurado.</p>';
      connectionStatusEl.textContent = 'Sin perfil';
      statusBadgeEl.textContent = 'Sin perfil';
      return;
    }

    const response = await fetch(`${API_BASE}/profile/${profileId}`);
    if (!response.ok) throw new Error('Error al obtener el perfil');

    const profile = await response.json();
    await chrome.storage.local.set({ cachedProfile: profile });

    renderProfile(profile);
    connectionStatusEl.textContent = 'Conectado · Datos actualizados';
    connectionStatusEl.className = '';
    statusBadgeEl.textContent = 'Activo';
  } catch {
    const { cachedProfile } = await chrome.storage.local.get('cachedProfile');
    if (cachedProfile) {
      renderProfile(cachedProfile);
      connectionStatusEl.textContent = '⚠ Modo sin conexión — Datos en caché';
      connectionStatusEl.className = 'offline';
      statusBadgeEl.textContent = 'Sin conexión';
    } else {
      profileInfoEl.innerHTML = '<p>Error de conexión con la API.</p>';
      connectionStatusEl.textContent = 'Error de conexión';
      connectionStatusEl.className = 'error';
      statusBadgeEl.textContent = 'Error';
    }
  }
}

function renderProfile(profile) {
  profileInfoEl.innerHTML = `
    <p><span>Nombre:</span> ${profile.name || '—'}</p>
    <p><span>Email:</span> ${profile.email || '—'}</p>
    <p><span>Teléfono:</span> ${profile.phone || '—'}</p>
    ${profile.address ? `<p><span>Dirección:</span> ${profile.address}</p>` : ''}
  `;
}

toggleEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ enabled: toggleEl.checked });
  showNotification(toggleEl.checked ? 'Autocompletar activado' : 'Autocompletar desactivado');
});

btnAutofill.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'autofill' });
  showNotification('Autocompletando formulario…');
  window.close();
});

btnSync.addEventListener('click', async () => {
  btnSync.textContent = '↻ Sincronizando…';
  btnSync.disabled = true;
  await loadProfile();
  btnSync.textContent = '↻ Sincronizar perfil';
  btnSync.disabled = false;
  showNotification('Perfil sincronizado');
});

loadSettings();
loadProfile();
