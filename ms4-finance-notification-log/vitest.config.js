import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      PORT: '3004',
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/test_db',
      REDIS_URL: 'redis://localhost:6379',
      SMTP_HOST: 'smtp.ethereal.email',
      SMTP_PORT: '587',
      SMTP_USER: 'test@ethereal.email',
      SMTP_PASS: 'testpass',
      SMTP_FROM: 'noreply@csedu.ac.bd',
    },
  },
});
