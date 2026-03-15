const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const makeWebhook = require('../services/makeWebhook');

const router = express.Router();

// In-memory store (replace with a real DB in production)
const profiles = new Map();

const profileValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').trim().isEmail().withMessage('El email debe tener formato válido'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('linkedin').optional().trim().isURL().withMessage('LinkedIn debe ser una URL válida'),
  body('portfolio').optional().trim().isURL().withMessage('Portfolio debe ser una URL válida'),
];

// GET /api/profile/:id
router.get('/:id', (req, res) => {
  const profile = profiles.get(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Perfil no encontrado' });
  }
  res.json(profile);
});

// POST /api/profile
router.post('/', profileValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = uuidv4();
  const profile = { id, ...req.body, createdAt: new Date().toISOString() };
  profiles.set(id, profile);

  await makeWebhook.send('profile_created', { profileId: id, name: profile.name, email: profile.email });

  res.status(201).json(profile);
});

// PUT /api/profile/:id
router.put('/:id', profileValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!profiles.has(req.params.id)) {
    return res.status(404).json({ error: 'Perfil no encontrado' });
  }

  const existing = profiles.get(req.params.id);
  const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
  profiles.set(req.params.id, updated);

  await makeWebhook.send('profile_updated', { profileId: req.params.id });

  res.json(updated);
});

// DELETE /api/profile/:id
router.delete('/:id', async (req, res) => {
  if (!profiles.has(req.params.id)) {
    return res.status(404).json({ error: 'Perfil no encontrado' });
  }

  profiles.delete(req.params.id);

  await makeWebhook.send('profile_deleted', { profileId: req.params.id });

  res.json({ message: 'Perfil eliminado correctamente' });
});

module.exports = router;
