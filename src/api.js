import { supabase } from './supabase.js';

const PHONE_SESSION_KEY = 'reportsense_phone_session_v1';

export function getStoredPhoneSession() {
  try {
    const raw = localStorage.getItem(PHONE_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session?.access_token && session?.user) return session;
  } catch {
    /* storage error or invalid JSON */
  }
  return null;
}

export function setPhoneSession(session) {
  try {
    if (session) {
      localStorage.setItem(PHONE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(PHONE_SESSION_KEY);
    }
  } catch {
    /* storage error */
  }
}

async function authHeader() {
  // 1. Check phone session first
  const phoneSession = getStoredPhoneSession();
  if (phoneSession?.access_token) {
    return { Authorization: `Bearer ${phoneSession.access_token}` };
  }

  // 2. Otherwise check Supabase email session
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  }

  return {};
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

export const loginWithPhone = (phone) =>
  call('/api/auth-phone', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

export const analyzeReport = (payload) =>
  call('/api/analyze', { method: 'POST', body: JSON.stringify(payload) });

export const listReports = () => call('/api/reports');
export const getReport = (id) => call(`/api/reports?id=${encodeURIComponent(id)}`);
export const deleteReport = (id) =>
  call(`/api/reports?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
