import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBuilding, faChartLine, faClipboardCheck, faClock, faCirclePlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import { formatAssessmentType, formatDate } from '../../utils/enterprise.js';

export default function EnterpriseDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/enterprise/dashboard')
      .then((response) => setData(response.data))
      .catch((err) => setError(getApiError(err)));
  }, []);

  if (!data && !error) return <div className="page"><div className="panel">Chargement...</div></div>;

  const stats = data?.stats || {};

  return (
    <div className="page enterprise-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faBuilding} /> Espace entreprise</span>
          <h1>Pilotage des soft skills</h1>
          <p>{data?.company?.name ? `${data.company.name} · ` : ''}Suivez les diagnostics Mindset, les piliers de progression et les actions à mener.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-btn" to="/entreprise/collaborateurs/nouveau"><FontAwesomeIcon icon={faUsers} /> Ajouter un collaborateur</Link>
          <Link className="primary-btn" to="/entreprise/diagnostics/nouveau"><FontAwesomeIcon icon={faCirclePlus} /> Nouveau diagnostic</Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <section className="stats-grid enterprise-stats-grid">
        <article className="stat-card"><FontAwesomeIcon icon={faUsers} /><span>{stats.employees || 0}</span><small>Collaborateurs</small></article>
        <article className="stat-card"><FontAwesomeIcon icon={faClipboardCheck} /><span>{stats.assessments || 0}</span><small>Diagnostics réalisés</small></article>
        <article className="stat-card"><FontAwesomeIcon icon={faChartLine} /><span>{stats.average_score ? `${stats.average_score}` : '—'}</span><small>Score moyen / 100</small></article>
        <article className="stat-card"><FontAwesomeIcon icon={faClock} /><span>{stats.follow_ups_due || 0}</span><small>Suivis à réaliser</small></article>
      </section>

      <section className="grid-two enterprise-dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div><h2><FontAwesomeIcon icon={faChartLine} /> Scores moyens par pilier</h2><p>Chaque pilier est noté sur 25.</p></div>
            <Link className="text-link" to="/entreprise/suivi">Voir le suivi <FontAwesomeIcon icon={faArrowRight} /></Link>
          </div>
          <div className="pillar-summary-list">
            {(data?.pillars || []).map((pillar) => {
              const percentage = pillar.average_score === null ? 0 : pillar.average_score * 20;
              return (
                <div className="pillar-summary" key={pillar.key}>
                  <div><strong>{pillar.label}</strong><span>{pillar.average_score === null ? 'Aucune donnée' : `${pillar.average_score} / 5`}</span></div>
                  <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div><h2><FontAwesomeIcon icon={faClipboardCheck} /> Derniers diagnostics</h2><p>Les entretiens les plus récemment enregistrés.</p></div>
            <Link className="text-link" to="/entreprise/diagnostics">Tout voir <FontAwesomeIcon icon={faArrowRight} /></Link>
          </div>
          {!data?.recent_assessments?.length ? (
            <div className="empty">Aucun diagnostic enregistré. Commencez par ajouter un collaborateur.</div>
          ) : data.recent_assessments.map((assessment) => (
            <Link className="enterprise-recent-item" key={assessment.id} to={`/entreprise/diagnostics/${assessment.id}`}>
              <div>
                <strong>{assessment.employee?.full_name}</strong>
                <small>{assessment.employee?.job_title || 'Fonction non renseignée'} · {formatAssessmentType(assessment.type)} · {formatDate(assessment.assessed_at)}</small>
              </div>
              <span className="score-badge">{assessment.total_score}/100</span>
            </Link>
          ))}
        </article>
      </section>
    </div>
  );
}
