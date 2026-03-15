const request = require('supertest');
const app = require('../src/index');

describe('Health check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Profile API', () => {
  let createdId;

  it('POST /api/profile - creates a profile', async () => {
    const res = await request(app)
      .post('/api/profile')
      .send({ name: 'Ana García', email: 'ana@example.com', phone: '+506 8888-1234' });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Ana García');
    createdId = res.body.id;
  });

  it('POST /api/profile - validates required fields', async () => {
    const res = await request(app).post('/api/profile').send({ phone: '12345' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/profile - validates email format', async () => {
    const res = await request(app)
      .post('/api/profile')
      .send({ name: 'Test', email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/profile/:id - retrieves created profile', async () => {
    const res = await request(app).get(`/api/profile/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('ana@example.com');
  });

  it('GET /api/profile/:id - returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/profile/nonexistent-id');
    expect(res.statusCode).toBe(404);
  });

  it('PUT /api/profile/:id - updates profile', async () => {
    const res = await request(app)
      .put(`/api/profile/${createdId}`)
      .send({ name: 'Ana García Updated', email: 'ana@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Ana García Updated');
    expect(res.body.updatedAt).toBeDefined();
  });

  it('DELETE /api/profile/:id - deletes profile', async () => {
    const res = await request(app).delete(`/api/profile/${createdId}`);
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/profile/:id - returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/profile/${createdId}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('Make.com Webhook API', () => {
  it('GET /api/webhook/make/status returns configuration', async () => {
    const res = await request(app).get('/api/webhook/make/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('makeWebhookEnabled');
    expect(res.body).toHaveProperty('makeWebhookConfigured');
  });

  it('POST /api/webhook/make - accepts valid event', async () => {
    const res = await request(app)
      .post('/api/webhook/make')
      .send({ event: 'trigger_autofill', profileId: 'abc-123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('POST /api/webhook/make - rejects missing event', async () => {
    const res = await request(app)
      .post('/api/webhook/make')
      .send({ profileId: 'abc-123' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/webhook/form-filled - logs correctly', async () => {
    const res = await request(app)
      .post('/api/webhook/form-filled')
      .send({ profileId: 'abc-123', url: 'https://example.com/apply', fields: ['name', 'email'] });
    expect(res.statusCode).toBe(200);
    expect(res.body.logged).toBe(true);
  });

  it('POST /api/webhook/form-filled - validates required fields', async () => {
    const res = await request(app)
      .post('/api/webhook/form-filled')
      .send({ fields: ['name'] });
    expect(res.statusCode).toBe(400);
  });
});
