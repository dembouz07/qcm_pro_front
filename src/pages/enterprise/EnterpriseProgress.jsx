import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowTrendUp, faChartLine, faClipboardCheck, faUsers } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import { formatDate, signedScore } from '../../utils/enterprise.js';

export default function EnterpriseProgress() {
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enterprise/progress')
      .then((response) => setProgress(response.data))
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const completedFollowUps = progress.filter((item) => item.initial && item.follow_up).length;

  return (
    <div className="page enterprise-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faChartLine} /> Suivi de progression</span>
          <h1>Comparaison des diagnostics</h1>
          <p>Mesurez l’évolution de chaque collaborateur entre le diagnostic initial T0 et l’entretien de suivi T+6 mois.</p>
        </div>
        <div className="header-actions"><Link className="secondary-btn" to="/entreprise/diagnostics"><FontAwesomeIcon icon={faClipboardCheck} /> Voir les diagnostics</Link></div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <section className="stats-grid enterprise-stats-grid small">
        <article className="stat-card"><FontAwesomeIcon icon={faUsers} /><span>{progress.length}</span><small>Collaborateurs suivis</small></article>
        <article className="stat-card"><FontAwesomeIcon icon={faArrowTrendUp} /><span>{completedFollowUps}</span><small>Comparaisons disponibles</small></article>
      </section>

      {loading ? <div className="panel">Chargement...</div> : progress.length === 0 ? (
        <div className="empty">Ajoutez des collaborateurs puis réalisez leur premier diagnostic.</div>
      ) : (
        <section className="panel table-panel enterprise-table-panel">
          <table>
            <thead><tr><th>Collaborateur</th><th>Diagnostic T0</th><th>Suivi T+6</th><th>Évolution</th><th aria-label="Détail" /></tr></thead>
            <tbody>
              {progress.map((item) => (
                <tr key={item.employee.id}>
                  <td><strong>{item.employee.full_name}</strong><small className="table-subline">{[item.employee.job_title, item.employee.department].filter(Boolean).join(' · ') || 'Fonction non renseignée'}</small></td>
                  <td>{item.initial ? <Link className="progress-link" to={`/entreprise/diagnostics/${item.initial.id}`}><strong>{item.initial.total_score}/100</strong><small>{formatDate(item.initial.assessed_at)}</small></Link> : <span className="muted">À réaliser</span>}</td>
                  <td>{item.follow_up ? <Link className="progress-link" to={`/entreprise/diagnostics/${item.follow_up.id}`}><strong>{item.follow_up.total_score}/100</strong><small>{formatDate(item.follow_up.assessed_at)}</small></Link> : item.initial ? <span className="status-pill locked">En attente</span> : <span className="muted">—</span>}</td>
                  <td>{item.delta === null ? <span className="muted">—</span> : <strong className={`delta ${item.delta >= 0 ? 'positive' : 'negative'}`}>{signedScore(item.delta)} points</strong>}</td>
                  <td>{item.follow_up ? <Link className="secondary-btn small" to={`/entreprise/diagnostics/${item.follow_up.id}`}>Comparer <FontAwesomeIcon icon={faArrowRight} /></Link> : item.initial ? <Link className="primary-btn small" to={`/entreprise/diagnostics/nouveau?employee=${item.employee.id}`}>Ajouter le suivi</Link> : <Link className="secondary-btn small" to={`/entreprise/diagnostics/nouveau?employee=${item.employee.id}`}>Diagnostiquer</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
