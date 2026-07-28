import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      PORT: '3000',
      JWT_SECRET: 'test_jwt_secret_key_12345',
      FRONTEND_ORIGIN: 'http://localhost:3000',
      MS1_URL: 'http://localhost:3001',
      MS2_URL: 'http://localhost:3002',
      MS3_URL: 'http://localhost:3003',
      MS4_URL: 'http://localhost:3004',
    },
  },
});
