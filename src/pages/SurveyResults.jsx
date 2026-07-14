import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardQuestion, faArrowLeft, faCopy, faTrash, faLockOpen, faLock, faUsers, faShareNodes,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useDialog } from '../components/DialogProvider.jsx';

export default function SurveyResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dialog = useDialog();
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = () => api.get(`/admin/surveys/${id}`).then((r) => setSurvey(r.data)).catch((e) => setError(getApiError(e)));
  useEffect(() => { load(); }, [id]);

  const link = useMemo(
    () => (survey ? `${window.location.origin}/sondage/${survey.access_token}` : ''),
    [survey],
  );

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }
  async function toggle() {
    const r = await api.post(`/admin/surveys/${id}/toggle`);
    setSurvey((s) => ({ ...s, is_open: r.data.is_open }));
  }
  async function remove() {
    const ok = await dialog.confirm({ title: 'Supprimer le sondage', message: 'Cette action est irréversible. Continuer ?', confirmText: 'Supprimer', danger: true });
    if (!ok) return;
    await api.delete(`/admin/surveys/${id}`);
    navigate('/admin/surveys');
  }

  if (error) return <div className="page"><div className="alert error">{error}</div></div>;
  if (!survey) return <div className="center-screen">Chargement...</div>;

  const responses = survey.responses || [];
  const questions = survey.questions || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/admin/surveys" className="back-link"><FontAwesomeIcon icon={faArrowLeft} /> Retour aux sondages</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardQuestion} /> Sondage</span>
          <h1>{survey.title}</h1>
          {survey.description && <p>{survey.description}</p>}
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={toggle}>
            <FontAwesomeIcon icon={survey.is_open ? faLock : faLockOpen} /> {survey.is_open ? 'Fermer' : 'Rouvrir'}
          </button>
          <button className="secondary-btn" onClick={remove}><FontAwesomeIcon icon={faTrash} /> Supprimer</button>
        </div>
      </div>

      <div className="panel">
        <h2><FontAwesomeIcon icon={faShareNodes} /> Lien à partager</h2>
        <p className="muted">Envoyez ce lien : les participants répondent anonymement, sans compte.</p>
        <div className="inline-form" style={{ gridTemplateColumns: '1fr auto', marginBottom: 0 }}>
          <input value={link} readOnly onFocus={(e) => e.target.select()} />
          <button className="primary-btn" onClick={copy}><FontAwesomeIcon icon={faCopy} /> {copied ? 'Copié !' : 'Copier'}</button>
        </div>
        {!survey.is_open && <p className="hint" style={{ marginTop: 10 }}>⚠️ Le sondage est fermé : le lien n'accepte plus de réponses.</p>}
      </div>

      <div className="stats-grid">
        <div className="stat-card"><FontAwesomeIcon icon={faUsers} /><span>{responses.length}</span><small>Réponses reçues</small></div>
        <div className="stat-card"><FontAwesomeIcon icon={faClipboardQuestion} /><span>{questions.length}</span><small>Questions</small></div>
      </div>

      <h2 style={{ marginTop: 10 }}>Résultats</h2>
      {responses.length === 0 ? (
        <div className="empty">Aucune réponse pour l'instant.</div>
      ) : (
        questions.map((q) => (
          <div className="panel" key={q.id}>
            <h3 style={{ marginTop: 0 }}>{q.body}</h3>
            {q.type === 'text' ? (
              <div className="stats-list">
                {responses.map((r, i) => {
                  const v = r.answers?.[q.id];
                  if (!v) return null;
                  return <div className="stat-item" key={i} style={{ display: 'block' }}>« {Array.isArray(v) ? v.join(', ') : v} »</div>;
                })}
                {responses.every((r) => !r.answers?.[q.id]) && <p className="muted">Aucune réponse.</p>}
              </div>
            ) : (
              <div className="stats-list">
                {q.options.map((opt) => {
                  const count = responses.filter((r) => {
                    const v = r.answers?.[q.id];
                    return Array.isArray(v) ? v.includes(opt) : v === opt;
                  }).length;
                  const pct = responses.length ? Math.round((count / responses.length) * 100) : 0;
                  return (
                    <div key={opt} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span>{opt}</span><span>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 10, borderRadius: 6, background: '#eceef6', overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
