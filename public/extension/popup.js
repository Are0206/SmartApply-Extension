// SmartApply Extension - popup.js
const API = () => document.getElementById("apiUrl").value || "http://localhost:3000";

let currentMatched = {};

function detectFields() {
  const inputs = document.querySelectorAll('input, textarea, select');
  const fields = [];
  inputs.forEach(el => {
    let fieldName = el.name || el.id || '';
    if (!fieldName) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) {
        fieldName = label.textContent.toLowerCase().trim();
      } else if (el.placeholder) {
        fieldName = el.placeholder.toLowerCase().trim();
      }
    }
    if (fieldName) {
      fields.push({
        name: fieldName,
        selector: el.name ? `[name="${el.name}"]` : el.id ? `#${el.id}` : null,
        type: el.type || el.tagName.toLowerCase()
      });
    }
  });
  return fields;
}

document.addEventListener("DOMContentLoaded", () => {
  syncApiUrl();
  initSession();
  loadProfile();
  setupEventListeners();
  loadToggleState();
  loadProfileSelector();
});

// Mantiene apiUrl en storage para que el service worker (HU-15) use la misma URL.
function syncApiUrl() {
  const input = document.getElementById("apiUrl");
  if (!input) return;
  chrome.storage.local.get("apiUrl").then((res) => {
    if (res.apiUrl) input.value = res.apiUrl;
  }).catch(() => {});
  chrome.storage.local.set({ apiUrl: input.value }).catch(() => {});
  input.addEventListener("change", () => {
    chrome.storage.local.set({ apiUrl: input.value }).catch(() => {});
  });
}

function setupEventListeners() {
  document.getElementById("syncBtn").addEventListener("click", handleSync);
  document.getElementById("previewBtn").addEventListener("click", handlePreview);
  document.getElementById("autofillBtn").addEventListener("click", handleAutofill);
  document.getElementById("confirmFillBtn").addEventListener("click", confirmAndFill);
  document.getElementById("cancelConfirmBtn").addEventListener("click", cancelConfirm);
  document.getElementById("toggleSwitch").addEventListener("click", handleToggle);
  // HU-14
  document.getElementById("lockBtn").addEventListener("click", handleLock);
  document.getElementById("unlockBtn").addEventListener("click", handleUnlock);
  document.getElementById("masterPassword").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleUnlock();
  });
  const editBtn = document.getElementById("editBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  if (editBtn) editBtn.addEventListener("click", openEditForm);
  if (deleteBtn) deleteBtn.addEventListener("click", handleDeleteProfile);
  const newBtn = document.getElementById("newProfileBtn");
  if (newBtn) newBtn.addEventListener("click", createNewProfile);
  if (saveEditBtn) saveEditBtn.addEventListener("click", saveProfileEdit);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", () => {
    document.getElementById("editCard").style.display = "none";
  });
}

// ==================== SESION / SEGURIDAD (HU-14) ====================

