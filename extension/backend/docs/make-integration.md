# Integración con Make.com

SmartApply se integra con **Make.com** (antes Integromat) mediante webhooks HTTP bidireccionales.  
Con esta integración puedes automatizar flujos como:

- Registrar aplicaciones enviadas en una hoja de Google Sheets.
- Enviar un correo o notificación de Slack cada vez que se llena un formulario.
- Activar el autocompletado desde un escenario de Make.com.
- Sincronizar tu perfil con un CRM o base de datos externa.

---

## Arquitectura

```
Make.com Scenario
    │
    │  HTTP Request (trigger SmartApply)
    ▼
SmartApply Backend  ──►  Browser Extension
    │                        │
    │  Outgoing Webhook       │ form_filled event
    ▼                        ▼
Make.com Scenario    Backend /webhook/form-filled
```

---

## 1. Recibir eventos DESDE Make.com

Make.com puede llamar al backend de SmartApply usando el módulo **HTTP > Make a request**.

### Endpoint

```
POST http://<tu-servidor>:3000/api/webhook/make
Content-Type: application/json
```

### Payload

| Campo       | Tipo   | Obligatorio | Descripción                                          |
|-------------|--------|-------------|------------------------------------------------------|
| `event`     | string | ✅           | Nombre del evento (`trigger_autofill`, `update_profile`, …) |
| `profileId` | string | No          | ID del perfil de SmartApply                          |
| `data`      | object | No          | Datos adicionales según el evento                    |

**Ejemplo de body en Make.com:**
```json
{
  "event": "trigger_autofill",
  "profileId": "{{profileId}}",
  "data": {
    "jobUrl": "{{jobUrl}}"
  }
}
```

### Respuesta

```json
{
  "received": true,
  "event": "trigger_autofill",
  "timestamp": "2026-03-15T10:00:00.000Z"
}
```

---

## 2. Enviar eventos HACIA Make.com

Cada vez que ocurre un evento en SmartApply (perfil creado, formulario llenado, etc.)  
el backend llama automáticamente al webhook de Make.com que configures.

### Eventos disponibles

| Evento             | Cuándo se dispara                                    |
|--------------------|------------------------------------------------------|
| `profile_created`  | Un nuevo perfil es creado                            |
| `profile_updated`  | Un perfil existente es modificado                    |
| `profile_deleted`  | Un perfil es eliminado                               |
| `form_filled`      | La extensión llena un formulario en el navegador     |

### Payload enviado a Make.com

```json
{
  "event": "form_filled",
  "profileId": "abc-123",
  "url": "https://empresa.com/aplicar",
  "fields": ["name", "email", "phone"],
  "filledAt": "2026-03-15T10:05:00.000Z",
  "source": "smartapply-backend",
  "timestamp": "2026-03-15T10:05:00.000Z"
}
```

---

## 3. Configuración paso a paso

### A. En Make.com

1. Abre [make.com](https://make.com) e inicia sesión.
2. Crea un nuevo **Escenario**.
3. Agrega el módulo **Webhooks > Custom webhook** como disparador.
4. Haz clic en **Add** para crear un nuevo webhook.
5. Copia la **URL del webhook** generada (ej. `https://hook.make.com/abc123xyz`).

### B. En el backend de SmartApply

1. Copia el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Edita `.env` y configura:
   ```
   MAKE_WEBHOOK_URL=https://hook.make.com/abc123xyz
   MAKE_WEBHOOK_ENABLED=true
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```
4. Verifica la configuración:
   ```bash
   curl http://localhost:3000/api/webhook/make/status
   ```
   Respuesta esperada:
   ```json
   {
     "makeWebhookEnabled": true,
     "makeWebhookConfigured": true,
     "outgoingWebhookUrl": "https://hook.make.com/abc123xyz"
   }
   ```

### C. Prueba la conexión

Envía un evento de prueba desde Make.com o con curl:

```bash
curl -X POST http://localhost:3000/api/webhook/make \
  -H "Content-Type: application/json" \
  -d '{"event": "trigger_autofill", "profileId": "mi-perfil-id"}'
```

---

## 4. Ejemplos de escenarios Make.com

### Registrar aplicaciones en Google Sheets

```
Webhook (Custom) → Google Sheets (Add a row)
```
Campos a mapear:
- Fecha: `{{timestamp}}`
- URL del formulario: `{{url}}`
- Campos completados: `{{fields}}`

### Notificación por Slack

```
Webhook (Custom) → Slack (Create a message)
```
Mensaje: `✅ SmartApply llenó un formulario en {{url}} (campos: {{fields}})`

### Sincronizar perfil desde Airtable

```
Airtable (Watch Records) → HTTP (Make a request) → SmartApply /api/webhook/make
```
Body:
```json
{
  "event": "update_profile",
  "profileId": "{{airtableRecordId}}",
  "data": {
    "name": "{{Name}}",
    "email": "{{Email}}"
  }
}
```

---

## 5. Verificar el estado

```bash
GET /api/webhook/make/status
```

```json
{
  "makeWebhookEnabled": true,
  "makeWebhookConfigured": true,
  "outgoingWebhookUrl": "https://hook.make.com/abc123xyz"
}
```
