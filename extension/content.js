/**
 * content.js
 * SmartApply content script.
 * Checks whether the extension is enabled before autocompleting form fields.
 * Listens for storage changes so that toggling the popup takes effect on the
 * currently open page without requiring a reload.
 *
 * Note: the manifest runs this script on <all_urls> because job-application
 * forms appear on many different domains (LinkedIn, Indeed, company career
 * pages, etc.) and there is no reliable way to enumerate them in advance.
 */

(function () {
  'use strict';

  /** Key used in chrome.storage.local */
  const STORAGE_KEY = 'smartapplyEnabled';

  /** Field-detection patterns (checked against each attribute independently) */
  const FIELD_PATTERNS = {
    name:  /\bname\b|nombre/i,
    email: /\bemail\b|correo/i,
    phone: /\bphone\b|tel[eé]fono|telefono|mobile/i,
  };

  /**
   * Returns true when the given attribute value matches the pattern.
   * @param {string} attrValue
   * @param {RegExp} pattern
   */
  function attrMatches(attrValue, pattern) {
    return attrValue ? pattern.test(attrValue) : false;
  }

  /**
   * Checks whether an input element matches a field pattern by inspecting
   * the name, id, and placeholder attributes individually.
   * @param {HTMLInputElement} input
   * @param {RegExp} pattern
   */
  function inputMatches(input, pattern) {
    return (
      attrMatches(input.name, pattern) ||
      attrMatches(input.id, pattern) ||
      attrMatches(input.placeholder, pattern)
    );
  }

  /**
   * Fills a single input element with the given value, dispatching the events
   * that most modern frameworks need to detect the change.
   * @param {HTMLInputElement} input
   * @param {string} value
   */
  function fillField(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Attempts to read the user profile from chrome.storage.local and fills
   * recognised form fields on the current page.
   */
  function autocompleteForms() {
    chrome.storage.local.get(
      { smartapplyEnabled: true, smartapplyProfile: null },
      ({ smartapplyEnabled, smartapplyProfile }) => {
        if (!smartapplyEnabled) return;
        if (!smartapplyProfile) return;

        const inputs = document.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="tel"], textarea'
        );
        inputs.forEach((input) => {
          if (smartapplyProfile.name && inputMatches(input, FIELD_PATTERNS.name)) {
            fillField(input, smartapplyProfile.name);
          } else if (smartapplyProfile.email && inputMatches(input, FIELD_PATTERNS.email)) {
            fillField(input, smartapplyProfile.email);
          } else if (smartapplyProfile.phone && inputMatches(input, FIELD_PATTERNS.phone)) {
            fillField(input, smartapplyProfile.phone);
          }
        });
      }
    );
  }

  // Run autocomplete when the content script first loads.
  autocompleteForms();

  // Re-run (or stop) whenever the user changes the toggle in the popup.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && STORAGE_KEY in changes) {
      const enabled = changes[STORAGE_KEY].newValue;
      if (enabled) {
        autocompleteForms();
      }
      // When disabled there is nothing to undo — fields already filled remain,
      // but no new autocomplete pass will be triggered.
    }
  });
})();
