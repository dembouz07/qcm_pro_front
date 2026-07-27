import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faChartLine, faCirclePlus, faClipboardCheck, faFilter, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import { formatAssessmentType, formatDate } from '../../utils/enterprise.js';

export default function EnterpriseAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/enterprise/assessments', { params: type ? { type } : {} })
      .then((response) => setAssessments(response.data))
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="page enterprise-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardCheck} /> Diagnostics Mindset</span>
          <h1>Entretiens individuels</h1>
          <p>Retrouvez les diagnostics initiaux T0 et les suivis à six mois de chaque collaborateur.</p>
        </div>
        <div className="header-actions"><Link className="primary-btn" to="/entreprise/diagnostics/nouveau"><FontAwesomeIcon icon={faCirclePlus} /> Nouveau diagnostic</Link></div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="enterprise-toolbar panel">
        <div className="filter-select">
          <FontAwesomeIcon icon={faFilter} />
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filtrer les diagnostics">
            <option value="">Tous les entretiens</option>
            <option value="initial">Diagnostics initiaux · T0</option>
            <option value="follow_up">Entretiens de suivi · T+6 mois</option>
          </select>
        </div>
        <span>{assessments.length} entretien{assessments.length > 1 ? 's' : ''}</span>
      </div>

      {loading ? <div className="panel">Chargement...</div> : assessments.length === 0 ? (
        <div className="empty">Aucun entretien ne correspond à ce filtre.</div>
      ) : (
        <div className="enterprise-assessment-grid">
          {assessments.map((assessment) => (
            <article className="enterprise-assessment-card panel" key={assessment.id}>
              <div className="assessment-card-topline">
                <span className={`status-pill ${assessment.type === 'follow_up' ? 'completed' : 'open'}`}>{formatAssessmentType(assessment.type)}</span>
                <span>{formatDate(assessment.assessed_at)}</span>
              </div>
              <h2>{assessment.employee?.full_name}</h2>
              <p>{[assessment.employee?.job_title, assessment.employee?.department].filter(Boolean).join(' · ') || 'Fonction non renseignée'}</p>
              <div className="assessment-card-score"><strong>{assessment.total_score}</strong><span>/ 100</span><small>{assessment.level}</small></div>
              <div className="assessment-card-footer">
                <span><FontAwesomeIcon icon={faClipboardCheck} /> {assessment.responses_count}/20 réponses</span>
                <div className="row-actions">
                  <Link className="icon-btn" title="Modifier" aria-label={`Modifier le diagnostic de ${assessment.employee?.full_name}`} to={`/entreprise/diagnostics/${assessment.id}/modifier`}><FontAwesomeIcon icon={faPenToSquare} /></Link>
                  <Link className="secondary-btn small" to={`/entreprise/diagnostics/${assessment.id}`}>Voir <FontAwesomeIcon icon={faArrowRight} /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && assessments.some((assessment) => assessment.type === 'follow_up') && (
        <Link className="enterprise-progress-cta" to="/entreprise/suivi"><FontAwesomeIcon icon={faChartLine} /> Comparer les scores T0 et T+6 mois <FontAwesomeIcon icon={faArrowRight} /></Link>
      )}
    </div>
  );
}
