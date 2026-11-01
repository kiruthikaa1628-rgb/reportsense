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
    let { phone, name } = req.body || {};
    if (!phone || typeof phone !== 'string') {
      return sendError(res, 400, 'Mobile number is required.');
    }

    const cleanName = (typeof name === 'string' ? name.trim() : '').slice(0, 100);

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
      'select id, raw_user_meta_data from auth.users where phone = $1 limit 1',
      [phone]
    );

    let finalName = cleanName;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      const meta = existing.rows[0].raw_user_meta_data || {};
      finalName = cleanName || meta.full_name || meta.name || '';
      // Update last sign in and name if provided
      await pool.query(
        `update auth.users
            set last_sign_in_at = now(),
                updated_at = now(),
                raw_user_meta_data = raw_user_meta_data || $2::jsonb
          where id = $1`,
        [userId, JSON.stringify({ full_name: finalName })]
      );
    } else {
      // 2. Create new user in auth.users
      const newId = crypto.randomUUID();
      const created = await pool.query(
        `insert into auth.users (
           id, aud, role, phone, phone_confirmed_at,
           raw_user_meta_data, last_sign_in_at, created_at, updated_at,
           is_sso_user, is_anonymous
         )
         values ($1, 'authenticated', 'authenticated', $2, now(), $3::jsonb, now(), now(), now(), false, false)
         returning id`,
        [newId, phone, JSON.stringify({ full_name: finalName })]
      );
      userId = created.rows[0].id;
    }

    // 3. Ensure public.profiles is synced with full_name
    try {
      await pool.query(
        `insert into public.profiles (id, full_name, phone, updated_at)
         values ($1, $2, $3, now())
         on conflict (id) do update set
           full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
           phone = coalesce(excluded.phone, public.profiles.phone),
           updated_at = now()`,
        [userId, finalName || null, phone]
      );
    } catch (e) {
      console.warn('Profile sync warning in auth-phone:', e.message);
    }

    // 4. Create phone session token (valid for 1 year)
    const token = signPhoneToken({
      userId,
      phone,
      name: finalName,
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
          name: finalName,
          full_name: finalName,
          aud: 'authenticated',
          role: 'authenticated',
        },
      },
    });
  } catch (err) {
    console.error('auth-phone error:', err);
    return sendError(res, 500, err.message || 'Failed to sign in with mobile number. Please try again.');
  }
}

