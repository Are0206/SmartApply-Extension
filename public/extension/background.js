// SmartApply Extension - background.js (service worker)
// HU-15: Autocompletado manual mediante menu contextual (click derecho)

const PARENT_ID = "smartapply-root";

// Campos del perfil que se pueden insertar individualmente y su etiqueta visible.
// El orden aqui define el orden en el submenu.
const MENU_FIELDS = [
  { key: "nombre_completo", label: "Insertar Nombre completo" },
  { key: "nombre", label: "Insertar Nombre" },
  { key: "apellido", label: "Insertar Apellido" },
  { key: "email", label: "Insertar Email" },
  { key: "telefono", label: "Insertar Telefono" },
  { key: "titulo_profesional", label: "Insertar Titulo profesional" },
  { key: "ubicacion", label: "Insertar Ubicacion" },
  { key: "linkedin", label: "Insertar LinkedIn" },
  { key: "portfolio", label: "Insertar Portfolio" },
  { key: "resumen", label: "Insertar Resumen" },
  { key: "habilidades", label: "Insertar Habilidades" },
];

// URL del backend. Se sincroniza con la que el usuario configura en el popup.
async function getApiUrl() {
  try {
    const { apiUrl } = await chrome.storage.local.get("apiUrl");
    return apiUrl || "http://localhost:3000";
  } catch {
    return "http://localhost:3000";
  }
}

// Convierte el perfil del backend en un objeto plano { campo: valor }
// usando exactamente las mismas claves que MENU_FIELDS.
function buildProfileValues(p) {
  if (!p) return {};
  const fullName = `${p.nombre || ""} ${p.apellido || ""}`.trim();
  return {
    nombre_completo: fullName,
    nombre: p.nombre || "",
    apellido: p.apellido || "",
    email: p.email || "",
    telefono: p.telefono || "",
    titulo_profesional: p.titulo_profesional || "",
    ubicacion: p.ubicacion || "",
    linkedin: p.linkedin || "",
    portfolio: p.portfolio || "",
    resumen: p.resumen || "",
    habilidades: Array.isArray(p.habilidades) ? p.habilidades.join(", ") : (p.habilidades || ""),
  };
}

// (Re)construye el menu contextual. Solo aparece sobre campos editables.
function buildMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: PARENT_ID,
      title: "SmartApply",
      contexts: ["editable"],
    });

    for (const field of MENU_FIELDS) {
      chrome.contextMenus.create({
        id: `smartapply-field-${field.key}`,
        parentId: PARENT_ID,
        title: field.label,
        contexts: ["editable"],
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(buildMenu);
chrome.runtime.onStartup.addListener(buildMenu);

// Al hacer clic en una opcion del submenu: obtener el perfil activo,
// resolver el valor del campo elegido y pedir al content script que lo
// inserte UNICAMENTE en el campo donde se hizo clic derecho.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;
  if (!info.menuItemId || !String(info.menuItemId).startsWith("smartapply-field-")) return;

  // HU-14: si la sesion esta bloqueada, no se inserta nada.
  const { sessionLocked } = await chrome.storage.local.get("sessionLocked");
  if (sessionLocked) {
    chrome.tabs.sendMessage(tab.id, {
      action: "smartapplyToast",
      message: "SmartApply esta bloqueado. Inicia sesion en la extension.",
    });
    return;
  }

  const fieldKey = String(info.menuItemId).replace("smartapply-field-", "");

  let profile = null;
  try {
    const apiUrl = await getApiUrl();
    const res = await fetch(`${apiUrl}/api/profile`);
    const json = await res.json();
    if (json && json.success) profile = json.data;
  } catch (err) {
    chrome.tabs.sendMessage(tab.id, {
      action: "smartapplyToast",
      message: "SmartApply: no se pudo conectar con el backend.",
    });
    return;
  }

  const values = buildProfileValues(profile);
  const value = values[fieldKey];

  if (!value) {
    chrome.tabs.sendMessage(tab.id, {
      action: "smartapplyToast",
      message: "SmartApply: ese campo del perfil esta vacio.",
    });
    return;
  }

  chrome.tabs.sendMessage(tab.id, {
    action: "insertSingleField",
    field: fieldKey,
    value,
  });
});