import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faCheckCircle, faClock, faLock, faPenToSquare, faRotateRight, faTrophy, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { countdownTo, formatDateTime } from '../utils/time.js';

function statusInfo(status) {
  return {
    locked: { label: 'Verrouillé', icon: faLock, className: 'locked' },
    open: { label: 'Ouvert', icon: faPenToSquare, className: 'open' },
    closed: { label: 'Fermé', icon: faClock, className: 'closed' },
    completed: { label: 'Terminé', icon: faCheckCircle, className: 'completed' }
  }[status] || { label: status, icon: faClock, className: '' };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [studentClass, setStudentClass] = useState(user?.school_class || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  async function loadQuizzes() {
    try {
      setError('');
      const response = await api.get('/student/quizzes');
      const payload = response.data;
      const data = Array.isArray(payload) ? payload : payload.data || [];

      setQuizzes(data);
      if (!Array.isArray(payload) && payload.student_class) {
        setStudentClass(payload.student_class);
      }

      if (!Array.isArray(payload) && payload.message && data.length === 0) {
        setError(payload.message);
      }
    } catch (err) {
      setQuizzes([]);
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((value) => value + 1);

      const now = new Date();
      const shouldReload = quizzes.some((quiz) => {
        if (quiz.status === 'locked') {
          return now >= new Date(new Date(quiz.starts_at).getTime() - 2000);
        }

        if (quiz.status === 'open' && quiz.ends_at) {
          return now >= new Date(quiz.ends_at);
        }

        return false;
      });

      if (shouldReload) {
        loadQuizzes();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizzes]);

  useEffect(() => {
    const interval = setInterval(loadQuizzes, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => ({
    open: quizzes.filter((quiz) => quiz.status === 'open').length,
    locked: quizzes.filter((quiz) => quiz.status === 'locked').length,
    completed: quizzes.filter((quiz) => quiz.status === 'completed').length
  }), [quizzes]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCalendarCheck} /> Espace élève</span>
          <h1>Mes QCM</h1>
          <p>
            Vous voyez uniquement les QCM programmés pour votre classe
            {studentClass?.name ? ` : ${studentClass.name}.` : '.'}
          </p>
        </div>
        <button className="secondary-btn" type="button" onClick={loadQuizzes} disabled={loading}>
          <FontAwesomeIcon icon={faRotateRight} /> Actualiser
        </button>
      </div>

      {error && (
        <div className="alert warning">
          <FontAwesomeIcon icon={faTriangleExclamation} /> {error}
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card"><FontAwesomeIcon icon={faPenToSquare} /><span>{stats.open}</span><small>Disponibles</small></div>
        <div className="stat-card"><FontAwesomeIcon icon={faLock} /><span>{stats.locked}</span><small>À venir</small></div>
        <div className="stat-card"><FontAwesomeIcon icon={faTrophy} /><span>{stats.completed}</span><small>Terminés</small></div>
      </section>

      <section className="quiz-grid">
        {loading ? (
          <div className="empty panel">Chargement des QCM...</div>
        ) : quizzes.length === 0 ? (
          <div className="empty panel">
            Aucun QCM pour votre classe.
            <br />Vérifiez que l'administrateur a choisi exactement votre classe et que le QCM est publié.
          </div>
        ) : quizzes.map((quiz) => {
          const info = statusInfo(quiz.status);
          return (
            <article className="quiz-card" key={quiz.id}>
              <div className={`status-pill ${info.className}`}><FontAwesomeIcon icon={info.icon} /> {info.label}</div>
              <h2>{quiz.title}</h2>
              <p>{quiz.description || 'Aucune description.'}</p>
              {quiz.school_class?.name && <div className="meta-line">Classe : {quiz.school_class.name}</div>}
              <div className="meta-line"><FontAwesomeIcon icon={faCalendarCheck} /> Ouverture : {formatDateTime(quiz.starts_at)}</div>
              {quiz.ends_at && <div className="meta-line"><FontAwesomeIcon icon={faClock} /> Fermeture : {formatDateTime(quiz.ends_at)}</div>}
              <div className="meta-line">{quiz.questions_count} questions</div>

              {quiz.status === 'locked' && <div className="countdown"><FontAwesomeIcon icon={faLock} /> Ouvre dans {countdownTo(quiz.starts_at)}</div>}
              {quiz.status === 'completed' && <div className="result-note"><FontAwesomeIcon icon={faTrophy} /> Note : {quiz.submission?.note_sur_20}/20</div>}

              {quiz.status === 'open' ? (
                <Link className="primary-btn" to={`/student/quizzes/${quiz.id}`}><FontAwesomeIcon icon={faPenToSquare} /> Commencer</Link>
              ) : (
                <button className="secondary-btn" disabled>{info.label}</button>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
