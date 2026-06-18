import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faCheckCircle, faClock, faLock, faPenToSquare, faTrophy } from '@fortawesome/free-solid-svg-icons';
import api from '../api.js';
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
  const [quizzes, setQuizzes] = useState([]);
  const [, setTick] = useState(0);

  // Fonction pour charger les quizzes
  const loadQuizzes = () => {
    api.get('/student/quizzes').then((response) => {
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setQuizzes(data);
    });
  };

  // Charger les quizzes au montage
  useEffect(() => {
    loadQuizzes();
  }, []);

  // Timer pour le countdown (1 seconde)
  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Recharger les données toutes les 30 secondes pour mettre à jour les statuts
  useEffect(() => {
    const interval = setInterval(() => {
      loadQuizzes();
    }, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, []);

  // Vérifier et mettre à jour les statuts localement chaque seconde
  useEffect(() => {
    const now = new Date();
    let shouldReload = false;

    quizzes.forEach((quiz) => {
      if (quiz.status === 'locked') {
        const startsAt = new Date(quiz.starts_at);
        // Si le quiz devrait être ouvert maintenant
        if (now >= startsAt) {
          shouldReload = true;
        }
      } else if (quiz.status === 'open' && quiz.ends_at) {
        const endsAt = new Date(quiz.ends_at);
        // Si le quiz devrait être fermé maintenant
        if (now >= endsAt) {
          shouldReload = true;
        }
      }
    });

    // Recharger les données si un statut a changé
    if (shouldReload) {
      loadQuizzes();
    }
  }, [quizzes]);

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
          <p>Vous voyez uniquement les QCM programmés pour votre classe.</p>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card"><FontAwesomeIcon icon={faPenToSquare} /><span>{stats.open}</span><small>Disponibles</small></div>
        <div className="stat-card"><FontAwesomeIcon icon={faLock} /><span>{stats.locked}</span><small>À venir</small></div>
        <div className="stat-card"><FontAwesomeIcon icon={faTrophy} /><span>{stats.completed}</span><small>Terminés</small></div>
      </section>

      <section className="quiz-grid">
        {quizzes.length === 0 ? <div className="empty panel">Aucun QCM pour votre classe.</div> : quizzes.map((quiz) => {
          const info = statusInfo(quiz.status);
          return (
            <article className="quiz-card" key={quiz.id}>
              <div className={`status-pill ${info.className}`}><FontAwesomeIcon icon={info.icon} /> {info.label}</div>
              <h2>{quiz.title}</h2>
              <p>{quiz.description || 'Aucune description.'}</p>
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
