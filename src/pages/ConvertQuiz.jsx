import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileExport, 
  faUpload, 
  faDownload,
  faEye,
  faFileWord,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function ConvertQuiz() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleConvert(event) {
    event.preventDefault();
    if (!file) return;

    setError('');
    setConverting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/admin/quizzes/convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setConverting(false);
    }
  }

  function downloadJSON() {
    if (!result) return;
    
    const blob = new Blob([JSON.stringify(result.json, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qcm-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faFileExport} /> Convertisseur</span>
          <h1>Convertir Word/PDF en JSON</h1>
          <p>Uploadez un fichier Word ou PDF et obtenez un JSON prêt pour l'import.</p>
        </div>
      </div>

      <div className="grid-two">
        <form className="panel form-grid" onSubmit={handleConvert}>
          {error && <div className="alert error span-2">{error}</div>}

          <label className="span-2 upload-zone">
            <FontAwesomeIcon icon={faUpload} />
            <strong>{file ? file.name : 'Choisir un fichier Word ou PDF'}</strong>
            <small>Format attendu : "1. Question ?" puis "A. Choix" ou "[x] Choix"</small>
            <input 
              type="file" 
              accept=".doc,.docx,.pdf" 
              onChange={(e) => setFile(e.target.files[0])} 
              required 
            />
          </label>

          <button className="primary-btn span-2" disabled={converting || !file}>
            <FontAwesomeIcon icon={faFileExport} /> {converting ? 'Conversion...' : 'Convertir en JSON'}
          </button>
        </form>

        <div className="panel docs-panel">
          <h2><FontAwesomeIcon icon={faFileWord} /> Format Word</h2>
          <pre>{`1. Question ?
A. Choix 1
B. Choix 2
C. Choix 3

2. Autre question ?
[x] Bonne réponse
[ ] Mauvaise réponse`}</pre>

          <h2><FontAwesomeIcon icon={faFilePdf} /> Format PDF</h2>
          <p>Même structure que Word. Le texte doit être sélectionnable (pas d'image scannée).</p>
        </div>
      </div>

      {result && (
        <div className="panel">
          <div className="result-header">
            <h2><FontAwesomeIcon icon={faEye} /> Aperçu du résultat</h2>
            <button onClick={downloadJSON} className="secondary-btn">
              <FontAwesomeIcon icon={faDownload} /> Télécharger JSON
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>{result.preview.total_questions}</span>
              <small>Questions détectées</small>
            </div>
            <div className="stat-card">
              <span>{result.preview.total_choices}</span>
              <small>Choix de réponses</small>
            </div>
          </div>

          <h3>Aperçu des 3 premières questions</h3>
          <div className="questions-preview">
            {result.preview.questions_preview.map((q, index) => (
              <div key={index} className="preview-question">
                <h4>Question {index + 1} ({q.points} point{q.points > 1 ? 's' : ''})</h4>
                <p className="question-text">{q.body}</p>
                <ul>
                  {q.choices.map((c, cIndex) => (
                    <li key={cIndex} className={c.is_correct ? 'correct' : ''}>
                      {c.is_correct && '✓ '}{c.body}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="json-display">
            <h3>JSON complet</h3>
            <pre>{JSON.stringify(result.json, null, 2)}</pre>
          </div>

          <div className="alert info">
            <strong>Prochaines étapes :</strong>
            <ol>
              <li>Téléchargez le fichier JSON avec le bouton ci-dessus</li>
              <li>Allez dans "Importer QCM"</li>
              <li>Uploadez ce fichier JSON</li>
              <li>N'oubliez pas de PUBLIER le QCM !</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
