import { useEffect, useState } from 'react';
import { supabase } from '../supabase.js';
import { loginWithPhone, setPhoneSession } from '../api.js';

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91 (India)' },
  { code: '+1', label: '🇺🇸 +1 (USA/Canada)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+971', label: '🇦🇪 +971 (UAE)' },
  { code: '+65', label: '🇸🇬 +65 (Singapore)' },
  { code: '+61', label: '🇦🇺 +61 (Australia)' },
  { code: '+966', label: '🇸🇦 +966 (Saudi Arabia)' },
  { code: '+60', label: '🇲🇾 +60 (Malaysia)' },
  { code: '+974', label: '🇶🇦 +974 (Qatar)' },
  { code: '+968', label: '🇴🇲 +968 (Oman)' },
  { code: '+965', label: '🇰🇼 +965 (Kuwait)' },
  { code: '+977', label: '🇳🇵 +977 (Nepal)' },
  { code: '+880', label: '🇧🇩 +880 (Bangladesh)' },
  { code: '+94', label: '🇱🇰 +94 (Sri Lanka)' },
];

export default function Login({ t, onLogin }) {
  const [method, setMethod] = useState('phone'); // 'phone' | 'email'
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailStep, setEmailStep] = useState('input'); // 'input' | 'otp'
  const [emailOtp, setEmailOtp] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'busy'
  const [error, setError] = useState('');
  const [emailTimer, setEmailTimer] = useState(0);

  // Timer for resending email code
  useEffect(() => {
    if (emailTimer <= 0) return;
    const interval = setInterval(() => {
      setEmailTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [emailTimer]);

  function getFullPhone() {
    let cleanNumber = phone.replace(/[^0-9]/g, '');
    cleanNumber = cleanNumber.replace(/^0+/, '');
    return `${countryCode}${cleanNumber}`;
  }

  // --- MOBILE NUMBER SIGN IN (DIRECT, NO OTP) ---
  async function handlePhoneSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter your name.');
      return;
    }

    const fullPhone = getFullPhone();
    if (fullPhone.length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setStatus('busy');
    try {
      const res = await loginWithPhone(fullPhone, cleanName);
      if (res?.session) {
        setPhoneSession(res.session);
        if (onLogin) onLogin(res.session);
      } else {
        throw new Error('Unable to complete mobile sign-in. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setStatus('idle');
    }
  }

  // --- EMAIL SIGN IN ---
  async function handleSendEmailCode(e) {
    if (e) e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter your name.');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setStatus('busy');
    try {
      const { error: sendErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: cleanName },
        },
      });
      if (sendErr) throw sendErr;
      setEmailStep('otp');
      setEmailTimer(30);
    } catch (err) {
      setError(err.message || 'Failed to send email link. Please try again.');
    } finally {
      setStatus('idle');
    }
  }

  async function handleVerifyEmailOtp(e) {
    e.preventDefault();
    const cleanCode = emailOtp.trim().replace(/[^0-9]/g, '');
    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter the verification code.');
      return;
    }

    setError('');
    setStatus('busy');
    try {
      const res = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanCode,
        type: 'email',
      });
      if (res.error) throw res.error;
      if (res.data?.session && onLogin) {
        onLogin(res.data.session);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <section className="card login-card">
      <h2>{t('loginTitle')}</h2>
      <p className="muted">{t('loginHelp')}</p>

      {/* Method tabs */}
      <div className="login-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={method === 'phone'}
          className={`login-tab ${method === 'phone' ? 'active' : ''}`}
          onClick={() => {
            setMethod('phone');
            setError('');
          }}
        >
          📱 {t('loginWithPhone')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={method === 'email'}
          className={`login-tab ${method === 'email' ? 'active' : ''}`}
          onClick={() => {
            setMethod('email');
            setError('');
          }}
        >
          ✉️ {t('loginWithEmail')}
        </button>
      </div>

      {error && (
        <div className="notice error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* --- PHONE TAB: DIRECT SIGN IN, NO OTP --- */}
      {method === 'phone' && (
        <form onSubmit={handlePhoneSubmit}>
          <label htmlFor="phone-name-input">{t('nameLabel')}</label>
          <input
            id="phone-name-input"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
          />

          <label htmlFor="phone-input">{t('phone')}</label>
          <div className="phone-input-group">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="country-select"
              aria-label="Country Code"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              id="phone-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              className="phone-field"
            />
          </div>

          <p className="muted small" style={{ marginTop: '8px' }}>
            🔒 {t('phoneHelp')}
          </p>

          <button className="btn primary" type="submit" disabled={status === 'busy'}>
            {status === 'busy' ? t('phoneSigningIn') : `✨ ${t('phoneBtn')}`}
          </button>
        </form>
      )}

      {/* --- EMAIL TAB: LINK / CODE SIGN IN --- */}
      {method === 'email' && (
        <>
          {emailStep === 'input' ? (
            <form onSubmit={handleSendEmailCode}>
              <label htmlFor="email-name-input">{t('nameLabel')}</label>
              <input
                id="email-name-input"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
              />

              <label htmlFor="email-input">{t('email')}</label>
              <input
                id="email-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
              <p className="muted small" style={{ marginTop: '8px' }}>
                ✉️ {t('emailHelp')}
              </p>
              <button className="btn primary" type="submit" disabled={status === 'busy'}>
                {status === 'busy' ? t('sending') : t('sendCode')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyEmailOtp} className="otp-form">
              <div className="notice success" role="status">
                ✉️ <strong>{t('codeSentSuccess')}</strong>
              </div>
              <p className="otp-target-hint">
                {t('otpHelpEmail')} <strong>{email.trim()}</strong>
              </p>

              <label htmlFor="email-otp-input">{t('enterCode')}</label>
              <input
                id="email-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                required
                autoFocus
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                placeholder={t('otpPlaceholder')}
                className="otp-input"
              />

              <button
                className="btn primary"
                type="submit"
                disabled={status === 'busy' || !emailOtp.trim()}
              >
                {status === 'busy' ? t('verifying') : t('verifyCode')}
              </button>

              <div className="otp-actions" style={{ marginTop: '16px' }}>
                {emailTimer > 0 ? (
                  <span className="muted small">
                    ⏳ {t('resendIn')} {emailTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="link-btn small"
                    onClick={() => handleSendEmailCode()}
                    disabled={status === 'busy'}
                  >
                    🔄 {t('resendCode')}
                  </button>
                )}
                <button
                  type="button"
                  className="link-btn small"
                  onClick={() => {
                    setEmailStep('input');
                    setEmailOtp('');
                    setError('');
                  }}
                >
                  ✏️ {t('changeContact')}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
