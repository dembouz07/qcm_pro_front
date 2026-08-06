import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faAward,
  faEye,
  faMedal,
  faRotateRight,
  faTriangleExclamation,
  faTrophy,
  faUserGraduate,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import CorrectionView from '../components/CorrectionView.jsx';
import { formatDateTime } from '../utils/time.js';
import { formatClassLabel } from '../utils/academicYear.js';

export default function StudentGradebook() {
  const { id } = useParams();
  const [gradebook, setGradebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  async function loadGradebook() {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/admin/students/${id}/results`);
      setGradebook(response.data);
    } catch (err) {
      setGradebook(null);
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function openSubmission(submissionId) {
    try {
      setError('');
      setDetail({ loading: true });
      const response = await api.get(`/admin/results/${submissionId}`);
      setDetail(response.data);
    } catch (err) {
      setDetail(null);
      setError(getApiError(err));
    }
  }

  useEffect(() => {
    loadGradebook();
  }, [id]);

  const results = gradebook?.results || [];
  const stats = gradebook?.stats || {};

  return (
    <div className="page student-gradebook-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faMedal} /> Suivi individuel</span>
          <h1>Toutes les notes de l'élève</h1>
          <p>Consultez son historique complet sur les QCM de vos classes.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-btn" to="/admin/classes">
            <FontAwesomeIcon icon={faArrowLeft} /> Classes
          </Link>
          <button className="secondary-btn" type="button" onClick={loadGradebook} disabled={loading}>
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
        <div className="panel empty">Chargement des notes...</div>
      ) : gradebook ? (
        <>
          <section className="panel gradebook-student-summary">
            <span><FontAwesomeIcon icon={faUserGraduate} /></span>
            <div>
              <h2>{gradebook.student.name}</h2>
              <p>{gradebook.student.email} · {formatClassLabel(gradebook.student.class)}</p>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <FontAwesomeIcon icon={faMedal} />
              <span>{stats.submissions_count ?? 0}</span>
              <small>Tests passés</small>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faAward} />
              <span>{stats.average_note == null ? '-' : Number(stats.average_note).toFixed(2)}</span>
              <small>Moyenne /20</small>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faTrophy} />
              <span>{stats.best_note == null ? '-' : Number(stats.best_note).toFixed(2)}</span>
              <small>Meilleure note /20</small>
            </div>
          </section>

          <div className="panel table-panel">
            {results.length === 0 ? (
              <div className="empty">Cet élève n'a encore passé aucun de vos QCM.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>QCM</th>
                    <th>Classe</th>
                    <th>Score</th>
                    <th>Résultat</th>
                    <th>Passé le</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td><strong>{result.quiz?.title || 'QCM supprimé'}</strong></td>
                      <td>{formatClassLabel({
                        name: result.quiz?.class || gradebook.student.class?.name,
                        academic_year: result.quiz?.academic_year || gradebook.student.class?.academic_year,
                      }, '-')}</td>
                      <td>{result.score}/{result.total_points}</td>
                      <td>
                        {result.quiz?.type === 'progressive' ? (
                          <span className="score-badge">
                            <FontAwesomeIcon icon={faAward} /> Stade {result.stade_atteint ?? '-'}
                          </span>
                        ) : (
                          <span className="score-badge">
                            <FontAwesomeIcon icon={faAward} /> {result.note_sur_20}/20
                          </span>
                        )}
                      </td>
                      <td>{formatDateTime(result.submitted_at)}</td>
                      <td>
                        <button className="secondary-btn small" type="button" onClick={() => openSubmission(result.id)}>
                          <FontAwesomeIcon icon={faEye} /> Copie
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}

      <AnimatePresence>
        {detail && (
          <motion.div
            className="dlg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetail(null)}
          >
            <motion.div
              className="dlg-card correction-modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="correction-close" type="button" onClick={() => setDetail(null)} aria-label="Fermer">
                <FontAwesomeIcon icon={faXmark} />
              </button>
              {detail.loading ? (
                <div className="empty">Chargement de la copie...</div>
              ) : (
                <>
                  <h2>{detail.student?.name}</h2>
                  <p className="muted">
                    {detail.correction?.quiz_title} · {detail.correction?.note_sur_20}/20
                  </p>
                  <CorrectionView correction={detail.correction} answerLabel="réponse de l'élève" />
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
