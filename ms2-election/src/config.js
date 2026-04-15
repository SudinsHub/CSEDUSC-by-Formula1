import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['PORT', 'DATABASE_URL', 'REDIS_URL'];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`FATAL: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT, 10) || 3002,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
};