async function hashPassword(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function initSession() {
  const { masterHash, sessionLocked } = await chrome.storage.local.get([
    "masterHash",
    "sessionLocked",
  ]);
  if (!masterHash) {
    showLockScreen({ firstTime: true });
  } else if (sessionLocked) {
    showLockScreen({ firstTime: false });
  } else {
    showMainApp();
  }
}

function showLockScreen({ firstTime }) {
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("lockScreen").classList.remove("hidden");
  document.getElementById("sessionError").textContent = "";
  document.getElementById("masterPassword").value = "";
  if (firstTime) {
    document.getElementById("lockTitle").textContent = "Configura tu acceso";
    document.getElementById("lockSubtitle").textContent =
      "Define una contrasena maestra o PIN para proteger tus datos.";
    document.getElementById("unlockBtn").textContent = "Guardar y entrar";
  } else {
    document.getElementById("lockTitle").textContent = "Extension bloqueada";
    document.getElementById("lockSubtitle").textContent =
      "Ingresa tu contrasena maestra para continuar.";
    document.getElementById("unlockBtn").textContent = "Desbloquear";
  }
  document.getElementById("masterPassword").focus();
}

function showMainApp() {
  document.getElementById("lockScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
}

async function handleLock() {
  await chrome.storage.local.set({ sessionLocked: true, autofillEnabled: false });
  setToggleState(false);
  addLog("Sesion cerrada. Autocompletado desactivado.");
  const { masterHash } = await chrome.storage.local.get("masterHash");
  showLockScreen({ firstTime: !masterHash });
}

async function handleUnlock() {
  const input = document.getElementById("masterPassword");
  const errorEl = document.getElementById("sessionError");
  const value = input.value.trim();

  if (!value) {
    errorEl.textContent = "Ingresa una contrasena.";
    return;
  }

  const { masterHash } = await chrome.storage.local.get("masterHash");
  const hash = await hashPassword(value);

  if (!masterHash) {
    await chrome.storage.local.set({ masterHash: hash, sessionLocked: false });
    addLog("Contrasena maestra configurada.");
    showMainApp();
    return;
  }

  if (hash === masterHash) {
    await chrome.storage.local.set({ sessionLocked: false });
    addLog("Sesion iniciada.");
    showMainApp();
  } else {
    errorEl.textContent = "Contrasena incorrecta.";
    input.value = "";
    input.focus();
  }
}

// ==================== SELECTOR DE PERFIL ACTIVO (HU-10) ====================

async function loadProfileSelector() {
  try {
    const res = await fetch(`${API()}/api/profiles`);
    const data = await res.json();
    if (!data.success) return;

    const profiles = data.data;
    const activeId = data.activeProfileId;

    const select = document.getElementById("profileSelect");
    if (!select) return;

    select.innerHTML = profiles.map(p =>
      `<option value="${p.id}" ${p.id === activeId ? "selected" : ""}>
        ${p.nombre} ${p.apellido} — ${p.titulo_profesional}
      </option>`
    ).join("");

    select.addEventListener("change", async () => {
      const selectedId = select.value;
      try {
        const res = await fetch(`${API()}/api/profiles/active`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedId })
        });
        const result = await res.json();
        if (result.success) {
          addLog("Perfil activo cambiado");
          loadProfile();
        }
      } catch (err) {
        addLog("Error al cambiar perfil: " + err.message);
      }
    });
  } catch (err) {
    console.error("Error cargando selector de perfiles:", err);
  }
}

// ==================== EDIT / DELETE PROFILE ====================

async function openEditForm() {
  const select = document.getElementById("profileSelect");
  if (!select) return;
  const id = select.value;
  try {
    const res = await fetch(`${API()}/api/profiles`);
    const list = await res.json();
    if (!list.success) return addLog("No se pudieron obtener perfiles");
    const p = (list.data || []).find(x => x.id === id);
    if (!p) return addLog("Perfil no encontrado para editar");

    const container = document.getElementById("editFields");
    container.innerHTML = [
      ["nombre",             "Nombre",              p.nombre],
      ["apellido",           "Apellido",             p.apellido],
      ["email",              "Email",                p.email],
      ["telefono",           "Telefono",             p.telefono],
      ["titulo_profesional", "Titulo profesional",   p.titulo_profesional],
      ["ubicacion",          "Ubicacion",            p.ubicacion],
      ["linkedin",           "LinkedIn URL",         p.linkedin],
      ["portfolio",          "Portfolio / Web",      p.portfolio],
      ["github",             "GitHub URL",           p.github],
      ["experiencia",        "Anos de experiencia",  p.experiencia],
      ["educacion",          "Educacion",            p.educacion],
      ["salario",            "Salario esperado",     p.salario],
      ["disponibilidad",     "Disponibilidad",       p.disponibilidad],
      ["resumen",            "Resumen profesional",  p.resumen],
      ["habilidades",        "Habilidades (separadas por coma)", Array.isArray(p.habilidades) ? p.habilidades.join(", ") : (p.habilidades || "")],
    ].map(([key, label, value]) =>
      `<div class="row" style="flex-direction:column;gap:2px;padding:4px 0;">
        <span class="lbl">${label}</span>
        <input data-key="${key}" class="session-input" value="${(value || "").toString().replace(/"/g, "&quot;")}" />
      </div>`
    ).join("");

    document.getElementById("editCard").style.display = "block";
    document.getElementById("editCard").scrollIntoView({ behavior: "smooth", block: "end" });
  } catch (err) {
    addLog("Error al abrir formulario de edicion: " + err.message);
  }
}

