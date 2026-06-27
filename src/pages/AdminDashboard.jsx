import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClock, faCirclePlus, faFileImport, faLayerGroup, faMedal, faDiagramProject } from '@fortawesome/free-solid-svg-icons';
import api from '../api.js';
import { formatDateTime } from '../utils/time.js';

export default function AdminDashboard() {
  const [classes, setClasses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);

  // Fonction pour charger les données
  const loadDashboardData = () => {
    Promise.all([
      api.get('/admin/classes'),
      api.get('/admin/quizzes'),
      api.get('/admin/results')
    ]).then(([classesResponse, quizzesResponse, resultsResponse]) => {
      setClasses(classesResponse.data);
      setQuizzes(quizzesResponse.data);
      setResults(resultsResponse.data);
    });
  };

  // Charger au montage
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Recharger automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faChartLine} /> Administration</span>
          <h1>Tableau de bord</h1>
          <p>Créez vos QCM, choisissez la classe, programmez l'heure d'accès et suivez les notes.</p>
        </div>
        <div className="header-actions">
          <Link className="primary-btn" to="/admin/quizzes/create"><FontAwesomeIcon icon={faCirclePlus} /> Créer un QCM</Link>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card"><FontAwesomeIcon icon={faLayerGroup} /><span>{classes.length}</span><small>Classes</small></div>
        <div className="stat-card"><FontAwesomeIcon icon={faCirclePlus} /><span>{quizzes.length}</span><small>QCM créés</small></div>
        <div className="stat-card"><FontAwesomeIcon icon={faMedal} /><span>{results.length}</span><small>Notes reçues</small></div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <h2><FontAwesomeIcon icon={faClock} /> Prochains QCM</h2>
          {quizzes.length === 0 ? <div className="empty">Aucun QCM pour le moment.</div> : quizzes.slice(0, 5).map((quiz) => (
            <div className="list-item" key={quiz.id}>
              <div>
                <strong>{quiz.title}</strong>
                <small>{quiz.school_class?.name} · {quiz.questions_count} questions</small>
              </div>
              <span className="badge">{formatDateTime(quiz.starts_at)}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <h2><FontAwesomeIcon icon={faMedal} /> Dernières notes</h2>
          {results.length === 0 ? <div className="empty">Aucune note reçue.</div> : results.slice(0, 5).map((result) => (
            <div className="list-item" key={result.id}>
              <div>
                <strong>{result.user?.name || [result.participant_prenom, result.participant_nom].filter(Boolean).join(' ') || 'Anonyme'}</strong>
                <small>{result.quiz?.title}</small>
              </div>
              <span className="score-badge">
                {result.quiz?.type === 'progressive' ? `Stade ${result.stade_atteint ?? '-'}` : `${result.note_sur_20}/20`}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
