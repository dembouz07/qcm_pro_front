import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faCheck, faEye, faMedal, faXmark, faFilter } from '@fortawesome/free-solid-svg-icons';
import api from '../api.js';
import { formatDateTime } from '../utils/time.js';

export default function Results() {
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selected, setSelected] = useState(null);

  // Fonction pour charger les résultats
  const loadResults = () => {
    Promise.all([
      api.get('/admin/results'),
      api.get('/admin/classes')
    ]).then(([resultsResponse, classesResponse]) => {
      const resultsData = resultsResponse.data;
      setAllResults(resultsData);
      
      // Appliquer le filtre actuel si un filtre est sélectionné
      if (selectedClass === '') {
        setResults(resultsData);
      } else {
        const filtered = resultsData.filter(result => 
          result.user?.school_class?.id === parseInt(selectedClass) ||
          result.quiz?.school_class_id === parseInt(selectedClass)
        );
        setResults(filtered);
      }
      
      setClasses(classesResponse.data);
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
  }, [selectedClass]);

  function handleFilterChange(classId) {
    setSelectedClass(classId);
    
    if (classId === '') {
      setResults(allResults);
    } else {
      const filtered = allResults.filter(result => 
        result.user?.school_class?.id === parseInt(classId) ||
        result.quiz?.school_class_id === parseInt(classId)
      );
      setResults(filtered);
    }
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
            Filtrer par classe :
            <select value={selectedClass} onChange={(e) => handleFilterChange(e.target.value)}>
              <option value="">Toutes les classes</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.name}</option>
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
                <th>Élève</th>
                <th>Classe</th>
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
                  <td>{result.user?.name}</td>
                  <td>{result.user?.school_class?.name || result.quiz?.school_class?.name}</td>
                  <td>{result.quiz?.title}</td>
                  <td>{result.score}/{result.total_points}</td>
                  <td><span className="score-badge"><FontAwesomeIcon icon={faAward} /> {result.note_sur_20}/20</span></td>
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
            <h2>{selected.user?.name} — {selected.note_sur_20}/20</h2>
            <p className="muted">{selected.quiz?.title} · {formatDateTime(selected.submitted_at)}</p>
            <div className="answer-list">
              {selected.answers?.map((answer) => (
                <div className="answer-item" key={answer.id}>
                  <strong>{answer.question?.body}</strong>
                  <span className={answer.is_correct ? 'ok' : 'bad'}>
                    <FontAwesomeIcon icon={answer.is_correct ? faCheck : faXmark} /> {answer.choice?.body}
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
