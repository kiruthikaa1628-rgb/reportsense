import { ensureSchema, sendError } from './_lib.js';

// Visit /api/setup once after deploying. It creates the database tables (if missing)
// and tells you whether the database connection works. It exposes no data.
export default async function handler(req, res) {
  try {
    await ensureSchema();
    res.status(200).json({ ok: true, message: 'Database is ready. Tables exist.' });
  } catch (err) {
    console.error(err);
    sendError(res, 500, 'Database setup failed: ' + (err.message || 'unknown error'));
  }
}