async function saveProfileEdit() {
  const select = document.getElementById("profileSelect");
  if (!select) return;
  const id = select.value;
  const inputs = document.querySelectorAll('#editFields [data-key]');
  const payload = {};
  inputs.forEach(inp => { payload[inp.dataset.key] = inp.value; });
  try {
    const res = await fetch(`${API()}/api/profiles/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload })
    });
    const data = await res.json();
    if (data.success) {
      addLog("Perfil actualizado");
      document.getElementById("editCard").style.display = "none";
      await loadProfileSelector();
      await loadProfile();
    } else {
      addLog("No se pudo actualizar el perfil");
    }
  } catch (err) {
    addLog("Error al guardar perfil: " + err.message);
    try {
      const option = select.querySelector(`option[value="${id}"]`);
      if (option) {
        const nombre = payload.nombre || option.textContent.split(' — ')[0] || 'Perfil';
        option.textContent = `${nombre} — (local)`;
      }
      document.getElementById("editCard").style.display = "none";
      await loadProfileSelector();
      await loadProfile();
    } catch (e) {}
  }
}

async function createNewProfile() {
  const nombre = prompt("Nombre:", "");
  if (nombre === null) return;
  const apellido  = prompt("Apellido:", "");
  const email     = prompt("Email:", "");
  const telefono  = prompt("Telefono:", "");
  const titulo    = prompt("Titulo profesional:", "");

  const payload = {
    nombre,
    apellido:           apellido || "",
    email:              email    || "",
    telefono:           telefono || "",
    titulo_profesional: titulo   || "",
    ubicacion: "", linkedin: "", portfolio: "", github: "",
    experiencia: "", educacion: "", salario: "",
    disponibilidad: "", resumen: "", habilidades: [],
  };

  try {
    const res = await fetch(`${API()}/api/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success && data.data) {
      addLog("Perfil creado");
      await loadProfileSelector();
      document.getElementById("profileSelect").value = data.data.id;
      await loadProfile();
      return;
    }
    throw new Error(data.message || "Error desconocido");
  } catch (err) {
    addLog("No se pudo crear en el backend.");
    const id = `local_${String(Date.now()).slice(-6)}`;
    const select = document.getElementById("profileSelect");
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = `${nombre} ${apellido || ""} — (local)`;
    select.appendChild(opt);
    select.value = id;
    await loadProfile();
  }
}

