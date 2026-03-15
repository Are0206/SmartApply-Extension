# SmartApply Extension

Extensión de navegador para autocompletar formularios usando un perfil almacenado en una API segura, con integración bidireccional a **Make.com**.

## Arquitectura

- Extension (Chrome/Edge) — detecta y llena formularios
- Backend API (Node.js/Express) — gestiona perfiles y eventos
- Make.com Integration — webhooks de entrada/salida para automatización

## Estructura

```
extension/
├── manifest.json              # Manifest v3 de la extensión
├── src/
│   ├── background/            # Service worker
│   ├── content/               # Content script (detección de formularios)
│   └── popup/                 # Interfaz de la extensión
└── backend/
    ├── src/
    │   ├── index.js           # Servidor Express
    │   ├── routes/
    │   │   ├── profile.js     # CRUD de perfil
    │   │   └── webhook.js     # Endpoints Make.com
    │   └── services/
    │       └── makeWebhook.js # Servicio de notificación a Make.com
    ├── tests/                 # Pruebas de API
    └── docs/
        └── make-integration.md  # Guía de integración con Make.com
```

## Inicio rápido

### Backend

```bash
cd extension/backend
cp .env.example .env          # Configura MAKE_WEBHOOK_URL
npm install
npm start                     # http://localhost:3000
```

### Extensión

1. Abre Chrome → `chrome://extensions`
2. Activa **Modo desarrollador**
3. Haz clic en **Cargar descomprimida** y selecciona la carpeta `extension/`

## Integración con Make.com

Ver [`extension/backend/docs/make-integration.md`](extension/backend/docs/make-integration.md) para la guía completa.

**Resumen rápido:**
- Make.com → SmartApply: `POST /api/webhook/make` con `{ "event": "trigger_autofill", "profileId": "..." }`
- SmartApply → Make.com: configura `MAKE_WEBHOOK_URL` en `.env` y el backend enviará eventos automáticamente

## Estado actual

- [x] Fase 1: Configuración inicial del proyecto
- [x] Fase 2: Backend API con perfil y webhooks Make.com
- [x] Fase 2: Extensión Chrome/Edge (manifest, popup, content script, background)
- [ ] Fase 3: UI de gestión de perfil
- [ ] Fase 4: Modo seguro (previsualización antes de enviar)
