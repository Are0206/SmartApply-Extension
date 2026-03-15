const express = require('express');
const makeWebhook = require('../services/makeWebhook');

const router = express.Router();

/**
 * POST /api/webhook/make
 *
 * Endpoint que Make.com puede llamar para disparar acciones en SmartApply.
 * En Make.com: usa el módulo "HTTP > Make a request" apuntando a esta URL.
 *
 * Payload esperado (JSON):
 * {
 *   "event": "trigger_autofill" | "update_profile",
 *   "profileId": "<uuid>",
 *   "data": { ... }      // opcional, campos adicionales
 * }
 */
router.post('/make', express.json(), (req, res) => {
  const { event, profileId, data } = req.body;

  if (!event) {
    return res.status(400).json({ error: 'El campo "event" es requerido' });
  }

  console.log(`[Make.com Webhook] Evento recibido: ${event}`, { profileId, data });

  // Respond immediately so Make.com does not time out
  res.json({ received: true, event, timestamp: new Date().toISOString() });

  // TODO: dispatch event internally (e.g. via WebSocket to extension, message queue, etc.)
});

/**
 * GET /api/webhook/make/status
 *
 * Verifica que el webhook de Make.com está configurado correctamente.
 */
router.get('/make/status', (req, res) => {
  const enabled = process.env.MAKE_WEBHOOK_ENABLED === 'true';
  const configured = Boolean(process.env.MAKE_WEBHOOK_URL);
  res.json({
    makeWebhookEnabled: enabled,
    makeWebhookConfigured: configured,
    outgoingWebhookUrl: configured ? process.env.MAKE_WEBHOOK_URL : null,
  });
});

/**
 * POST /api/webhook/form-filled
 *
 * La extensión llama a este endpoint cuando llena un formulario.
 * El backend luego notifica a Make.com.
 */
router.post('/form-filled', express.json(), async (req, res) => {
  const { profileId, url, fields } = req.body;

  if (!profileId || !url) {
    return res.status(400).json({ error: 'profileId y url son requeridos' });
  }

  const logEntry = {
    profileId,
    url,
    fields: fields || [],
    filledAt: new Date().toISOString(),
  };

  console.log('[Form Filled]', logEntry);

  await makeWebhook.send('form_filled', logEntry);

  res.json({ logged: true, ...logEntry });
});

module.exports = router;
