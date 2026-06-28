import 'dotenv/config';

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_ACCESS_EXPIRES',
  'JWT_REFRESH_EXPIRES',
  'FRONTEND_URL',
  'REDIS_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES,
  },
  frontendUrl: process.env.FRONTEND_URL,
};
