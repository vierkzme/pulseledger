import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { validateSafeUrl } from '../src/utils/ssrfValidator.js';

describe('PulseLedger Core Backend Test Suite', () => {
  it('GET /api/health returns operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uptimeSeconds).toBeTypeOf('number');
  });

  it('SSRF validator rejects localhost and loopback IPv4', async () => {
    await expect(validateSafeUrl('http://localhost:4000')).rejects.toThrow();
    await expect(validateSafeUrl('http://127.0.0.1:5432')).rejects.toThrow();
    await expect(validateSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow();
    await expect(validateSafeUrl('http://192.168.1.1/admin')).rejects.toThrow();
    await expect(validateSafeUrl('ftp://example.com')).rejects.toThrow();
  });

  it('POST /api/auth/login authenticates seeded demo account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ardy@example.com', password: 'PasswordKuat123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('ardy@example.com');
  });

  it('Protected route rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/monitors');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/channels and /api/notifications returns list with auth token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ardy@example.com', password: 'PasswordKuat123!' });
    const token = loginRes.body.data.token;

    const resChannels = await request(app)
      .get('/api/channels')
      .set('Authorization', `Bearer ${token}`);
    expect(resChannels.status).toBe(200);
    expect(resChannels.body.success).toBe(true);
    expect(Array.isArray(resChannels.body.data)).toBe(true);

    const resNotifications = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(resNotifications.status).toBe(200);
    expect(resNotifications.body.success).toBe(true);
  });

  it('POST and PUT /api/channels creates and updates a webhook channel', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ardy@example.com', password: 'PasswordKuat123!' });
    const token = loginRes.body.data.token;

    const invalidRes = await request(app)
      .post('/api/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Invalid', webhookUrl: 'https://example.com/webhook' });
    expect(invalidRes.status).toBe(400);

    const createRes = await request(app)
      .post('/api/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Dev Channel',
        webhookUrl: 'https://discord.com/api/webhooks/987654321098765432/valid-token-example',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Dev Channel');
    const createdId = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/channels/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Channel' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Updated Channel');

    await request(app)
      .delete(`/api/channels/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
  });
});
