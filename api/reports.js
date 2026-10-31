import { ensureSchema, getPool, getUser, sendError } from './_lib.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET    /api/reports          -> list of the signed-in user's past analyses
// GET    /api/reports?id=UUID  -> one full analysis
// DELETE /api/reports?id=UUID  -> delete one analysis
export default async function handler(req, res) {
  try {
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'Please sign in again.');

    await ensureSchema();
    const pool = getPool();

    try {
      await pool.query(
        `insert into public.profiles (id, email, phone, updated_at)
         values ($1, $2, $3, now())
         on conflict (id) do update set
           email = coalesce(excluded.email, public.profiles.email),
           phone = coalesce(excluded.phone, public.profiles.phone),
           updated_at = now()`,
        [user.id, user.email || null, user.phone || null]
      );
    } catch (profileErr) {
      console.warn('Profile sync warning:', profileErr.message);
    }

    const id = req.query?.id;
    if (id && !UUID.test(id)) return sendError(res, 400, 'Invalid id.');

    if (req.method === 'GET' && !id) {
      const { rows } = await pool.query(
        `select id, language, summary, urgent, report_type, report_type_label, created_at,
                jsonb_array_length(results) as test_count
           from public.reports
          where user_id = $1
          order by created_at desc
          limit 100`,
        [user.id]
      );
      return res.status(200).json({ reports: rows });
    }

    if (req.method === 'GET' && id) {
      const { rows } = await pool.query(
        `select id, language, summary, results, urgent, report_type, report_type_label, created_at
           from public.reports where id = $1 and user_id = $2`,
        [id, user.id]
      );
      if (!rows[0]) return sendError(res, 404, 'Report not found.');
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE' && id) {
      await pool.query('delete from public.reports where id = $1 and user_id = $2', [id, user.id]);
      return res.status(200).json({ ok: true });
    }

    return sendError(res, 405, 'Method not allowed.');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'Something went wrong on the server. Please try again.');
  }
}
