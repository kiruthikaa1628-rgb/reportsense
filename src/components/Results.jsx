const STATUS = {
  low:      { icon: '▼', key: 'statusLow',      cls: 'low' },
  normal:   { icon: '✔', key: 'statusNormal',   cls: 'normal' },
  high:     { icon: '▲', key: 'statusHigh',     cls: 'high' },
  abnormal: { icon: '⚠', key: 'statusAbnormal', cls: 'high' },
  present:  { icon: '●', key: 'statusPresent',  cls: 'high' },
  absent:   { icon: '○', key: 'statusAbsent',   cls: 'normal' },
  unclear:  { icon: '?', key: 'statusUnclear',  cls: 'unclear' },
};

const REPORT_TYPE_ICON = {
  blood_test:        '🩸',
  urine_test:        '🧪',
  xray:              '🦴',
  mri:               '🧠',
  ct_scan:           '🔬',
  ecg:               '❤️',
  ultrasound:        '📡',
  pathology:         '🔭',
  prescription:      '💊',
  discharge_summary: '🏥',
  other_lab:         '🧫',
  other_medical:     '📋',
};

export default function Results({ t, data }) {
  const date = data.created_at ? new Date(data.created_at).toLocaleString() : '';
  const typeIcon = REPORT_TYPE_ICON[data.report_type] || '📋';
  const typeLabel = data.report_type_label || data.report_type || '';

  return (
    <section>
      <h2>{t('resultsTitle')}</h2>
      {date && <p className="muted small">{date} · {data.language}</p>}

      {typeLabel && (
        <div className="report-type-badge">
          {typeIcon} {typeLabel}
        </div>
      )}

      {data.urgent && (
        <div className="banner" role="alert">
          <strong>⚠️ {t('urgentBanner')}</strong>
          <span>{t('urgentBannerSub')}</span>
        </div>
      )}

      <div className="card">
        <h3>{t('summary')}</h3>
        <p>{data.summary}</p>
      </div>

      <div className="notice" role="note">🔍 {t('checkValues')}</div>

      <ul className="test-list">
        {data.results.map((r, i) => {
          const s = STATUS[r.status] || STATUS.unclear;
          return (
            <li key={i} className={`card test ${s.cls}`}>
              <div className="test-head">
                <h3>{r.test_name}</h3>
                <span className={`badge ${s.cls}`}>
                  <span aria-hidden="true">{s.icon}</span> {t(s.key)}
                </span>
              </div>
              <dl className="values">
                <div>
                  <dt>{t('yourValue')}</dt>
                  <dd>{r.value || '—'}</dd>
                </div>
                <div>
                  <dt>{t('reportRange')}</dt>
                  <dd>{r.reference_range}</dd>
                </div>
              </dl>
              {r.status === 'unclear' && <p className="muted small">{t('unclearNote')}</p>}
              <p className="explain">{r.explanation}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