async function handleDeleteProfile() {
  const select = document.getElementById("profileSelect");
  if (!select) return;
  const id = select.value;
  if (!confirm("Eliminar este perfil? Esta accion no se puede deshacer.")) return;
  try {
    const res = await fetch(`${API()}/api/profiles/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      addLog("Perfil eliminado");
      await loadProfileSelector();
      await loadProfile();
    } else {
      addLog("No se pudo eliminar el perfil: " + (data.message || ""));
    }
  } catch (err) {
    addLog("Error al eliminar perfil: " + err.message);
  }
}

// ==================== TOGGLE STATE ====================

async function loadToggleState() {
  try {
    const result = await chrome.storage.local.get("autofillEnabled");
    const enabled = result.autofillEnabled !== false;
    setToggleState(enabled);
  } catch (err) {
    console.error("Error loading toggle state:", err);
    setToggleState(true);
  }
}

function setToggleState(enabled) {
  const toggle = document.getElementById("toggleSwitch");
  if (enabled) {
    toggle.classList.add("on");
  } else {
    toggle.classList.remove("on");
  }
}

async function handleToggle() {
  try {
    const result = await chrome.storage.local.get("autofillEnabled");
    const currentState = result.autofillEnabled !== false;
    const newState = !currentState;
    await chrome.storage.local.set({ autofillEnabled: newState });
    setToggleState(newState);
    addLog(newState ? "Autocompletado activado" : "Autocompletado desactivado");
  } catch (err) {
    addLog("Error: No se pudo cambiar el estado");
    console.error("Error handling toggle:", err);
  }
}

// ==================== SINCRONIZACION MANUAL (HU-16) ====================

async function handleSync() {
  const btn = document.getElementById("syncBtn");
  const msg = document.getElementById("syncMsg");

  btn.disabled = true;
  btn.textContent = "Sincronizando...";
  msg.className = "sync-msg hidden";

  try {
    const res = await fetch(`${API()}/api/profile`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data.success) throw new Error("API error");

    await Promise.allSettled([loadProfile(), loadProfileSelector()]);
    msg.textContent = "Datos actualizados";
    msg.className = "sync-msg ok";
    addLog("Sincronizacion manual exitosa");
  } catch {
    await loadProfile();
    msg.textContent = "Error de conexion";
    msg.className = "sync-msg err";
    addLog("Error de sincronizacion manual");
  } finally {
    btn.disabled = false;
    btn.textContent = "↻ Sincronizar";
    setTimeout(() => { msg.className = "sync-msg hidden"; }, 3000);
  }
}

// ==================== CACHE OFFLINE / CIFRADO (HU-NF-04) ====================

async function getEncryptionKey() {
  const { masterHash } = await chrome.storage.local.get("masterHash");
  if (!masterHash) return null;
  // SHA-256 produce 64 hex chars = 32 bytes → clave AES-256 perfecta
  const bytes = new Uint8Array(masterHash.match(/.{2}/g).map(b => parseInt(b, 16)));
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptData(obj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(obj));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ct: btoa(String.fromCharCode(...new Uint8Array(cipher)))
  };
}

async function decryptData(stored, key) {
  const iv = Uint8Array.from(atob(stored.iv), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(stored.ct), c => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(plain));
}

async function saveCachedProfile(profile) {
  try {
    const key = await getEncryptionKey();
    const value = key ? await encryptData(profile, key) : profile;
    await chrome.storage.local.set({ cachedProfile: value, cachedEncrypted: !!key, cachedAt: new Date().toISOString() });
  } catch { /* no bloquear flujo principal si el cache falla */ }
}

async function loadCachedProfile() {
  const { cachedProfile, cachedEncrypted } = await chrome.storage.local.get(["cachedProfile", "cachedEncrypted"]);
  if (!cachedProfile) return null;
  try {
    if (cachedEncrypted) {
      const key = await getEncryptionKey();
      if (!key) return null;
      return await decryptData(cachedProfile, key);
    }
    return cachedProfile;
  } catch {
    return null;
  }
}

async function fetchProfile() {
  try {
    const res = await fetch(`${API()}/api/profile`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data.success) throw new Error("API error");
    return data.data;
  } catch {
    return await loadCachedProfile();
  }
}

function renderProfileData(p) {
  document.getElementById("profileFields").innerHTML = [
    ["Nombre",       `${p.nombre} ${p.apellido}`],
    ["Email",        p.email],
    ["Telefono",     p.telefono],
    ["Titulo",       p.titulo_profesional],
    ["Ubicacion",    p.ubicacion],
    ["LinkedIn",     p.linkedin],
    ["Portfolio",    p.portfolio],
    ["GitHub",       p.github],
    ["Experiencia",  p.experiencia],
    ["Educacion",    p.educacion],
    ["Salario esp.", p.salario],
    ["Disponib.",    p.disponibilidad],
    ["Resumen",      p.resumen],
    ["Habilidades",  Array.isArray(p.habilidades) ? p.habilidades.join(", ") : p.habilidades],
  ]
  .filter(([, v]) => v)
  .map(([l, v]) => `<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`)
  .join("");
}

function setConnectionStatus(mode) {
  const dot   = document.getElementById("dot");
  const txt   = document.getElementById("statusTxt");
  const badge = document.getElementById("offlineBadge");
  if (mode === "online") {
    dot.className = "dot";
    txt.textContent = "Conectado";
    badge.classList.add("hidden");
  } else if (mode === "cache") {
    dot.className = "dot cache";
    txt.textContent = "Modo sin conexion";
    badge.classList.remove("hidden");
  } else {
    dot.className = "dot off";
    txt.textContent = "Sin conexion";
    badge.classList.add("hidden");
  }
}

// ==================== PERFIL ====================

async function loadProfile() {
  try {
    const res = await fetch(`${API()}/api/profile`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data.success) throw new Error("API error");
    const p = data.data;
    await saveCachedProfile(p);
    renderProfileData(p);
    setConnectionStatus("online");
  } catch {
    const cached = await loadCachedProfile();
    if (cached) {
      renderProfileData(cached);
      setConnectionStatus("cache");
      addLog("Perfil en cache (modo sin conexion)");
    } else {
      setConnectionStatus("error");
      document.getElementById("profileFields").innerHTML =
        '<p style="font-size:11px;color:#ef4444;">No se pudo conectar</p>';
    }
  }
}

// ==================== PREVIEW ====================

async function handlePreview() {
  try {
    addLog("Preview iniciado");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return addLog("No hay pestana activa");

    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    } catch (injectionErr) {
      console.warn("Content script ya estaba inyectado o no se pudo inyectar", injectionErr);
    }

    let result;
    try {
      result = await chrome.tabs.sendMessage(tab.id, { action: "detectFields" });
    } catch (msgErr) {
      addLog("Error: No se pudo comunicar con la pagina. Intenta recargar la pestana.");
      return;
    }

    const fields = result?.fields || [];
    const profile = await fetchProfile();
    if (!profile) { addLog("Sin perfil disponible"); return; }
    const mapping = buildMapping(profile);
    const matched = {};
    fields.forEach(f => {
      if (mapping[f.name]) matched[f.name] = mapping[f.name];
    });

    await chrome.tabs.sendMessage(tab.id, { action: "preview", data: matched });
    addLog(`Preview: ${Object.keys(matched).length} campos`);
  } catch (err) {
    addLog("Error: " + err.message);
  }
}

// ==================== AUTOFILL ====================

async function handleAutofill() {
  try {
    const sess = await chrome.storage.local.get("sessionLocked");
    if (sess.sessionLocked) {
      addLog("Sesion bloqueada. Inicia sesion para autocompletar.");
      return;
    }

    const result = await chrome.storage.local.get("autofillEnabled");
    const enabled = result.autofillEnabled !== false;
    if (!enabled) {
      addLog("Autocompletado esta desactivado. Activalo para continuar.");
      document.getElementById("statusTxt").textContent = "Autocompletado desactivado";
      return;
    }

    addLog("Autocompletar iniciado");
    document.getElementById("statusTxt").textContent = "Autocompletando...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return addLog("No hay pestana activa");

    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    } catch (injectionErr) {
      console.warn("Content script ya estaba inyectado o no se pudo inyectar", injectionErr);
    }

    let result2;
    try {
      result2 = await chrome.tabs.sendMessage(tab.id, { action: "detectFields" });
    } catch (msgErr) {
      addLog("Error: No se pudo comunicar con la pagina. Intenta recargar la pestana.");
      document.getElementById("statusTxt").textContent = "Error de comunicacion";
      return;
    }

    const fields = result2?.fields || [];
    if (!fields.length) {
      addLog("No se encontraron campos en la pagina.");
      document.getElementById("statusTxt").textContent = "No se encontraron campos";
      return;
    }

    console.log("[SmartApply] Campos detectados en la pagina:", fields.map(f => f.name));
    const profile = await fetchProfile();
    if (!profile) {
      addLog("Sin perfil disponible (sin conexion y sin cache)");
      document.getElementById("statusTxt").textContent = "Sin perfil disponible";
      return;
    }
    const mapping = buildMapping(profile);
    const matched = {};

    fields.forEach(f => {
      if (mapping[f.name]) {
        matched[f.name] = mapping[f.name];
        console.log(`[SmartApply] Campo "${f.name}" detectado y mapeado`);
      }
    });

    const tieneNombreCompleto  = fields.some(f => f.name === "nombre_completo");
    const tieneNombreOApellido = fields.some(f => f.name === "nombre" || f.name === "apellido");

    if (tieneNombreCompleto && !matched.nombre_completo) {
      matched.nombre_completo = `${profile.nombre} ${profile.apellido}`;
      console.log("[SmartApply] Campo nombre_completo agregado");
    } else if (!tieneNombreOApellido && !tieneNombreCompleto && Object.keys(matched).length === 0) {
      matched.nombre_completo = `${profile.nombre} ${profile.apellido}`;
      console.log("[SmartApply] Agregando nombre_completo como ultimo recurso");
    }

    console.log("[SmartApply] Campos finales para rellenar:", Object.keys(matched));
    currentMatched = matched;

    if (!Object.keys(matched).length) {
      addLog("No se detectaron coincidencias entre campos y perfil.");
      document.getElementById("statusTxt").textContent = "No se encontraron coincidencias";
      return;
    }

    showConfirmation(matched);
    document.getElementById("statusTxt").textContent = "Datos listos para confirmar";
    addLog(`Campos detectados: ${Object.keys(matched).length}`);
  } catch (err) {
    addLog("Error: " + err.message);
  }
}

function showConfirmation(matched) {
  const container = document.getElementById("confirmFields");
  container.innerHTML = Object.entries(matched).map(([name, info]) => {
    const value = typeof info === "object" && info !== null ? info.value : info;
    return `<div class="row">
      <span class="lbl">${name}:</span>
      <input type="text" class="confirm-input" data-field="${name}" value="${value || ""}"
        style="flex:1;margin-left:5px;padding:2px;font-size:11px;background:#334155;border:1px solid #475569;color:#e2e8f0;border-radius:3px;">
    </div>`;
  }).join("");
  const card = document.getElementById("confirmCard");
  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth", block: "end" });
}

async function confirmAndFill() {
  const sess = await chrome.storage.local.get("sessionLocked");
  if (sess.sessionLocked) {
    addLog("Sesion bloqueada. No se puede completar.");
    return;
  }

  const result = await chrome.storage.local.get("autofillEnabled");
  const enabled = result.autofillEnabled !== false;
  if (!enabled) {
    addLog("Autocompletado esta desactivado. No se puede completar.");
    return;
  }

  const inputs = document.querySelectorAll("#confirmFields .confirm-input");
  const data = {};
  inputs.forEach(input => { data[input.dataset.field] = input.value; });

  const profile = await fetchProfile();
  if (profile) {
    data.nombre   = profile.nombre;
    data.apellido = profile.apellido;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.tabs.sendMessage(tab.id, { action: "autofill", data, confirm: true });
    let filledFields = [...new Set(result?.fields || [])];

    addLog(`Autocompletado confirmado: ${filledFields.length} campos`);
    if (filledFields.length) {
      addLog(`Campos completados: ${filledFields.join(", ")}`);
      try {
        const fullUrl  = tab.url;
        const hostname = new URL(tab.url).hostname;
        const now = new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
        await fetch(`${API()}/api/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Formulario autocompletado",
            details: `Sitio: ${hostname} — Fecha: ${now} — URL: ${fullUrl}`,
            fields: filledFields,
            url: fullUrl,
            status: "completado"
          })
        });
      } catch (fetchErr) {
        console.error("Error al guardar en el historial:", fetchErr);
      }
    }
    document.getElementById("confirmCard").style.display = "none";
    document.getElementById("statusTxt").textContent = "Autocompletado aplicado";
  } catch (err) {
    addLog("Error al confirmar: " + err.message);
  }
}

