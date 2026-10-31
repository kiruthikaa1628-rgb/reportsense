import { useEffect, useState } from 'react';
import { deleteReport, getReport, listReports } from '../api.js';
import Results from './Results.jsx';

export default function History({ t }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [opened, setOpened] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  async function load() {
    setError('');
    setItems(null);
    try {
      const data = await listReports();
      setItems(data.reports);
    } catch (err) {
      setError(err.message);
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function open(id) {
    setLoadingId(id);
    setError('');
    try {
      setOpened(await getReport(id));
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function remove(id) {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await deleteReport(id);
      setItems((list) => list.filter((r) => r.id !== id));
      if (opened?.id === id) setOpened(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (opened) {
    return (
      <div>
        <button className="btn ghost" onClick={() => setOpened(null)}>← {t('back')}</button>
        <Results t={t} data={opened} />
        <button className="btn danger" onClick={() => remove(opened.id)}>🗑 {t('delete')}</button>
      </div>
    );
  }

  return (
    <section>
      <h2>{t('historyTitle')}</h2>
      {error && (
        <div className="notice error" role="alert">
          ⚠️ {error} <button className="link-btn" onClick={load}>{t('tryAgain')}</button>
        </div>
      )}
      {items === null && <p className="muted">{t('loading')}</p>}
      {items && items.length === 0 && !error && <p className="card muted">{t('historyEmpty')}</p>}
      <ul className="history-list">
        {(items || []).map((r) => (
          <li key={r.id} className="card history-item">
            <div>
              <strong>{new Date(r.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
              <span className="muted small"> · {r.test_count} {t('tests')} · {r.language}</span>
              {r.urgent && <span className="badge high small-badge">⚠️</span>}
              <p className="clamp">{r.summary}</p>
            </div>
            <div className="row">
              <button className="btn secondary" onClick={() => open(r.id)} disabled={loadingId === r.id}>
                {loadingId === r.id ? t('loading') : t('open')}
              </button>
              <button className="btn ghost" onClick={() => remove(r.id)} aria-label={t('delete')}>🗑</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
