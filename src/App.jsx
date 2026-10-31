import { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from './supabase.js';
import { makeT } from './i18n.js';
import Login from './components/Login.jsx';
import Analyze from './components/Analyze.jsx';
import History from './components/History.jsx';

function loadLanguage() {
  try {
    return localStorage.getItem('reportsense_lang') || 'English';
  } catch {
    return 'English';
  }
}

export default function App() {
  const [language, setLanguageState] = useState(loadLanguage);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('analyze');

  const t = useMemo(() => makeT(language), [language]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('reportsense_lang', lang);
    } catch {
      /* storage blocked: ignore */
    }
  };

  useEffect(() => {
    if (!supabaseConfigured) {
      setReady(true);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  let body;
  if (!supabaseConfigured) {
    body = <div className="card error-card">{t('notConfigured')}</div>;
  } else if (!ready) {
    body = <p className="center muted">{t('loading')}</p>;
  } else if (!session) {
    body = <Login t={t} />;
  } else {
    body = (
      <>
        <nav className="tabs" aria-label="Main">
          <button
            className={tab === 'analyze' ? 'tab active' : 'tab'}
            onClick={() => setTab('analyze')}
          >
            📄 {t('navAnalyze')}
          </button>
          <button
            className={tab === 'history' ? 'tab active' : 'tab'}
            onClick={() => setTab('history')}
          >
            🕘 {t('navHistory')}
          </button>
        </nav>
        {tab === 'analyze' ? (
          <Analyze t={t} language={language} setLanguage={setLanguage} />
        ) : (
          <History t={t} />
        )}
      </>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="logo" aria-hidden="true">🩺</span>
          <div>
            <h1>{t('appName')}</h1>
            <p className="tagline">{t('tagline')}</p>
          </div>
        </div>
        {session && (
          <button className="link-btn" onClick={() => supabase.auth.signOut()}>
            {t('signOut')}
          </button>
        )}
      </header>

      <main className="main">{body}</main>

      <footer className="disclaimer" role="note">
        <span aria-hidden="true">ℹ️</span> {t('disclaimer')}
      </footer>
    </div>
  );
}
