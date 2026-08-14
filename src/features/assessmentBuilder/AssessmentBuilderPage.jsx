import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import ParticipantQuizState from '../participantQuiz/ParticipantQuizState.jsx';
import AssessmentBuilder from './AssessmentBuilder.jsx';
import {
  findAssessmentDraft,
  publishAssessmentDraft,
  readDraftConflict,
} from './assessmentBuilderApi.js';
import {
  createBuilderDocument,
  normalizeDraftDocument,
  normalizeProgressiveQuiz,
  normalizeStandardQuiz,
  validateBuilderDocument,
} from './assessmentBuilderModel.js';
import useAssessmentBuilder from './useAssessmentBuilder.js';

const PUBLISH_CONFLICT_CODES = new Set([
  'quiz_changed_since_draft',
  'quiz_has_active_attempts',
  'quiz_has_submissions',
]);

function readPublishConflict(error) {
  const data = error?.response?.data;
  if (error?.response?.status !== 409 || !PUBLISH_CONFLICT_CODES.has(data?.code)) return null;
  return {
    code: data.code,
    message: data.message || 'Cette évaluation ne peut plus être remplacée par ce brouillon.',
    canDuplicate: data.can_duplicate !== false,
  };
}

function PublishedState({ result, onBack }) {
  const quiz = result.quiz || {};
  const statusRef = useRef(null);
  useEffect(() => {
    statusRef.current?.focus();
  }, []);
  return (
    <div className="page narrow assessment-builder-success">
      <section ref={statusRef} className="panel center" role="status" tabIndex="-1">
        <div className="big-icon"><FontAwesomeIcon icon={faCircleCheck} /></div>
        <span className="eyebrow">Publication réussie</span>
        <h1>{quiz.title || 'Évaluation publiée'}</h1>
        <p>{result.already_published ? 'Cette version était déjà publiée : aucune duplication n’a été créée.' : 'Le brouillon a été validé et publié sans perte de données.'}</p>
        <div className="builder-success-actions">
          {quiz.id && <Link className="primary-btn" to={`/admin/quizzes/${quiz.id}`}>Voir l’évaluation</Link>}
          <button type="button" className="secondary-btn" onClick={onBack}>Revenir au builder</button>
          <Link className="text-btn" to="/admin/quizzes">Toutes les évaluations</Link>
        </div>
      </section>
    </div>
  );
}

function ReadyBuilder({ initialDocument, initialDraft, classes, quizId, sourceQuizVersion, loadWarning, onReloadSource }) {
  const builder = useAssessmentBuilder({ initialDocument, initialDraft, quizId, sourceQuizVersion });
  const [validationErrors, setValidationErrors] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [apiError, setApiError] = useState(loadWarning || '');
  const [successMessage, setSuccessMessage] = useState(initialDraft ? 'Brouillon repris automatiquement.' : '');
  const [publishConflict, setPublishConflict] = useState(null);
  const [publishedResult, setPublishedResult] = useState(null);

  async function publishDraft(draft) {
    const result = await publishAssessmentDraft(draft);
    builder.acceptServerDraft(result.draft);
    builder.allowNavigation();
    setSuccessMessage(result.message || 'Évaluation publiée.');
    setPublishedResult(result);
    return result;
  }

  async function handlePublish() {
    setApiError('');
    setSuccessMessage('');
    setPublishConflict(null);
    const validation = validateBuilderDocument(builder.document);
    setValidationErrors([...validation.errors]);
    if (!validation.valid) return;

    setPublishing(true);
    try {
      const savedDraft = await builder.saveDraft();
      await publishDraft(savedDraft);
    } catch (error) {
      const conflict = readPublishConflict(error);
      if (conflict) setPublishConflict(conflict);
      else if (!readDraftConflict(error)) setApiError(getApiError(error));
    } finally {
      setPublishing(false);
    }
  }

  async function publishAsNewVersion() {
    setPublishing(true);
    setApiError('');
    try {
      const duplicate = await builder.duplicateDraft();
      if (duplicate) await publishDraft(duplicate);
      setPublishConflict(null);
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setPublishing(false);
    }
  }

  if (publishedResult) {
    return <PublishedState result={publishedResult} onBack={() => setPublishedResult(null)} />;
  }

  return (
    <div className="page assessment-builder-page">
      <Link to="/admin/quizzes/create" className="back-link"><FontAwesomeIcon icon={faArrowLeft} /> Retour aux modes de création</Link>
      {publishConflict && (
        <div className="alert warning assessment-builder-banner" role="alert">
          <div><strong>La version d’origine ne peut pas être remplacée.</strong><br />{publishConflict.message}</div>
          {publishConflict.canDuplicate && (
            <button type="button" className="secondary-btn" onClick={publishAsNewVersion} disabled={publishing}>
              Dupliquer en nouvelle version
            </button>
          )}
        </div>
      )}
      {initialDocument.type === 'standard' && classes.length === 0 && (
        <div className="empty assessment-builder-empty-classes" role="status">
          <div>
            <strong>Aucune classe ou cohorte disponible.</strong>
            <span>Créez-en une avant de pouvoir publier cette évaluation.</span>
          </div>
          <Link className="secondary-btn" to="/admin/classes">Gérer les classes</Link>
        </div>
      )}
      <AssessmentBuilder
        document={builder.document}
        onDocumentChange={builder.setDocument}
        classes={classes}
        saveStatus={builder.saveStatus}
        saveError={builder.saveError}
        lastSavedAt={builder.lastSavedAt}
        conflict={builder.conflict}
        onSaveDraft={() => builder.saveDraft().catch(() => {})}
        onUseRemoteDraft={builder.useRemoteDraft}
        onReloadSource={onReloadSource}
        onDuplicateDraft={() => builder.duplicateDraft().catch(() => {})}
        onPublish={handlePublish}
        publishing={publishing}
        validationErrors={validationErrors}
        apiError={apiError}
        successMessage={successMessage}
        blocker={builder.blocker}
      />
    </div>
  );
}

