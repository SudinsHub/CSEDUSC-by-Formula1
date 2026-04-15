import 'dotenv/config';

const required = [
  'DATABASE_URL',
  'REDIS_URL',
  'UPLOAD_DIR',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  upload: {
    dir: process.env.UPLOAD_DIR,
    maxSizeMB: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,video/mp4,application/pdf').split(','),
  },
};
