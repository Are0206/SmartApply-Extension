// SmartApply Extension - content.js
// Detecta campos de formularios en la pagina

(function () {
  "use strict";

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
    title.textContent = "SmartApply completo el formulario";
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
      if (msg.action === "detectFields") {
        // Detectar campos relevantes: text/email con nombres relacionados a email, name, phone, address, etc.
        const allowedTypes = ["text", "email", "tel", "number"];
        const allowedWords = ["email", "name", "phone", "tel", "mobile", "celular", "movil", "address", "direccion", "ubicacion"];
        const inputs = Array.from(document.querySelectorAll('input'))
          .filter(el => ["text", "email"].includes(el.type) && allowedNames.includes(el.name));
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
        Object.entries(msg.data).forEach(([name, val]) => {
          const el = document.querySelector(`[name="${name}"]`) || document.getElementById(name);
          if (el) {
            // Solo resaltar si es text/email y name relevante
            if (["text", "email"].includes(el.type) && ["email", "name", "phone"].includes(el.name)) {
              el.style.outline = "2px dashed #38bdf8";
              el.title = `SmartApply: ${val}`;
              previewed++;
            }
          }
        });
        sendResponse({ previewed });
      }

      if (msg.action === "autofill") {
        // Verificar si el autocompletado está habilitado
        chrome.storage.local.get("autofillEnabled", (result) => {
          const enabled = result.autofillEnabled !== false; // Default to true
          
          if (!enabled) {
            console.log("[SmartApply] Autocompletado desactivado. Cancelando...");
            sendResponse({ filled: 0, disabled: true });
            return;
          }
          
          let filled = 0;
          const filledFields = [];
          // No modificar campos con valor, a menos que se confirme (msg.confirm == true)
          Object.entries(msg.data).forEach(([name, val]) => {
            // Revisamos que el tipo sea válido y que el name o el id contengan alguna palabra clave
            const fieldName = (el.name || "").toLowerCase();
            const fieldId = (el.id || "").toLowerCase();
            
            if (allowedTypes.includes(el.type) && allowedWords.some(word => fieldName.includes(word) || fieldId.includes(word))) {
              if (el.value && !msg.confirm) {
                // Saltar si ya tiene valor y no hay confirmación
                return;
              }
              el.value = val;
              el.dispatchEvent(new Event("input", { bubbles: true }));
              filled++;
              filledFields.push(name);
            }
          });

          if (filled > 0) {
            showAutofillNotification(filledFields);
          }

          sendResponse({ filled, fields: filledFields });
        });
        
        return true; // Keep channel open for async response
      }

      return true;
    });
  }

  console.log("[SmartApply] Content script cargado. Campos detectados:", 
    document.querySelectorAll('input[name], textarea[name]').length);
})();
