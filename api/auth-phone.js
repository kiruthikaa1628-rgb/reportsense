import crypto from 'node:crypto';
import { ensureSchema, getPool, sendError } from './_lib.js';

export const config = { maxDuration: 30 };

function signPhoneToken(payload) {
  const secret = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'reportsense_secret_key';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const sig = hmac.digest('base64url');
  return `phone_token.${data}.${sig}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'Use POST.');

  try {
    let { phone } = req.body || {};
    if (!phone || typeof phone !== 'string') {
      return sendError(res, 400, 'Mobile number is required.');
    }

    // Clean phone number: keep leading plus and digits only
    phone = phone.trim().replace(/[^\d+]/g, '');
    if (!phone.startsWith('+')) {
      phone = `+91${phone.replace(/^0+/, '')}`;
    }
    if (phone.length < 9) {
      return sendError(res, 400, 'Please enter a valid mobile number.');
    }

    await ensureSchema();
    const pool = getPool();

    // 1. Check if user already exists in auth.users by phone
    let userId;
    const existing = await pool.query(
      'select id from auth.users where phone = $1 limit 1',
      [phone]
    );

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      // Update last sign in
      await pool.query(
        'update auth.users set last_sign_in_at = now(), updated_at = now() where id = $1',
        [userId]
      );
    } else {
      // 2. Create new user in auth.users
      const newId = crypto.randomUUID();
      const created = await pool.query(
        `insert into auth.users (
           id, aud, role, phone, phone_confirmed_at,
           last_sign_in_at, created_at, updated_at,
           is_sso_user, is_anonymous
         )
         values ($1, 'authenticated', 'authenticated', $2, now(), now(), now(), now(), false, false)
         returning id`,
        [newId, phone]
      );
      userId = created.rows[0].id;
    }

    // 3. Ensure public.profiles is synced
    try {
      await pool.query(
        `insert into public.profiles (id, phone, updated_at)
         values ($1, $2, now())
         on conflict (id) do update set
           phone = coalesce(excluded.phone, public.profiles.phone),
           updated_at = now()`,
        [userId, phone]
      );
    } catch (e) {
      console.warn('Profile sync warning in auth-phone:', e.message);
    }

    // 4. Create phone session token (valid for 1 year)
    const token = signPhoneToken({
      userId,
      phone,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
    });

    return res.status(200).json({
      ok: true,
      session: {
        access_token: token,
        token_type: 'bearer',
        user: {
          id: userId,
          phone,
          aud: 'authenticated',
          role: 'authenticated',
        },
      },
    });
  } catch (err) {
    console.error('auth-phone error:', err);
    return sendError(res, 500, 'Failed to sign in with mobile number. Please try again.');
  }
}

