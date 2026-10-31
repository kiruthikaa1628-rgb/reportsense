import { useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

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

export default function Login({ t }) {
  const [method, setMethod] = useState('phone'); // 'phone' | 'email'
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'verifying'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(0);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Clean and format phone number with country code
  function getFullPhone() {
    let cleanNumber = phone.replace(/[^0-9]/g, '');
    // If user already typed with leading zero (e.g. 09876543210), strip the leading 0
    cleanNumber = cleanNumber.replace(/^0+/, '');
    return `${countryCode}${cleanNumber}`;
  }

  async function handleSendCode(e) {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setStatus('sending');

    try {
      if (method === 'phone') {
        const fullPhone = getFullPhone();
        if (fullPhone.length < 8) {
          throw new Error('Please enter a valid mobile number.');
        }

        const { error: sendErr } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });

        if (sendErr) throw sendErr;

        setStep('otp');
        setTimer(30);
        setSuccessMsg(`${t('codeSentSuccess')} (${fullPhone})`);
      } else {
        const cleanEmail = email.trim();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }

        const { error: sendErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { emailRedirectTo: window.location.origin },
        });

        if (sendErr) throw sendErr;

        setStep('otp');
        setTimer(30);
        setSuccessMsg(t('codeSentSuccess'));
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check details.');
    } finally {
      setStatus('idle');
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/[^0-9]/g, '');
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the full verification code.');
      return;
    }

    setError('');
    setStatus('verifying');

    try {
      let res;
      if (method === 'phone') {
        const fullPhone = getFullPhone();
        res = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: cleanOtp,
          type: 'sms',
        });
      } else {
        res = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: cleanOtp,
          type: 'email',
        });
      }

      if (res.error) throw res.error;
      // On success, onAuthStateChange in App.jsx will automatically detect session!
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code. Please try again.');
      setStatus('idle');
    }
  }

  function resetToInput() {
    setStep('input');
    setOtp('');
    setError('');
    setSuccessMsg('');
  }

  return (
    <section className="card login-card">
      <h2>{t('loginTitle')}</h2>
      <p className="muted">{t('loginHelp')}</p>

      {/* Method tabs */}
      {step === 'input' && (
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
      )}

      {error && (
        <div className="notice error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {successMsg && step === 'otp' && (
        <div className="notice success" role="status">
          ✅ {successMsg}
        </div>
      )}

      {/* Step 1: Input details */}
      {step === 'input' && (
        <form onSubmit={handleSendCode}>
          {method === 'phone' ? (
            <div>
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
            </div>
          ) : (
            <div>
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
            </div>
          )}

          <button className="btn primary" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? t('sending') : t('sendCode')}
          </button>
        </form>
      )}

      {/* Step 2: Enter OTP Code */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="otp-form">
          <p className="otp-target-hint">
            {method === 'phone' ? (
              <>
                {t('otpHelpPhone')} <strong>{getFullPhone()}</strong>
              </>
            ) : (
              <>
                {t('otpHelpEmail')} <strong>{email.trim()}</strong>
              </>
            )}
          </p>

          <label htmlFor="otp-input">{t('enterCode')}</label>
          <input
            id="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            required
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t('otpPlaceholder')}
            className="otp-input"
          />

          <button
            className="btn primary"
            type="submit"
            disabled={status === 'verifying' || !otp.trim()}
          >
            {status === 'verifying' ? t('verifying') : t('verifyCode')}
          </button>

          <div className="otp-actions">
            {timer > 0 ? (
              <span className="muted small">
                ⏳ {t('resendIn')} {timer}s
              </span>
            ) : (
              <button
                type="button"
                className="link-btn small"
                onClick={() => handleSendCode()}
                disabled={status === 'sending'}
              >
                🔄 {t('resendCode')}
              </button>
            )}
            <button type="button" className="link-btn small" onClick={resetToInput}>
              ✏️ {t('changeContact')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
