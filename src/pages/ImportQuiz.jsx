import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faDownload, faFileCsv, faFileImport, faFileLines, faUpload } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function ImportQuiz() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', school_class_id: '', starts_at: '', ends_at: '', file: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/classes').then((response) => setClasses(response.data));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== '') payload.append(key, value);
    });

    try {
      await api.post('/admin/quizzes/import', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/admin');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faFileImport} /> Import</span>
          <h1>Importer un QCM</h1>
          <p>Importez un fichier CSV ou JSON, puis choisissez la classe et l'heure d'ouverture.</p>
        </div>
      </div>

      <section className="grid-two">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          {error && <div className="alert error span-2">{error}</div>}

          <label>
            Titre du QCM
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Peut aussi venir du JSON" />
          </label>

          <label>
            Classe concernée
            <select value={form.school_class_id} onChange={(e) => setForm({ ...form, school_class_id: e.target.value })}>
              <option value="">Choisir une classe</option>
              {classes.map((classe) => <option key={classe.id} value={classe.id}>{classe.name}</option>)}
            </select>
          </label>

          <label>
            Ouverture précise
            <div className="input-icon plain">
              <FontAwesomeIcon icon={faCalendarDays} />
              <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
          </label>

          <label>
            Fermeture facultative
            <div className="input-icon plain">
              <FontAwesomeIcon icon={faCalendarDays} />
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </label>

          <label className="span-2">
            Description
            <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <label className="span-2 upload-zone">
            <FontAwesomeIcon icon={faUpload} />
            <strong>{form.file ? form.file.name : 'Choisir un fichier CSV, JSON, Word ou PDF'}</strong>
            <small>Formats supportés : CSV, JSON, DOCX, DOC, PDF (max 10 Mo)</small>
            <input type="file" accept=".csv,.txt,.json,.doc,.docx,.pdf" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} required />
          </label>

          <button className="primary-btn span-2" disabled={loading}>
            <FontAwesomeIcon icon={faFileImport} /> {loading ? 'Import...' : 'Importer le QCM'}
          </button>
        </form>

        <div className="panel docs-panel">
          <h2><FontAwesomeIcon icon={faFileCsv} /> Modèle CSV</h2>
          <pre>{`question,choice,is_correct,points
"Quelle est la capitale du Sénégal ?","Dakar",1,1
"Quelle est la capitale du Sénégal ?","Paris",0,1
"Combien font 2 + 2 ?","4",1,1`}</pre>

          <h2><FontAwesomeIcon icon={faFileLines} /> Modèle JSON</h2>
          <pre>{`{
  "title": "QCM exemple",
  "school_class_id": 1,
  "starts_at": "2026-06-20 08:00:00",
  "questions": [
    {
      "body": "Question ?",
      "points": 1,
      "choices": [
        { "body": "Bonne réponse", "is_correct": true },
        { "body": "Mauvaise réponse", "is_correct": false }
      ]
    }
  ]
}`}</pre>

          <h2><FontAwesomeIcon icon={faFileLines} /> Format Word/PDF</h2>
          <pre>{`1. Votre question ici ?
[x] Bonne réponse
[ ] Mauvaise réponse
[ ] Autre réponse

2. Autre question ?
A) Première option
B) Deuxième option (bonne)
C) Troisième option`}</pre>
          <div className="hint"><FontAwesomeIcon icon={faDownload} /> Marquez les bonnes réponses avec [x] ou indiquez-les dans le titre.</div>
        </div>
      </section>
    </div>
  );
}
