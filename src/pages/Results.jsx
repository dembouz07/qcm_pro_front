import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faCheck, faEye, faMedal, faXmark, faFilter } from '@fortawesome/free-solid-svg-icons';
import api from '../api.js';
import { formatDateTime } from '../utils/time.js';

export default function Results() {
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selected, setSelected] = useState(null);

  // Nom du participant : élève connecté OU participant public (nom/prénom)
  function participantName(result) {
    if (result.user?.name) return result.user.name;
    const full = [result.participant_prenom, result.participant_nom].filter(Boolean).join(' ').trim();
    return full || 'Anonyme';
  }

  // Référentiel / classe selon le type de participant
  function participantContext(result) {
    if (result.participant_referentiel) return result.participant_referentiel;
    return result.user?.school_class?.name || result.quiz?.school_class?.name || '-';
  }

  function applyFilters(data, classId, quizId) {
    let filtered = data;
    if (classId !== '') {
      filtered = filtered.filter((result) =>
        result.user?.school_class?.id === parseInt(classId) ||
        result.quiz?.school_class_id === parseInt(classId)
      );
    }
    if (quizId !== '') {
      filtered = filtered.filter((result) => result.quiz?.id === parseInt(quizId));
    }
    return filtered;
  }

  // Fonction pour charger les résultats
  const loadResults = () => {
    Promise.all([
      api.get('/admin/results'),
      api.get('/admin/classes'),
      api.get('/admin/quizzes')
    ]).then(([resultsResponse, classesResponse, quizzesResponse]) => {
      const resultsData = resultsResponse.data;
      setAllResults(resultsData);
      setResults(applyFilters(resultsData, selectedClass, selectedQuiz));
      setClasses(classesResponse.data);
      setQuizzes(quizzesResponse.data);
    });
  };

  // Charger les résultats au montage
  useEffect(() => {
    loadResults();
  }, []);

  // Recharger automatiquement toutes les 30 secondes pour voir les nouvelles soumissions
  useEffect(() => {
    const interval = setInterval(() => {
      loadResults();
    }, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, [selectedClass, selectedQuiz]);

  function handleClassFilter(classId) {
    setSelectedClass(classId);
    setResults(applyFilters(allResults, classId, selectedQuiz));
  }

  function handleQuizFilter(quizId) {
    setSelectedQuiz(quizId);
    setResults(applyFilters(allResults, selectedClass, quizId));
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faMedal} /> Notes</span>
          <h1>Résultats des élèves</h1>
          <p>L'administrateur reçoit ici toutes les notes envoyées.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <FontAwesomeIcon icon={faFilter} />
          <label>
            Classe :
            <select value={selectedClass} onChange={(e) => handleClassFilter(e.target.value)}>
              <option value="">Toutes les classes</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.name}</option>
              ))}
            </select>
          </label>
          <label>
            QCM :
            <select value={selectedQuiz} onChange={(e) => handleQuizFilter(e.target.value)}>
              <option value="">Tous les QCM</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </select>
          </label>
          <span className="filter-count">
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="panel table-panel">
        {results.length === 0 ? <div className="empty">Aucune soumission pour le moment.</div> : (
          <table>
            <thead>
              <tr>
                <th>Participant</th>
                <th>Classe / Référentiel</th>
                <th>QCM</th>
                <th>Score</th>
                <th>Note</th>
                <th>Envoyé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td><strong>{participantName(result)}</strong></td>
                  <td>{participantContext(result)}</td>
                  <td>{result.quiz?.title}</td>
                  <td>{result.score}/{result.total_points}</td>
                  <td>
                    {result.quiz?.type === 'progressive' ? (
                      <span className="score-badge"><FontAwesomeIcon icon={faAward} /> Stade {result.stade_atteint ?? '-'}</span>
                    ) : (
                      <span className="score-badge"><FontAwesomeIcon icon={faAward} /> {result.note_sur_20}/20</span>
                    )}
                  </td>
                  <td>{formatDateTime(result.submitted_at)}</td>
                  <td><button className="secondary-btn small" onClick={() => setSelected(result)}><FontAwesomeIcon icon={faEye} /> Détails</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <h2>
              {participantName(selected)} — {selected.quiz?.type === 'progressive'
                ? `Stade ${selected.stade_atteint ?? '-'}`
                : `${selected.note_sur_20}/20`}
            </h2>
            <p className="muted">{selected.quiz?.title} · {formatDateTime(selected.submitted_at)}</p>
            <p className="muted">{participantContext(selected)}</p>
            <div className="answer-list">
              {selected.answers?.map((answer) => (
                <div className="answer-item" key={answer.id}>
                  <strong>{answer.question?.body}</strong>
                  <span className={answer.is_correct ? 'ok' : 'bad'}>
                    <FontAwesomeIcon icon={answer.is_correct ? faCheck : faXmark} /> {answer.choice?.body || 'Non répondu'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
