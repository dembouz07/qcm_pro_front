import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faMedal, faTrophy, faRotateRight, faTriangleExclamation, faListCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import CorrectionView from '../components/CorrectionView.jsx';
import { formatDateTime } from '../utils/time.js';
import { formatClassLabel } from '../utils/academicYear.js';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [correction, setCorrection] = useState(null);
  const [loadingCorrection, setLoadingCorrection] = useState(false);

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

  async function openCorrection(quizId) {
    try {
      setLoadingCorrection(true);
      setCorrection({ loading: true });
      const response = await api.get(`/student/quizzes/${quizId}/correction`);
      setCorrection(response.data);
    } catch (err) {
      setCorrection(null);
      setError(getApiError(err));
    } finally {
      setLoadingCorrection(false);
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
                <th>Classe</th>
                <th>Score</th>
                <th>Résultat</th>
                <th>Passé le</th>
                <th>Correction</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.quiz_title}</strong></td>
                  <td>{formatClassLabel({ name: r.school_class, academic_year: r.academic_year }, '-')}</td>
                  <td>{r.score}/{r.total_points}</td>
                  <td>
                    {r.quiz_type === 'progressive' ? (
                      <span className="score-badge"><FontAwesomeIcon icon={faAward} /> Stade {r.stade_atteint ?? '-'}</span>
                    ) : (
                      <span className="score-badge"><FontAwesomeIcon icon={faAward} /> {r.note_sur_20}/20</span>
                    )}
                  </td>
                  <td>{formatDateTime(r.submitted_at)}</td>
                  <td>
                    {r.show_corrections && r.quiz_id ? (
                      <button className="secondary-btn small" type="button" onClick={() => openCorrection(r.quiz_id)}>
                        <FontAwesomeIcon icon={faListCheck} /> Voir
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {correction && (
          <motion.div
            className="dlg-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCorrection(null)}
          >
            <motion.div
              className="dlg-card correction-modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="correction-close" type="button" onClick={() => setCorrection(null)} aria-label="Fermer">
                <FontAwesomeIcon icon={faXmark} />
              </button>
              {correction.loading || loadingCorrection ? (
                <div className="empty">Chargement de la correction...</div>
              ) : (
                <>
                  <h2 style={{ marginTop: 0 }}>{correction.quiz_title}</h2>
                  <p className="muted">Note : {correction.note_sur_20}/20 · {correction.score}/{correction.total_points} points</p>
                  <CorrectionView correction={correction} />
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
