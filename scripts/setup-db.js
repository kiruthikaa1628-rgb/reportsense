// Optional: create the tables from your own computer.
//   1. Put SUPABASE_DB_URL in a .env file (see .env.example)
//   2. Run: npm run db:setup
import fs from 'node:fs';
import pg from 'pg';
import { SCHEMA } from '../api/_schema.js';

if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

if (!process.env.SUPABASE_DB_URL) {
  console.error('SUPABASE_DB_URL is missing. Add it to .env first.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(SCHEMA);
  console.log('Done. The "reports" table and its security policies are ready.');
} catch (err) {
  console.error('Setup failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
