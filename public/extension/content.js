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

      if (msg.action === "autofill") {
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
      }

      return true;
    });
  }

  console.log("[SmartApply] Content script cargado. Campos detectados:", 
    document.querySelectorAll('input[name], textarea[name]').length);
})();
