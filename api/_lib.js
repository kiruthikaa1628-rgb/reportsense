import pg from 'pg';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { SCHEMA } from './_schema.js';

const { Pool } = pg;

let pool;
let schemaReady = false;

export function getPool() {
  if (!pool) {
    if (!process.env.SUPABASE_DB_URL) {
      throw new Error('SUPABASE_DB_URL is not set. See SETUP_GUIDE.md step 3.');
    }
    pool = new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

// Creates the tables, index and security policies if they do not exist yet.
// Runs once per server instance, the first time any API route needs the database.
export async function ensureSchema() {
  if (schemaReady) return;
  try {
    await getPool().query(SCHEMA);
  } catch (err) {
    // Two cold starts racing to create the same object: that's fine, it exists now.
    if (!['42710', '42P07', '23505', '42P06'].includes(err.code)) throw err;
  }
  schemaReady = true;
}

function verifyPhoneToken(token) {
  if (!token || !token.startsWith('phone_token.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [_, dataB64, sig] = parts;
  const secret = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'reportsense_secret_key';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataB64);
  const expectedSig = hmac.digest('base64url');

  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      id: payload.userId,
      phone: payload.phone,
      name: payload.name || '',
      full_name: payload.name || '',
      aud: 'authenticated',
      role: 'authenticated',
    };
  } catch {
    return null;
  }
}

// Reads the "Authorization: Bearer <token>" header and asks Supabase who the user is.
export async function getUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  // Check if it is a phone session token
  const phoneUser = verifyPhoneToken(token);
  if (phoneUser) return phoneUser;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase URL / anon key are not set on the server.');

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export function sendError(res, status, message) {
  res.status(status).json({ error: message });
}
