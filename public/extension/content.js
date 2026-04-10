// SmartApply Extension - content.js
// Detecta campos de formularios en la pagina

(function () {
  "use strict";

  // Escuchar mensajes del popup
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === "detectFields") {
        const inputs = document.querySelectorAll('input[name], textarea[name], select[name]');
        sendResponse({
          fields: Array.from(inputs).map(el => ({
            name: el.name || el.id,
            type: el.type || el.tagName.toLowerCase(),
          })),
        });
      }

      if (msg.action === "preview") {
        let previewed = 0;
        Object.entries(msg.data).forEach(([name, val]) => {
          const el = document.querySelector(`[name="${name}"]`) || document.getElementById(name);
          if (el) {
            el.style.outline = "2px dashed #38bdf8";
            el.title = `SmartApply: ${val}`;
            previewed++;
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
          Object.entries(msg.data).forEach(([name, val]) => {
            const el = document.querySelector(`[name="${name}"]`) || document.getElementById(name);
            if (el) {
              el.value = val;
              el.dispatchEvent(new Event("input", { bubbles: true }));
              filled++;
            }
          });
          sendResponse({ filled });
        });
        
        return true; // Keep channel open for async response
      }

      return true;
    });
  }

  console.log("[SmartApply] Content script cargado. Campos detectados:", 
    document.querySelectorAll('input[name], textarea[name]').length);
})();
