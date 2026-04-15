import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
