import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import swaggerRouter from './swagger.js';

describe('Swagger UI and OpenAPI JSON endpoints', () => {
  const app = express();
  app.use(swaggerRouter);

  it('GET /openapi.json should return 200 OK with valid OpenAPI spec JSON', async () => {
    const res = await request(app).get('/openapi.json');
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

  it('GET /docs should serve Swagger UI HTML', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });

  it('GET /api-docs should serve Swagger UI HTML', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
