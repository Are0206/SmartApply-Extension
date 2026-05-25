// SmartApply Extension - popup.js
const API = () => document.getElementById("apiUrl").value || "http://localhost:3000";

let currentMatched = {};
function detectFields() {
  const inputs = document.querySelectorAll('input, textarea, select');
  const fields = [];
  inputs.forEach(el => {
    let fieldName = el.name || el.id || '';
    if (!fieldName) {
      // Buscar label asociado
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
  // Edit / Delete buttons in the popup
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

// Hash SHA-256 de la contrasena maestra (no se guarda en texto plano).
async function hashPassword(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Decide que pantalla mostrar al abrir el popup.
async function initSession() {
  const { masterHash, sessionLocked } = await chrome.storage.local.get([
    "masterHash",
    "sessionLocked",
  ]);

  if (!masterHash) {
    // Primer uso: pedir que defina la contrasena maestra.
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

// Cerrar sesion / bloquear: desactiva autocompletado (HU-11) y bloquea.
async function handleLock() {
  await chrome.storage.local.set({ sessionLocked: true, autofillEnabled: false });
  setToggleState(false);
  addLog("Sesion cerrada. Autocompletado desactivado.");
  const { masterHash } = await chrome.storage.local.get("masterHash");
  showLockScreen({ firstTime: !masterHash });
}

// Desbloquear (o configurar por primera vez la contrasena).
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
    // Primer uso: guardar la contrasena y entrar.
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
          addLog(`Perfil activo cambiado`);
          loadProfile(); // Recargar datos del perfil activo en la card
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
    // Fetch list and find locally to avoid issues with dynamic route mismatch
    const res = await fetch(`${API()}/api/profiles`);
    const list = await res.json();
    if (!list.success) return addLog("No se pudieron obtener perfiles");
    const p = (list.data || []).find(x => x.id === id);
    if (!p) return addLog("Perfil no encontrado para editar");
    const container = document.getElementById("editFields");
    container.innerHTML = [
      ["nombre", "Nombre", p.nombre],
      ["apellido", "Apellido", p.apellido],
      ["email", "Email", p.email],
      ["telefono", "Telefono", p.telefono],
      ["titulo_profesional", "Titulo", p.titulo_profesional]
    ].map(([key, label, value]) =>
      `<div class=\"row\" style=\"align-items:center;gap:8px;\"><span class=\"lbl\">${label}</span><input data-key=\"${key}\" class=\"session-input\" value=\"${(value||"").replace(/\"/g,'&quot;')}\" /></div>`
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
    // Use fallback POST /api/profiles/update to avoid dynamic route issues
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
    // Fallback: aplicar cambio localmente en el selector para mostrar al usuario el efecto
    try {
      const select = document.getElementById("profileSelect");
      const option = select.querySelector(`option[value="${id}"]`);
      if (option) {
        // actualizar texto de la opción con nuevo nombre si existe
        const nombre = payload.nombre || option.textContent.split(' — ')[0] || 'Perfil';
        option.textContent = `${nombre} — (local)`;
      }
      document.getElementById("editCard").style.display = "none";
      await loadProfileSelector();
      await loadProfile();
    } catch (e) {}
  }
}

// Crear nuevo perfil (UI + POST al backend). Si falla el POST, crea un perfil temporal en el selector.
async function createNewProfile() {
  const nombre = prompt("Nombre para el nuevo perfil:", "Nuevo");
  if (nombre === null) return;
  const payload = { nombre, apellido: "", email: "", telefono: "", titulo_profesional: "" };
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
      const select = document.getElementById("profileSelect");
      select.value = data.data.id;
      await loadProfile();
      return;
    }
    throw new Error(data.message || 'Error desconocido');
  } catch (err) {
    addLog("No se pudo crear en el backend, creando localmente.");
    // Fallback local: agregar opción temporal
    try {
      const id = `local_${String(Date.now()).slice(-6)}`;
      const select = document.getElementById("profileSelect");
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${nombre} — (local)`;
      select.appendChild(opt);
      select.value = id;
      await loadProfile();
    } catch (e) { console.error(e); }
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
    const enabled = result.autofillEnabled !== false; // Default to true
    setToggleState(enabled);
  } catch (err) {
    console.error("Error loading toggle state:", err);
    setToggleState(true); // Default to enabled
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
    
    const status = newState ? "Autocompletado activado" : "Autocompletado desactivado";
    addLog(status);
  } catch (err) {
    addLog("Error: No se pudo cambiar el estado");
    console.error("Error handling toggle:", err);
  }
}

async function loadProfile() {
  try {
    const res = await fetch(`${API()}/api/profile`);
    const data = await res.json();
    if (data.success) {
      const p = data.data;
      document.getElementById("profileFields").innerHTML = [
        ["Nombre", `${p.nombre} ${p.apellido}`],
        ["Email", p.email],
        ["Telefono", p.telefono],
        ["Titulo", p.titulo_profesional],
      ].map(([l, v]) => `<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("");
      document.getElementById("dot").className = "dot";
      document.getElementById("statusTxt").textContent = "Conectado";
    }
  } catch {
    document.getElementById("dot").className = "dot off";
    document.getElementById("statusTxt").textContent = "Sin conexion";
    document.getElementById("profileFields").innerHTML = '<p style="font-size:11px;color:#ef4444;">No se pudo conectar</p>';
  }
}

async function handlePreview() {
  try {
    addLog("Preview iniciado");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return addLog("No hay pestaña activa");
    
    // Inyectar el content script si no está inyectado
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
    } catch (injectionErr) {
      console.warn("Content script ya estaba inyectado o no se pudo inyectar", injectionErr);
    }
    
    let result;
    try {
      result = await chrome.tabs.sendMessage(tab.id, { action: "detectFields" });
    } catch (msgErr) {
      addLog("Error: No se pudo comunicar con la página. Intenta recargar la pestaña.");
      console.error("Send message error:", msgErr);
      return;
    }
    
    const fields = result?.fields || [];
    const res = await fetch(`${API()}/api/profile`);
    const profile = (await res.json()).data;
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

async function handleAutofill() {
  try {
    // HU-14: no autocompletar con la sesion bloqueada.
    const sess = await chrome.storage.local.get("sessionLocked");
    if (sess.sessionLocked) {
      addLog("Sesion bloqueada. Inicia sesion para autocompletar.");
      return;
    }

    // Verificar si autocompletado está habilitado
    const result = await chrome.storage.local.get("autofillEnabled");
    const enabled = result.autofillEnabled !== false;
    
    if (!enabled) {
      addLog("Autocompletado está desactivado. Actívalo para continuar.");
      document.getElementById("statusTxt").textContent = "Autocompletado desactivado";
      return;
    }
    
    addLog("Autocompletar iniciado");
    document.getElementById("statusTxt").textContent = "Autocompletando...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return addLog("No hay pestaña activa");
    
    // Inyectar el content script si no está inyectado
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
    } catch (injectionErr) {
      console.warn("Content script ya estaba inyectado o no se pudo inyectar", injectionErr);
    }
    
    let result2;
    try {
      result2 = await chrome.tabs.sendMessage(tab.id, { action: "detectFields" });
    } catch (msgErr) {
      addLog("Error: No se pudo comunicar con la página. Intenta recargar la pestaña.");
      document.getElementById("statusTxt").textContent = "Error de comunicación";
      console.error("Send message error:", msgErr);
      return;
    }
    
    const fields = result2?.fields || [];
    if (!fields.length) {
      addLog("No se encontraron campos en la página.");
      document.getElementById("statusTxt").textContent = "No se encontraron campos";
      return;
    }
    console.log("[SmartApply] Campos detectados en la página:", fields.map(f => f.name));
    const res = await fetch(`${API()}/api/profile`);
    const profile = (await res.json()).data;
    const mapping = buildMapping(profile);
    const matched = {};
    
    // Mapear SOLO los campos que están realmente en la página
    fields.forEach(f => {
      if (mapping[f.name]) {
        matched[f.name] = mapping[f.name];
        console.log(`[SmartApply] ✓ Campo "${f.name}" detectado y mapeado`);
      }
    });
    
    // SOLO agregar nombre_completo como fallback si:
    // 1. La página tiene un campo "nombre_completo" detectado, O
    // 2. La página NO tiene "nombre" ni "apellido" pero tenemos datos para llenar
    const tieneNombreCompleto = fields.some(f => f.name === "nombre_completo");
    const tieneNombreOApellido = fields.some(f => f.name === "nombre" || f.name === "apellido");
    
    if (tieneNombreCompleto && !matched.nombre_completo) {
      // La página tiene nombre_completo, asegurarse de rellenarlo
      matched.nombre_completo = `${profile.nombre} ${profile.apellido}`;
      console.log("[SmartApply] Campo nombre_completo agregado");
    } else if (!tieneNombreOApellido && !tieneNombreCompleto && Object.keys(matched).length === 0) {
      // No detectó nada de nombre, agregar nombre_completo como último recurso
      matched.nombre_completo = `${profile.nombre} ${profile.apellido}`;
      console.log("[SmartApply] Agregando nombre_completo como último recurso");
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
      <input type="text" class="confirm-input" data-field="${name}" value="${value || ""}" style="flex:1; margin-left:5px; padding:2px; font-size:11px; background:#334155; border:1px solid #475569; color:#e2e8f0; border-radius:3px;">
    </div>`;
  }).join("");
  const card = document.getElementById("confirmCard");
  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth", block: "end" });
}

async function confirmAndFill() {
  // HU-14: no completar con la sesion bloqueada.
  const sess = await chrome.storage.local.get("sessionLocked");
  if (sess.sessionLocked) {
    addLog("Sesion bloqueada. No se puede completar.");
    return;
  }

  // Verificar si autocompletado está habilitado
  const result = await chrome.storage.local.get("autofillEnabled");
  const enabled = result.autofillEnabled !== false;
  
  if (!enabled) {
    addLog("Autocompletado está desactivado. No se puede completar.");
    return;
  }
  
  const inputs = document.querySelectorAll("#confirmFields .confirm-input");
  const data = {};
  inputs.forEach(input => {
    data[input.dataset.field] = input.value;
  });
  
  // Obtener perfil para incluir nombre y apellido por separado
  try {
    const res = await fetch(`${API()}/api/profile`);
    const profile = (await res.json()).data;
    
    // Siempre agregar nombre y apellido por separado para soportar nombre_completo
    data.nombre = profile.nombre;
    data.apellido = profile.apellido;
  } catch (err) {
    console.error("Error obtener perfil:", err);
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.tabs.sendMessage(tab.id, { action: "autofill", data, confirm: true });
    let filledFields = result?.fields || [];
    
    // Remover duplicados de filledFields
    filledFields = [...new Set(filledFields)];
    
    addLog(`Autocompletado confirmado: ${filledFields.length} campos`);
    if (filledFields.length) {
      addLog(`Campos completados: ${filledFields.join(", ")}`);
      try {
        const fullUrl = tab.url;
        const hostname = new URL(tab.url).hostname;
        const now = new Date().toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "short",
        });

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

function buildMapping(p) {
  const fullName = `${p.nombre} ${p.apellido}`;
  return {
    // Nombre individual
    nombre: p.nombre, 
    first_name: p.nombre, 
    firstname: p.nombre,
    first: p.nombre,
    
    // Apellido
    apellido: p.apellido, 
    last_name: p.apellido,
    lastname: p.apellido,
    last: p.apellido,
    
    // Nombre completo
    nombre_completo: fullName,
    fullname: fullName,
    full_name: fullName,
    "full-name": fullName,
    
    // Email
    email: p.email, 
    correo: p.email, 
    
    // Teléfono
    telefono: p.telefono, 
    phone: p.telefono,
    
    // Otros
    linkedin: p.linkedin, 
    portfolio: p.portfolio, 
    website: p.portfolio,
    ubicacion: p.ubicacion, 
    location: p.ubicacion, 
    titulo: p.titulo_profesional,
    title: p.titulo_profesional, 
    resumen: p.resumen, 
    summary: p.resumen, 
    mensaje: p.resumen,
    habilidades: (p.habilidades || []).join(", "), 
    skills: (p.habilidades || []).join(", "),
  };
}

function addLog(msg) {
  const el = document.getElementById("log");
  const t = new Date().toLocaleTimeString("es");
  const d = document.createElement("div");
  d.textContent = `[${t}] ${msg}`;
  el.prepend(d);
}