import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import swaggerRouter from './swagger.js';

describe('Swagger UI and OpenAPI JSON endpoints', () => {
  const app = express();
  app.use(swaggerRouter);
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  it('GET /api/openapi.json and /openapi.json should return 200 OK with valid OpenAPI spec JSON', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain("CSEDU Students' Club");
    expect(res.body.paths).toHaveProperty('/health');
    expect(res.body.paths).toHaveProperty('/api/auth/login');
  });

  it('GET /swagger.json should also return valid OpenAPI spec', async () => {
    const res = await request(app).get('/swagger.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
  });

  it('GET /api/docs and /api/docs/ should serve Swagger UI HTML with 200 OK', async () => {
    const res1 = await request(app).get('/api/docs');
    expect(res1.status).toBe(200);
    expect(res1.headers['content-type']).toMatch(/html/);
    expect(res1.text).toContain('SwaggerUIBundle');

    const res2 = await request(app).get('/api/docs/');
    expect(res2.status).toBe(200);
    expect(res2.headers['content-type']).toMatch(/html/);
    expect(res2.text).toContain('SwaggerUIBundle');
  });

  it('GET /docs, /api-docs, /swagger should serve Swagger UI HTML', async () => {
    const res1 = await request(app).get('/docs');
    expect(res1.status).toBe(200);
    expect(res1.text).toContain('SwaggerUIBundle');

    const res2 = await request(app).get('/api-docs');
    expect(res2.status).toBe(200);
    expect(res2.text).toContain('SwaggerUIBundle');

    const res3 = await request(app).get('/swagger');
    expect(res3.status).toBe(200);
    expect(res3.text).toContain('SwaggerUIBundle');
  });
});
