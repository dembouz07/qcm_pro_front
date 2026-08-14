import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEye, faRotateRight, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { getApiError } from '../api.js';
import AssessmentBuilderPage from '../features/assessmentBuilder/AssessmentBuilderPage.jsx';
import {
  createAssessmentDraft,
  getAssessmentDraft,
} from '../features/assessmentBuilder/assessmentBuilderApi.js';
import {
  normalizeDraftDocument,
  normalizeParsedQuestions,
} from '../features/assessmentBuilder/assessmentBuilderModel.js';
import ParticipantQuizState from '../features/participantQuiz/ParticipantQuizState.jsx';
import { parseQuiz } from '../quizParser.js';

const SAMPLE = `1. Quelle est la capitale du Sénégal ?
A) Dakar
B) Thiès
C) Saint-Louis
Réponse : A

2. Quels sont des langages web ?
- HTML *
- Python
- CSS *

3. AWS est un fournisseur cloud ?
[x] Vrai
[ ] Faux`;

export default function SmartCreateQuiz() {
  const [searchParams, setSearchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const [text, setText] = useState('');
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
        if (draft.mode !== 'standard') throw new Error('Ce brouillon n’est pas un QCM standard.');
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

  async function analyze() {
    setError('');
    const parsed = parseQuiz(text);
    if (!parsed.questions.length) {
      setError('Aucune question détectée. Vérifiez le texte collé et ses choix de réponses.');
      return;
    }

    const document = normalizeParsedQuestions(parsed.questions, 'paste');
    setStatus('saving');
    try {
      const draft = await createAssessmentDraft(document, null);
      setSeed({ draft, document });
      setSearchParams({ draft: String(draft.id) }, { replace: true });
      setStatus('ready');
    } catch (saveError) {
      setError(getApiError(saveError));
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return <div className="page narrow"><ParticipantQuizState type="loading" message="Reprise du brouillon collé…" /></div>;
  }

  if (seed) {
    return (
      <AssessmentBuilderPage
        type="standard"
        mode="create"
        source="paste"
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
          <span className="eyebrow"><FontAwesomeIcon icon={faWandMagicSparkles} /> Création assistée</span>
          <h1>Coller un QCM</h1>
          <p>Le texte est analysé, sauvegardé en brouillon, puis ouvert dans le même builder que la création manuelle.</p>
        </div>
      </div>

      {error && (
        <div className="alert error" role="alert">
          <span>{error}</span>
          {status === 'error' && draftId && <button type="button" className="secondary-btn" onClick={() => window.location.reload()}><FontAwesomeIcon icon={faRotateRight} /> Réessayer</button>}
        </div>
      )}

      <div className="grid-two assessment-source-grid">
        <section className="panel">
          <label>
            Collez votre QCM ici
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows="18"
              placeholder={"1. Question ?\nA) Réponse\nB) Réponse\nRéponse : B"}
              className="assessment-paste-input"
            />
          </label>
          <div className="assessment-source-actions">
            <button className="primary-btn" type="button" onClick={analyze} disabled={!text.trim() || status === 'saving'}>
              <FontAwesomeIcon icon={faWandMagicSparkles} /> {status === 'saving' ? 'Création du brouillon…' : 'Analyser et ouvrir le builder'}
            </button>
            <button className="secondary-btn" type="button" onClick={() => setText(SAMPLE)}>
              <FontAwesomeIcon icon={faEye} /> Utiliser un exemple
            </button>
          </div>
        </section>

        <aside className="panel docs-panel">
          <h2>Formats reconnus</h2>
          <pre>{`1. Question ?
A) Choix
B) Choix
Réponse : B

2. Plusieurs réponses ?
[x] Première
[ ] Deuxième
[x] Troisième`}</pre>
          <p className="muted">Marqueurs acceptés : *, ✓, [x], « bonne réponse » ou une ligne « Réponse : B ».</p>
        </aside>
      </div>
    </div>
  );
}
