import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      PORT: '3001',
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/test_db',
      JWT_SECRET: 'test_jwt_secret_key_12345',
      JWT_ACCESS_EXPIRES: '15m',
      JWT_REFRESH_EXPIRES: '7d',
      FRONTEND_URL: 'http://localhost:3000',
      REDIS_URL: 'redis://localhost:6379',
    },
  },
});
