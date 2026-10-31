import { useState } from 'react';
import { supabase } from '../supabase.js';

export default function Login({ t }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setStatus('sending');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (err) {
      setError(err.message);
      setStatus('idle');
    } else {
      setStatus('sent');
    }
  }

  return (
    <section className="card">
      <h2>{t('loginTitle')}</h2>
      <p className="muted">{t('loginHelp')}</p>
      {status === 'sent' ? (
        <div className="notice success" role="status">
          ✉️ {t('checkInbox')}
        </div>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email">{t('email')}</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
          {error && <p className="error-text" role="alert">⚠️ {error}</p>}
          <button className="btn primary" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? t('sending') : t('sendLink')}
          </button>
        </form>
      )}
    </section>
  );
}
