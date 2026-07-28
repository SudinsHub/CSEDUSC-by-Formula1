import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      PORT: '3003',
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/test_db',
      REDIS_URL: 'redis://localhost:6379',
      UPLOAD_DIR: './uploads',
    },
  },
});