export default function AssessmentBuilderPage({
  type = 'standard',
  mode = 'create',
  source = 'manual',
  initialDocument: providedDocument = null,
  initialDraft: providedDraft = null,
}) {
  const { id } = useParams();
  const quizId = mode === 'edit' ? id : null;
  const [loadState, setLoadState] = useState({ status: 'loading' });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoadState({ status: 'loading' });
      try {
        const classesRequest = type === 'standard' ? api.get('/admin/classes') : Promise.resolve({ data: [] });
        const quizRequest = mode === 'edit' ? api.get(`/admin/quizzes/${id}`) : Promise.resolve({ data: null });
        const [classesResponse, quizResponse] = await Promise.all([classesRequest, quizRequest]);
        if (!active) return;

        const quiz = quizResponse.data;
        if (mode === 'edit' && !quiz) {
          setLoadState({ status: 'empty', message: 'Cette évaluation est introuvable.' });
          return;
        }
        if (quiz && quiz.type && quiz.type !== type) {
          setLoadState({ status: 'error', message: `Cette route ne peut pas modifier une évaluation ${quiz.type}.` });
          return;
        }

        let draft = providedDraft;
        let loadWarning = '';
        if (!providedDocument && !providedDraft) {
          try {
            draft = await findAssessmentDraft({ mode: type, quizId });
          } catch (error) {
            loadWarning = `Les brouillons n’ont pas pu être vérifiés. ${getApiError(error)}`;
          }
        }
        if (!active) return;

        let document;
        if (providedDocument) {
          document = { ...providedDocument, source };
        } else if (draft) {
          document = normalizeDraftDocument(draft);
          document.source = mode === 'edit' ? 'edit' : 'draft';
        } else if (quiz) {
          document = type === 'progressive'
            ? normalizeProgressiveQuiz(quiz, 'edit')
            : normalizeStandardQuiz(quiz, 'edit');
        } else {
          document = createBuilderDocument({ type, source });
        }

        setLoadState({
          status: 'ready',
          document,
          draft,
          classes: classesResponse.data || [],
          loadWarning,
          sourceQuizVersion: quiz?.builder_version || null,
        });
      } catch (error) {
        if (active) setLoadState({ status: 'error', message: getApiError(error) });
      }
    }

    void load();
    return () => { active = false; };
  }, [id, mode, providedDocument, providedDraft, retryKey, source, type, quizId]);

  if (loadState.status === 'loading') {
    return <div className="page narrow"><ParticipantQuizState type="loading" message="Chargement du builder…" /></div>;
  }
  if (loadState.status === 'empty') {
    return <div className="page narrow"><ParticipantQuizState type="empty" message={loadState.message} /></div>;
  }
  if (loadState.status === 'error') {
    return (
      <div className="page narrow">
        <ParticipantQuizState
          type="error"
          message={loadState.message}
          onRetry={() => setRetryKey((key) => key + 1)}
        />
      </div>
    );
  }

  return (
    <ReadyBuilder
      key={`${type}-${mode}-${id || 'new'}-${loadState.draft?.id || 'fresh'}-${retryKey}`}
      initialDocument={loadState.document}
      initialDraft={loadState.draft}
      classes={loadState.classes}
      quizId={quizId}
      sourceQuizVersion={loadState.sourceQuizVersion}
      loadWarning={loadState.loadWarning}
      onReloadSource={() => setRetryKey((key) => key + 1)}
    />
  );
}
