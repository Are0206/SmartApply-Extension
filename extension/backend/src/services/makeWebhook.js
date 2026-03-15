const axios = require('axios');

/**
 * Sends an event payload to Make.com via a custom webhook URL.
 *
 * To configure:
 *  1. In Make.com, create a new Scenario.
 *  2. Add a "Webhooks > Custom webhook" trigger module.
 *  3. Copy the generated webhook URL.
 *  4. Set MAKE_WEBHOOK_URL=<copied URL> in your .env file.
 *  5. Set MAKE_WEBHOOK_ENABLED=true in your .env file.
 *
 * @param {string} event  - Event name (e.g. 'form_filled', 'profile_created')
 * @param {object} payload - Arbitrary data to forward to Make.com
 */
async function send(event, payload = {}) {
  const enabled = process.env.MAKE_WEBHOOK_ENABLED === 'true';
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!enabled || !webhookUrl) {
    return;
  }

  try {
    await axios.post(webhookUrl, {
      event,
      ...payload,
      source: 'smartapply-backend',
      timestamp: new Date().toISOString(),
    });
    console.log(`[Make.com] Evento enviado: ${event}`);
  } catch (err) {
    console.error(`[Make.com] Error al enviar evento "${event}":`, err.message);
  }
}

module.exports = { send };
