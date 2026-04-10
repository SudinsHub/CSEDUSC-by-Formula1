import 'dotenv/config';

const required = [
  'JWT_SECRET',
  'FRONTEND_ORIGIN',
  'MS1_URL',
  'MS2_URL',
  'MS3_URL',
  'MS4_URL',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      'Check your .env file against .env.example.'
  );
}

const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  ms1Url: process.env.MS1_URL,
  ms2Url: process.env.MS2_URL,
  ms3Url: process.env.MS3_URL,
  ms4Url: process.env.MS4_URL,
};

export default config;
