import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faUserShield, faGraduationCap, faCrown, faLayerGroup,
  faListCheck, faPaperPlane, faSackDollar, faRotateRight, faTriangleExclamation,
  faUserSlash, faUsersGear,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStats() {
    try {
      setError('');
      setLoading(true);
      const response = await api.get('/superadmin/stats');
      setStats(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCrown} /> Super-administration</span>
          <h1>Tableau de bord plateforme</h1>
          <p>Vue globale de l'activité de la plateforme QCM Pro.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="secondary-btn" to="/superadmin/revenue">
            <FontAwesomeIcon icon={faSackDollar} /> Revenus
          </Link>
          <Link className="secondary-btn" to="/superadmin/users">
            <FontAwesomeIcon icon={faUsersGear} /> Gérer les utilisateurs
          </Link>
          <button className="secondary-btn" type="button" onClick={loadStats} disabled={loading}>
            <FontAwesomeIcon icon={faRotateRight} /> Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="alert warning">
          <FontAwesomeIcon icon={faTriangleExclamation} /> {error}
        </div>
      )}

      {loading ? (
        <div className="empty">Chargement des statistiques...</div>
      ) : stats ? (
        <>
          <section className="stats-grid">
            <div className="stat-card"><FontAwesomeIcon icon={faUsers} /><span>{fmt(stats.users.total)}</span><small>Utilisateurs</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faUserShield} /><span>{fmt(stats.users.admins)}</span><small>Formateurs</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faGraduationCap} /><span>{fmt(stats.users.students)}</span><small>Élèves</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faUserSlash} /><span>{fmt(stats.users.blocked)}</span><small>Bloqués</small></div>
          </section>

          <section className="stats-grid">
            <div className="stat-card"><FontAwesomeIcon icon={faListCheck} /><span>{fmt(stats.quizzes.total)}</span><small>QCM créés</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faLayerGroup} /><span>{fmt(stats.classes.total)}</span><small>Classes</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faPaperPlane} /><span>{fmt(stats.submissions.total)}</span><small>Soumissions</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faCrown} /><span>{fmt(stats.subscriptions.active)}</span><small>Abonnés actifs</small></div>
          </section>

          <section className="stats-grid">
            <div className="stat-card"><FontAwesomeIcon icon={faSackDollar} /><span>{fmt(stats.revenue.total_fcfa)} F</span><small>Revenus (FCFA)</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faSackDollar} /><span>{fmt(stats.revenue.payments_completed)}</span><small>Paiements réussis</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faPaperPlane} /><span>{fmt(stats.submissions.last_7_days)}</span><small>Soumissions (7j)</small></div>
            <div className="stat-card"><FontAwesomeIcon icon={faListCheck} /><span>{fmt(stats.quizzes.progressive)}</span><small>QCM progressifs</small></div>
          </section>
        </>
      ) : null}
    </div>
  );
}
