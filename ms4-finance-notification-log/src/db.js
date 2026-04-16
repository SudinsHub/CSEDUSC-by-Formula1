import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: config.databaseUrl,
  // Set search_path to finance schema for this service, with access to other schemas for cross-schema reads
  options: '-c search_path=finance,auth,content'
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
