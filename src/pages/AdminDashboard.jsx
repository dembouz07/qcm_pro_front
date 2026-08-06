import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClock, faCirclePlus, faFileImport, faLayerGroup, faMedal, faDiagramProject } from '@fortawesome/free-solid-svg-icons';
import api from '../api.js';
import CountUp from '../components/CountUp.jsx';
import { formatDateTime } from '../utils/time.js';
import { formatClassLabel } from '../utils/academicYear.js';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const rise = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

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

      <motion.section className="stats-grid" variants={container} initial="hidden" animate="show">
        <motion.div className="stat-card" variants={rise} whileHover={{ y: -5 }}><FontAwesomeIcon icon={faLayerGroup} /><span><CountUp value={classes.length} /></span><small>Classes</small></motion.div>
        <motion.div className="stat-card" variants={rise} whileHover={{ y: -5 }}><FontAwesomeIcon icon={faCirclePlus} /><span><CountUp value={quizzes.length} /></span><small>QCM créés</small></motion.div>
        <motion.div className="stat-card" variants={rise} whileHover={{ y: -5 }}><FontAwesomeIcon icon={faMedal} /><span><CountUp value={results.length} /></span><small>Notes reçues</small></motion.div>
      </motion.section>

      <motion.section className="grid-two" variants={container} initial="hidden" animate="show">
        <motion.div className="panel" variants={rise}>
          <h2><FontAwesomeIcon icon={faClock} /> Prochains QCM</h2>
          {quizzes.length === 0 ? <div className="empty">Aucun QCM pour le moment.</div> : quizzes.slice(0, 5).map((quiz, i) => (
            <motion.div className="list-item" key={quiz.id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }} whileHover={{ x: 4 }}>
              <div>
                <strong>{quiz.title}</strong>
                <small>{quiz.type === 'progressive' ? 'Public' : formatClassLabel(quiz.school_class)} · {quiz.questions_count} questions</small>
              </div>
              <span className="badge">
                {quiz.type === 'progressive'
                  ? (quiz.closed_at ? 'Fermé' : 'Ouvert')
                  : formatDateTime(quiz.starts_at)}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="panel" variants={rise}>
          <h2><FontAwesomeIcon icon={faMedal} /> Dernières notes</h2>
          {results.length === 0 ? <div className="empty">Aucune note reçue.</div> : results.slice(0, 5).map((result, i) => (
            <motion.div className="list-item" key={result.id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }} whileHover={{ x: 4 }}>
              <div>
                <strong>{result.user?.name || [result.participant_prenom, result.participant_nom].filter(Boolean).join(' ') || 'Anonyme'}</strong>
                <small>{result.quiz?.title}</small>
              </div>
              <span className="score-badge">
                {result.quiz?.type === 'progressive' ? `Stade ${result.stade_atteint ?? '-'}` : `${result.note_sur_20}/20`}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
    </div>
  );
}
