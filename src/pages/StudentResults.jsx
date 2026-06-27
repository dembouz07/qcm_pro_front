import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faMedal, faTrophy, faRotateRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { formatDateTime } from '../utils/time.js';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadResults() {
    try {
      setError('');
      const response = await api.get('/student/results');
      setResults(response.data.data || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  const moyenne = results.length
    ? (results
        .filter((r) => r.quiz_type !== 'progressive')
        .reduce((sum, r) => sum + Number(r.note_sur_20 || 0), 0) /
        Math.max(1, results.filter((r) => r.quiz_type !== 'progressive').length)
      ).toFixed(2)
    : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faMedal} /> Mes notes</span>
          <h1>Mes résultats</h1>
          <p>Retrouvez ici vos notes sur tous les tests que vous avez passés.</p>
        </div>
        <button className="secondary-btn" type="button" onClick={loadResults} disabled={loading}>
          <FontAwesomeIcon icon={faRotateRight} /> Actualiser
        </button>
      </div>

      {error && (
        <div className="alert warning">
          <FontAwesomeIcon icon={faTriangleExclamation} /> {error}
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card"><FontAwesomeIcon icon={faTrophy} /><span>{results.length}</span><small>Tests passés</small></div>
        <div className="stat-card"><FontAwesomeIcon icon={faAward} /><span>{moyenne ?? '-'}</span><small>Moyenne /20</small></div>
      </section>

      <div className="panel table-panel">
        {loading ? (
          <div className="empty">Chargement...</div>
        ) : results.length === 0 ? (
          <div className="empty">Vous n'avez encore passé aucun test.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>QCM</th>
                <th>Score</th>
                <th>Résultat</th>
                <th>Passé le</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.quiz_title}</strong></td>
                  <td>{r.score}/{r.total_points}</td>
                  <td>
                    {r.quiz_type === 'progressive' ? (
                      <span className="score-badge"><FontAwesomeIcon icon={faAward} /> Stade {r.stade_atteint ?? '-'}</span>
                    ) : (
                      <span className="score-badge"><FontAwesomeIcon icon={faAward} /> {r.note_sur_20}/20</span>
                    )}
                  </td>
                  <td>{formatDateTime(r.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
