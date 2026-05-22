// SmartApply Extension - content.js
// Detecta campos de formularios en la pagina de forma inteligente

(function () {
  "use strict";

  // --- MAPEO INTELIGENTE DE CAMPOS DEL PERFIL A FORMULARIOS ---
  const fieldMappings = {
    nombre: ["nombre", "first_name", "firstname", "first", "fname", "name", "given_name"],
    apellido: ["apellido", "last_name", "lastname", "last", "lname", "surname", "apellidos"],
    nombre_completo: ["nombre_completo", "fullname", "full_name", "full-name", "nombre completo", "namefull"],
    email: ["email", "correo", "mail", "e-mail", "e_mail"],
    telefono: ["telefono", "phone", "tel", "mobile", "cellphone", "phone_number", "cel", "telephone"],
    titulo_profesional: ["titulo", "titulo_profesional", "job_title", "title", "profession", "cargo", "position", "puesto"],
    ubicacion: ["ubicacion", "location", "ciudad", "city", "country", "pais", "address", "lugar", "state", "provincia"],
    linkedin: ["linkedin", "linkedin_url", "linkedinurl"],
    portfolio: ["portfolio", "portfolio_url", "web", "website", "url"],
    resumen: ["resumen", "summary", "bio", "about", "description", "about_me", "biografía"],
    habilidades: ["habilidades", "skills", "competencias"],
  };

  const allowedInputTypes = ["text", "email", "tel", "number", "url", ""];

  // Función para obtener el texto visible de un label asociado a un input
  function getLabelText(input) {
    if (!input) return "";
    
    const ariaLabel = input.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.toLowerCase();
    
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.toLowerCase();
    }
    
    const parentLabel = input.closest("label");
    if (parentLabel) return parentLabel.textContent.toLowerCase();
    
    const container = input.closest("div");
    if (container) {
      const siblingLabel = container.querySelector("label");
      if (siblingLabel) return siblingLabel.textContent.toLowerCase();
    }
    
    return "";
  }

  // Función mejorada para detectar qué campo es
  function identifyField(input) {
    const name = (input.name || "").toLowerCase();
    const id = (input.id || "").toLowerCase();
    const placeholder = (input.placeholder || "").toLowerCase();
    const ariaLabel = (input.getAttribute("aria-label") || "").toLowerCase();
    const labelText = getLabelText(input);
    
    // Crear palabras individuales para búsqueda más inteligente
    const allText = [name, id, placeholder, ariaLabel, labelText].join(" ");
    const words = allText.split(/[\s_-]+/).filter(w => w.length > 0);
    
    // Buscar coincidencias con los mappings, priorizando términos más específicos
    const specificFields = ["nombre_completo", "apellido", "nombre"];
    
    for (const field of specificFields) {
      const keywords = fieldMappings[field];
      for (const keyword of keywords) {
        // Buscar palabra exacta (no substring)
        if (words.includes(keyword) || allText === keyword) {
          return field;
        }
      }
    }
    
    // Luego buscar otros campos (búsqueda de substring está bien para estos)
    for (const [profileField, keywords] of Object.entries(fieldMappings)) {
      if (["nombre_completo", "apellido", "nombre"].includes(profileField)) continue;
      for (const keyword of keywords) {
        if (allText.includes(keyword)) {
          return profileField;
        }
      }
    }
    
    return null;
  }

  // Función mejorada para validar campos
  function isValidField(el) {
    if (!el) return false;
    
    const tagName = el.tagName ? el.tagName.toLowerCase() : "";
    const type = el.type ? el.type.toLowerCase() : "text";
    
    if (tagName !== "input" && tagName !== "textarea") return false;
    if (tagName === "input" && !allowedInputTypes.includes(type)) return false;
    
    return identifyField(el) !== null;
  }

  function showAutofillNotification(filledFields) {
    if (!Array.isArray(filledFields) || !filledFields.length) return;

    const previous = document.getElementById("smartapply-autofill-notification");
    if (previous) previous.remove();

    const container = document.createElement("div");
    container.id = "smartapply-autofill-notification";
    container.style.position = "fixed";
    container.style.right = "16px";
    container.style.bottom = "16px";
    container.style.zIndex = "2147483647";
    container.style.maxWidth = "360px";
    container.style.width = "calc(100vw - 32px)";
    container.style.background = "#0f172a";
    container.style.color = "#e2e8f0";
    container.style.border = "1px solid #334155";
    container.style.borderRadius = "10px";
    container.style.boxShadow = "0 12px 28px rgba(0,0,0,0.35)";
    container.style.fontFamily = "system-ui, -apple-system, Segoe UI, sans-serif";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.padding = "10px 12px";
    header.style.borderBottom = "1px solid #1e293b";

    const title = document.createElement("strong");
    title.textContent = "SmartApply completó el formulario";
    title.style.fontSize = "13px";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Cerrar";
    closeBtn.style.background = "transparent";
    closeBtn.style.color = "#38bdf8";
    closeBtn.style.border = "1px solid #38bdf8";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.padding = "4px 8px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "12px";
    closeBtn.addEventListener("click", () => container.remove());

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.style.padding = "10px 12px";

    const subtitle = document.createElement("p");
    subtitle.textContent = "Campos completados:";
    subtitle.style.margin = "0 0 8px 0";
    subtitle.style.fontSize = "12px";
    subtitle.style.color = "#94a3b8";

    const list = document.createElement("ul");
    list.style.margin = "0";
    list.style.paddingLeft = "18px";
    list.style.fontSize = "12px";

    filledFields.forEach((field) => {
      const item = document.createElement("li");
      item.textContent = field;
      list.appendChild(item);
    });

    body.appendChild(subtitle);
    body.appendChild(list);
    container.appendChild(header);
    container.appendChild(body);
    document.body.appendChild(container);
  }

  // --- HU-15: recordar el ultimo campo donde se hizo clic derecho ---
  // El menu contextual se construye en el service worker; cuando el usuario
  // elige una opcion ya no tenemos garantia de cual era el campo "activo",
  // asi que lo guardamos en el momento del contextmenu.
  let lastRightClickedEl = null;
  document.addEventListener(
    "contextmenu",
    (e) => {
      const el = e.target;
      const tag = el && el.tagName ? el.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea") {
        lastRightClickedEl = el;
      } else {
        lastRightClickedEl = null;
      }
    },
    true
  );

  // Inserta un valor en un unico elemento, disparando los eventos que los
  // frameworks (React, etc.) necesitan para detectar el cambio.
  function setFieldValue(el, value) {
    if (!el) return false;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // Toast ligero reutilizable para mensajes de HU-14/HU-15.
  function showSmartApplyToast(message) {
    const prev = document.getElementById("smartapply-toast");
    if (prev) prev.remove();
    const toast = document.createElement("div");
    toast.id = "smartapply-toast";
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.right = "16px";
    toast.style.bottom = "16px";
    toast.style.zIndex = "2147483647";
    toast.style.maxWidth = "320px";
    toast.style.background = "#0f172a";
    toast.style.color = "#e2e8f0";
    toast.style.border = "1px solid #334155";
    toast.style.borderRadius = "8px";
    toast.style.padding = "10px 12px";
    toast.style.fontSize = "12px";
    toast.style.fontFamily = "system-ui, -apple-system, Segoe UI, sans-serif";
    toast.style.boxShadow = "0 12px 28px rgba(0,0,0,0.35)";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

      // HU-15: insertar un solo campo en el input del clic derecho.
      if (msg.action === "insertSingleField") {
        let target = lastRightClickedEl;
        // Respaldo: si por alguna razon se perdio la referencia, usar el
        // elemento con foco si es editable.
        if (!target) {
          const active = document.activeElement;
          const tag = active && active.tagName ? active.tagName.toLowerCase() : "";
          if (tag === "input" || tag === "textarea") target = active;
        }
        if (!target) {
          showSmartApplyToast("SmartApply: haz clic derecho sobre el campo de nuevo.");
          sendResponse({ inserted: false });
          return true;
        }
        setFieldValue(target, msg.value);
        showSmartApplyToast(`SmartApply: campo completado.`);
        sendResponse({ inserted: true, field: msg.field });
        return true;
      }

      // HU-14 / HU-15: mostrar un aviso enviado desde el service worker.
      if (msg.action === "smartapplyToast") {
        showSmartApplyToast(msg.message || "SmartApply");
        sendResponse({ ok: true });
        return true;
      }

      
      if (msg.action === "detectFields") {
        const inputs = Array.from(document.querySelectorAll('input, textarea')).filter(isValidField);
        sendResponse({
          fields: inputs.map(el => {
            const fieldName = identifyField(el);
            return {
              name: fieldName,
              element: el.name || el.id,
              type: el.type || el.tagName.toLowerCase(),
              value: el.value
            };
          }),
        });
      }

      if (msg.action === "preview") {
        let previewed = 0;
        const inputs = Array.from(document.querySelectorAll('input, textarea'));
        
        inputs.forEach(el => {
          const fieldName = identifyField(el);
          if (fieldName && msg.data[fieldName]) {
            el.style.outline = "2px dashed #38bdf8";
            el.title = `SmartApply: ${msg.data[fieldName]}`;
            previewed++;
          }
        });
        
        sendResponse({ previewed });
      }

      if (msg.action === "autofill") {
        chrome.storage.local.get(["autofillEnabled", "sessionLocked"], (result) => {
          const enabled = result.autofillEnabled !== false; 

          // HU-14: si la sesion esta bloqueada, no autocompletar.
          if (result.sessionLocked) {
            console.log("[SmartApply] Sesion bloqueada.");
            sendResponse({ filled: 0, locked: true });
            return;
          }

          if (!enabled) {
            console.log("[SmartApply] Autocompletado desactivado.");
            sendResponse({ filled: 0, disabled: true });
            return;
          }
          
          let filled = 0;
          const filledFields = [];
          const filledFieldsSet = new Set();
          const inputs = Array.from(document.querySelectorAll('input, textarea'));
          
          inputs.forEach(el => {
            const fieldName = identifyField(el);
            if (!fieldName) return;
            
            let val;
            
            // Caso especial: nombre_completo
            if (fieldName === "nombre_completo") {
              // Usar el valor mapeado si existe, sino construir desde nombre + apellido
              val = msg.data.nombre_completo || (msg.data.nombre && msg.data.apellido 
                ? `${msg.data.nombre} ${msg.data.apellido}` 
                : null);
            } else {
              val = msg.data[fieldName];
            }
            
            if (!val) return;
            
            if (el.value && !msg.confirm) {
              return; // Saltar si ya tiene valor
            }
            
            el.value = val;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
            filled++;
            
            if (!filledFieldsSet.has(fieldName)) {
              filledFieldsSet.add(fieldName);
              filledFields.push(fieldName);
            }
          });

          if (filled > 0) {
            showAutofillNotification(filledFields);
          }

          sendResponse({ filled, fields: filledFields });
        });
        return true; 
      }
      return true;
    });
  }

  console.log("[SmartApply] Content script cargado. Detección mejorada activada.");
})();