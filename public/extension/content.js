// SmartApply Extension - content.js
// Detecta campos de formularios en la pagina

(function () {
  "use strict";

  // --- 1. NUEVAS REGLAS DE DETECCIÓN INTELIGENTE ---
  const allowedTypes = ["text", "email", "tel", "number", ""];
  const allowedWords = ["email", "nombre", "apellido","first", "titulo","ubicacion", "habilidades", "last","resumen" ,"phone", "tel", "mobile", 
    "address", "location", "city", "country", "linkedin", 
    "website", "github", "portfolio", "url", "summary", "skills", "title"];

  // Esta función decide si un campo nos sirve o no
  function isValidField(el) {
    if (!el) return false;
    
    const tagName = el.tagName ? el.tagName.toLowerCase() : "";
    const type = el.type ? el.type.toLowerCase() : "text";
    const name = el.name ? el.name.toLowerCase() : "";
    const id = el.id ? el.id.toLowerCase() : "";

    // Aceptamos inputs y textareas (útil para direcciones largas)
    if (tagName !== "input" && tagName !== "textarea") return false;
    if (tagName === "input" && !allowedTypes.includes(type)) return false;

    // Retorna true si el nombre o el ID contienen alguna palabra clave
    return allowedWords.some(word => name.includes(word) || id.includes(word));
  }
  // ------------------------------------------------

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

  // Escuchar mensajes del popup
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      
      // --- 2. DETECCIÓN DE CAMPOS USANDO LA NUEVA FUNCIÓN ---
      if (msg.action === "detectFields") {
        const inputs = Array.from(document.querySelectorAll('input, textarea')).filter(isValidField);
        sendResponse({
          fields: inputs.map(el => ({
            name: el.name || el.id,
            type: el.type || el.tagName.toLowerCase(),
            value: el.value
          })),
        });
      }

      if (msg.action === "preview") {
        let previewed = 0;
        Object.entries(msg.data).forEach(([key, val]) => {
          const el = document.querySelector(`[name="${key}"]`) || document.getElementById(key);
          if (isValidField(el)) {
            el.style.outline = "2px dashed #38bdf8";
            el.title = `SmartApply: ${val}`;
            previewed++;
          }
        });
        sendResponse({ previewed });
      }

      if (msg.action === "autofill") {
        chrome.storage.local.get("autofillEnabled", (result) => {
          const enabled = result.autofillEnabled !== false; 
          
          if (!enabled) {
            console.log("[SmartApply] Autocompletado desactivado.");
            sendResponse({ filled: 0, disabled: true });
            return;
          }
          
          let filled = 0;
          const filledFields = [];
          
          Object.entries(msg.data).forEach(([key, val]) => {
            const el = document.querySelector(`[name="${key}"]`) || document.getElementById(key);
            if (isValidField(el)) {
              if (el.value && !msg.confirm) {
                return; // Saltar si ya tiene valor
              }
              el.value = val;
              el.dispatchEvent(new Event("input", { bubbles: true }));
              filled++;
              filledFields.push(key);
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

  console.log("[SmartApply] Content script cargado. Listo para detectar.");
})();