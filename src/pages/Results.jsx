import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faChartLine, faCheck, faEye, faMedal, faXmark, faFilter, faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import api from '../api.js';
import { formatDateTime } from '../utils/time.js';
import { formatClassLabel } from '../utils/academicYear.js';
import { filterGradeResults, toLocalDateValue } from '../utils/resultFilters.js';

export default function Results() {
  const [allResults, setAllResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selected, setSelected] = useState(null);
  const results = useMemo(() => filterGradeResults(allResults, {
    classId: selectedClass,
    quizId: selectedQuiz,
    submittedDate: selectedDate,
  }), [allResults, selectedClass, selectedQuiz, selectedDate]);
  const hasActiveFilters = selectedClass !== '' || selectedQuiz !== '' || selectedDate !== '';
  const today = toLocalDateValue(new Date());

  // Nom du participant : élève connecté OU participant public (nom/prénom)
  function participantName(result) {
    if (result.user?.name) return result.user.name;
    const full = [result.participant_prenom, result.participant_nom].filter(Boolean).join(' ').trim();
    return full || 'Anonyme';
  }

  // Référentiel / classe selon le type de participant
  function participantContext(result) {
    if (result.participant_referentiel) return result.participant_referentiel;
    if (result.quiz?.type === 'progressive') return 'Public';
    return formatClassLabel(result.user?.school_class || result.quiz?.school_class, '-');
  }

  // Prépare les lignes à exporter (selon le filtre courant)
  function buildExportRows() {
    return results.map((r) => ({
      Participant: participantName(r),
      'Classe / Référentiel': participantContext(r),
      QCM: r.quiz?.title || '',
      Score: `${r.score}/${r.total_points}`,
      'Résultat': r.quiz?.type === 'progressive'
        ? `Stade ${r.stade_atteint ?? '-'}`
        : `${r.note_sur_20}/20`,
      'Envoyé le': formatDateTime(r.submitted_at)
    }));
  }

  // Export Excel (vrai fichier .xlsx)
  function exportExcel() {
    const rows = buildExportRows();
    if (rows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    // Largeur des colonnes
    worksheet['!cols'] = [
      { wch: 24 }, { wch: 26 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 20 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes');
    XLSX.writeFile(workbook, `notes-qcm-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // Export PDF via la fenêtre d'impression (l'utilisateur choisit "Enregistrer en PDF")
  function exportPdf() {
    const rows = buildExportRows();
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escapeHtml = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    const thead = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Notes QCM</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1a2233; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        p.sub { color: #6b7280; margin: 0 0 18px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #5b5cf6; color: #fff; text-align: left; padding: 8px; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f6f7fb; }
      </style></head>
      <body>
        <h1>Notes des participants — Check Performance</h1>
        <p class="sub">${rows.length} résultat(s) · Exporté le ${new Date().toLocaleString('fr-FR')}</p>
        <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
        <script>window.onload = function(){ window.print(); }<\/script>
      </body></html>`);
    win.document.close();
  }

  // Fonction pour charger les résultats
  const loadResults = useCallback(() => {
    Promise.all([
      api.get('/admin/results'),
      api.get('/admin/classes'),
      api.get('/admin/quizzes')
    ]).then(([resultsResponse, classesResponse, quizzesResponse]) => {
      setAllResults(resultsResponse.data);
      setClasses(classesResponse.data);
      setQuizzes(quizzesResponse.data);
    });
  }, []);

  // Charger les résultats au montage
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Recharger automatiquement toutes les 30 secondes pour voir les nouvelles soumissions
  useEffect(() => {
    const interval = setInterval(() => {
      loadResults();
    }, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, [loadResults]);

  function handleClassFilter(classId) {
    setSelectedClass(classId);
    setSelectedQuiz(''); // réinitialise le filtre QCM (il ne concerne plus la même classe)
  }

  function resetFilters() {
    setSelectedClass('');
    setSelectedQuiz('');
    setSelectedDate('');
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faMedal} /> Notes</span>
          <h1>Résultats des élèves</h1>
          <p>L'administrateur reçoit ici toutes les notes envoyées.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={exportExcel} disabled={results.length === 0}>
            <FontAwesomeIcon icon={faFileExcel} /> Excel
          </button>
          <button className="secondary-btn" onClick={exportPdf} disabled={results.length === 0}>
            <FontAwesomeIcon icon={faFilePdf} /> PDF
          </button>
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
                <option key={classe.id} value={classe.id}>{formatClassLabel(classe)}</option>
              ))}
            </select>
          </label>
          <label>
            QCM :
            <select value={selectedQuiz} onChange={(e) => setSelectedQuiz(e.target.value)}>
              <option value="">Tous les QCM</option>
              {quizzes
                .filter((quiz) => selectedClass === '' || Number(quiz.school_class?.id ?? quiz.school_class_id) === parseInt(selectedClass, 10))
                .map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                ))}
            </select>
          </label>
          <label>
            Date de passage :
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) => setSelectedDate(event.target.value)}
              title="Afficher les notes envoyées à cette date"
            />
          </label>
          {hasActiveFilters && (
            <button className="secondary-btn small filter-reset" type="button" onClick={resetFilters}>
              <FontAwesomeIcon icon={faXmark} /> Réinitialiser
            </button>
          )}
          <span className="filter-count" aria-live="polite">
            {results.length} résultat{results.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="panel table-panel results-table-panel">
        {results.length === 0 ? (
          <div className="empty results-filter-empty">
            <p>{hasActiveFilters ? 'Aucun résultat ne correspond aux filtres sélectionnés.' : 'Aucune soumission pour le moment.'}</p>
            {hasActiveFilters && (
              <button className="secondary-btn small" type="button" onClick={resetFilters}>
                <FontAwesomeIcon icon={faXmark} /> Effacer les filtres
              </button>
            )}
          </div>
        ) : (
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
                  <td>
                    <div className="gradebook-table-actions">
                      {result.user?.id && (
                        <Link className="secondary-btn small" to={`/admin/students/${result.user.id}/results`}>
                          <FontAwesomeIcon icon={faChartLine} /> Toutes les notes
                        </Link>
                      )}
                      <button className="secondary-btn small" onClick={() => setSelected(result)}>
                        <FontAwesomeIcon icon={faEye} /> Détails
                      </button>
                    </div>
                  </td>
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
