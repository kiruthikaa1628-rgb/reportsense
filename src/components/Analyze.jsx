import { useRef, useState } from 'react';
import { analyzeReport } from '../api.js';
import { compressImage } from '../image.js';
import { LANGUAGES, NATIVE_NAMES } from '../i18n.js';
import Results from './Results.jsx';

const CONSENT_KEY = 'reportsense_consent_v1';

function hasConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'yes';
  } catch {
    return false;
  }
}

export default function Analyze({ t, language, setLanguage }) {
  const fileRef = useRef(null);
  const [image, setImage] = useState(null); // { base64, mimeType, previewUrl }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showConsent, setShowConsent] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setResult(null);
    try {
      setImage(await compressImage(file));
    } catch (err) {
      setImage(null);
      setError(err.message);
    }
  }

  function pickFile() {
    if (!hasConsent()) {
      setShowConsent(true);
      return;
    }
    fileRef.current?.click();
  }

  function agree() {
    try {
      localStorage.setItem(CONSENT_KEY, 'yes');
    } catch {
      /* ignore */
    }
    setShowConsent(false);
    fileRef.current?.click();
  }

  async function run() {
    if (!image) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeReport({
        image: image.base64,
        mimeType: image.mimeType,
        language,
      });
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <section className="card">
        <h2>{t('uploadTitle')}</h2>
        <p className="muted">{t('uploadHelp')}</p>

        <label htmlFor="lang">{t('chooseLanguage')}</label>
        <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {NATIVE_NAMES[l]} ({l})
            </option>
          ))}
        </select>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFile}
          hidden
        />

        {image && (
          <img className="preview" src={image.previewUrl} alt="Report preview" />
        )}

        <button className="btn secondary" type="button" onClick={pickFile} disabled={busy}>
          📷 {image ? t('changeFile') : t('chooseFile')}
        </button>

        {image && (
          <button className="btn primary" type="button" onClick={run} disabled={busy}>
            {busy ? t('analyzing') : t('analyze')}
          </button>
        )}

        {busy && <div className="progress" aria-hidden="true"><span /></div>}

        {error && (
          <div className="notice error" role="alert">
            ⚠️ {error}
          </div>
        )}
      </section>

      {result && (
        <>
          <p className="notice success" role="status">✅ {t('saved')}</p>
          <Results t={t} data={result} />
        </>
      )}

      {showConsent && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="consent-title">
          <div className="modal card">
            <h2 id="consent-title">🔒 {t('consentTitle')}</h2>
            <p>{t('consentText')}</p>
            <button className="btn primary" onClick={agree}>{t('consentAgree')}</button>
            <button className="btn ghost" onClick={() => setShowConsent(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
