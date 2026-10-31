import { supabase } from './supabase.js';

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function call(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeader()),
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const err = new Error(body?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export const analyzeReport = (payload) =>
  call('/api/analyze', { method: 'POST', body: JSON.stringify(payload) });

export const listReports = () => call('/api/reports');
export const getReport = (id) => call(`/api/reports?id=${encodeURIComponent(id)}`);
export const deleteReport = (id) =>
  call(`/api/reports?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
