import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'SMTP_FROM'
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`FATAL: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

const hasResend = !!process.env.RESEND_API_KEY;
if (!hasResend) {
  const requiredSmtpVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  for (const varName of requiredSmtpVars) {
    if (!process.env[varName]) {
      console.error(`FATAL: Missing required environment variable: ${varName} (or set RESEND_API_KEY to use Resend)`);
      process.exit(1);
    }
  }
}

export const config = {
  port: parseInt(process.env.PORT, 10) || 3004,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  resendApiKey: process.env.RESEND_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
};
