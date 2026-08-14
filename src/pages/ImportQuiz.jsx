import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faDownload, faFileCsv, faFileImport, faFileLines, faUpload } from '@fortawesome/free-solid-svg-icons';
import { getApiError } from '../api.js';
import AssessmentBuilderPage from '../features/assessmentBuilder/AssessmentBuilderPage.jsx';
import {
  createAssessmentDraft,
  getAssessmentDraft,
  parseAssessmentImport,
} from '../features/assessmentBuilder/assessmentBuilderApi.js';
import {
  normalizeDraftDocument,
  normalizeStandardQuiz,
} from '../features/assessmentBuilder/assessmentBuilderModel.js';
import ParticipantQuizState from '../features/participantQuiz/ParticipantQuizState.jsx';

const ALLOWED_EXTENSIONS = ['csv', 'json', 'doc', 'docx', 'pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validateFile(file) {
  if (!file) return 'Choisissez un fichier à importer.';
  if (file.size > MAX_FILE_SIZE) return 'Le fichier ne doit pas dépasser 10 Mo.';
  const extension = file.name?.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) return 'Format non pris en charge. Utilisez CSV, JSON, DOC, DOCX ou PDF.';
  return '';
}

export default function ImportQuiz() {
  const [searchParams, setSearchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const [file, setFile] = useState(null);
  const [seed, setSeed] = useState(null);
  const [status, setStatus] = useState(draftId ? 'loading' : 'idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!draftId) return;
    let active = true;
    setStatus('loading');
    getAssessmentDraft(draftId)
      .then((draft) => {
        if (!active) return;
        if (draft.mode !== 'standard') throw new Error('Ce brouillon importé n’est pas un QCM standard.');
        setSeed({ draft, document: normalizeDraftDocument(draft) });
        setStatus('ready');
      })
      .catch((loadError) => {
        if (!active) return;
        setError(getApiError(loadError));
        setStatus('error');
      });
    return () => { active = false; };
  }, [draftId]);

  async function handleImport(event) {
    event.preventDefault();
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setStatus('saving');
    try {
      const parsed = await parseAssessmentImport(file);
      const document = normalizeStandardQuiz(parsed.data || {}, 'import');
      document.is_published = false;
      const draft = await createAssessmentDraft(document, null);
      setSeed({ draft, document });
      setSearchParams({ draft: String(draft.id) }, { replace: true });
      setStatus('ready');
    } catch (importError) {
      setError(getApiError(importError));
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return <div className="page narrow"><ParticipantQuizState type="loading" message="Reprise du brouillon importé…" /></div>;
  }

  if (seed) {
    return (
      <AssessmentBuilderPage
        type="standard"
        mode="create"
        source="import"
        initialDocument={seed.document}
        initialDraft={seed.draft}
      />
    );
  }

  return (
    <div className="page assessment-source-page">
      <div className="page-header">
        <div>
          <Link to="/admin/quizzes/create" className="back-link"><FontAwesomeIcon icon={faArrowLeft} /> Retour aux modes de création</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faFileImport} /> Import sécurisé</span>
          <h1>Importer dans le builder</h1>
          <p>Le fichier est analysé sans publication, puis sauvegardé comme brouillon modifiable.</p>
        </div>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}

      <section className="grid-two assessment-source-grid">
        <form className="panel" onSubmit={handleImport}>
          <label className="upload-zone">
            <FontAwesomeIcon icon={faUpload} />
            <strong>{file ? file.name : 'Choisir un fichier CSV, JSON, Word ou PDF'}</strong>
            <small>Formats supportés : CSV, JSON, DOCX, DOC, PDF — 10 Mo maximum</small>
            <input type="file" accept=".csv,.json,.doc,.docx,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button className="primary-btn assessment-import-submit" disabled={!file || status === 'saving'}>
            <FontAwesomeIcon icon={faFileImport} /> {status === 'saving' ? 'Analyse et sauvegarde…' : 'Analyser et ouvrir le builder'}
          </button>
        </form>

        <aside className="panel docs-panel">
          <h2><FontAwesomeIcon icon={faFileCsv} /> Modèle CSV</h2>
          <pre>{`question,choice,is_correct,points
"Capitale du Sénégal ?","Dakar",1,1
"Capitale du Sénégal ?","Paris",0,1`}</pre>
          <h2><FontAwesomeIcon icon={faFileLines} /> Word et PDF</h2>
          <pre>{`1. Votre question ?
[x] Bonne réponse
[ ] Mauvaise réponse

2. Autre question ?
A) Première option
B) Deuxième option
Réponse : B`}</pre>
          <div className="hint"><FontAwesomeIcon icon={faDownload} /> Les réponses détectées restent toujours à vérifier dans le builder avant publication.</div>
        </aside>
      </section>
    </div>
  );
}