function cancelConfirm() {
  document.getElementById("confirmCard").style.display = "none";
}

// ==================== MAPPING ====================

function buildMapping(p) {
  const fullName       = `${p.nombre} ${p.apellido}`.trim();
  const habilidadesStr = Array.isArray(p.habilidades)
    ? p.habilidades.join(", ")
    : (p.habilidades || "");

  return {
    // Nombre
    nombre: p.nombre, first_name: p.nombre, firstname: p.nombre,
    first: p.nombre, fname: p.nombre, name: p.nombre,

    // Apellido
    apellido: p.apellido, last_name: p.apellido, lastname: p.apellido,
    last: p.apellido, lname: p.apellido, surname: p.apellido,

    // Nombre completo
    nombre_completo: fullName, fullname: fullName,
    full_name: fullName, "full-name": fullName,

    // Email
    email: p.email, correo: p.email, mail: p.email,

    // Teléfono
    telefono: p.telefono, phone: p.telefono, tel: p.telefono,
    mobile: p.telefono, celular: p.telefono,

    // Título profesional
    titulo: p.titulo_profesional, titulo_profesional: p.titulo_profesional,
    title: p.titulo_profesional, job_title: p.titulo_profesional,
    position: p.titulo_profesional, cargo: p.titulo_profesional,

    // Ubicación
    ubicacion: p.ubicacion, location: p.ubicacion,
    ciudad: p.ubicacion, city: p.ubicacion,

    // LinkedIn
    linkedin: p.linkedin, linkedin_url: p.linkedin,

    // Portfolio
    portfolio: p.portfolio, portfolio_url: p.portfolio,
    website: p.portfolio, web: p.portfolio, url: p.portfolio,

    // GitHub
    github: p.github, github_url: p.github,

    // Resumen
    resumen: p.resumen, summary: p.resumen,
    bio: p.resumen, about: p.resumen, about_me: p.resumen,

    // Habilidades
    habilidades: habilidadesStr, skills: habilidadesStr,
    competencias: habilidadesStr,

    // Campos nuevos
    experiencia: p.experiencia, experience: p.experiencia,
    educacion: p.educacion, education: p.educacion,
    salario: p.salario, salary: p.salario,
    disponibilidad: p.disponibilidad, availability: p.disponibilidad,
  };
}

// ==================== LOG ====================

function addLog(msg) {
  const el = document.getElementById("log");
  const t  = new Date().toLocaleTimeString("es");
  const d  = document.createElement("div");
  d.textContent = `[${t}] ${msg}`;
  el.prepend(d);
}