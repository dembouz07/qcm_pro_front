import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardQuestion, faCirclePlus, faUsers, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function SurveyList() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/surveys')
      .then((r) => setSurveys(r.data))
      .catch((e) => setError(getApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardQuestion} /> Sondages</span>
          <h1>Questionnaires anonymes</h1>
          <p>Créez un questionnaire, partagez le lien : les réponses arrivent ici, sans que les participants aient besoin d'un compte.</p>
        </div>
        <div className="header-actions">
          <Link className="primary-btn" to="/admin/surveys/new"><FontAwesomeIcon icon={faCirclePlus} /> Nouveau sondage</Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <div className="center-screen">Chargement...</div>
      ) : surveys.length === 0 ? (
        <div className="empty">Aucun sondage pour l'instant. Créez-en un !</div>
      ) : (
        <div className="quiz-grid">
          {surveys.map((s) => (
            <Link key={s.id} to={`/admin/surveys/${s.id}`} className="panel" style={{ display: 'block' }}>
              <h3 style={{ margin: '0 0 6px' }}>{s.title}</h3>
              <p className="muted" style={{ margin: '0 0 14px' }}>{s.questions?.length || 0} question(s)</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="score-badge"><FontAwesomeIcon icon={faUsers} /> {s.responses_count || 0} réponse(s)</span>
                <span className={`status-pill ${s.is_open ? 'open' : 'closed'}`}>{s.is_open ? 'Ouvert' : 'Fermé'}</span>
              </div>
              <div style={{ marginTop: 14, color: 'var(--primary)', fontWeight: 800 }}>Voir les réponses <FontAwesomeIcon icon={faArrowRight} /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
