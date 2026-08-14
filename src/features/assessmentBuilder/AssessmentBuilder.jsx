import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faBars,
  faCircleCheck,
  faCircleQuestion,
  faCopy,
  faEye,
  faFloppyDisk,
  faLayerGroup,
  faPaperPlane,
  faPlus,
  faRotateRight,
  faTrash,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import AssessmentPreview from './AssessmentPreview.jsx';
import {
  cloneQuestion,
  createChoice,
  createStage,
  createStandardQuestion,
  moveItem,
} from './assessmentBuilderModel.js';

function StatusLine({ status, lastSavedAt }) {
  if (status === 'saving') return <span className="builder-save-status saving" role="status">Enregistrement du brouillon…</span>;
  if (status === 'saved') {
    const time = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
    return <span className="builder-save-status saved" role="status"><FontAwesomeIcon icon={faCircleCheck} /> Brouillon enregistré{time ? ` à ${time}` : ''}</span>;
  }
  if (status === 'error') return <span className="builder-save-status error" role="status">Brouillon non enregistré</span>;
  if (status === 'conflict') return <span className="builder-save-status error" role="status">Conflit de version</span>;
  return <span className="builder-save-status">Modifications locales</span>;
}

function FieldError({ error }) {
  return error ? <small className="builder-field-error" role="alert">{error.message}</small> : null;
}

function formatAvailabilityEnd(value) {
  if (!value) return 'Sans limite de temps';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'À la date de fermeture indiquée';
  return `Jusqu’au ${date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`;
}

function LeaveGuardDialog({ blocker }) {
  const dialogRef = useRef(null);
  const stayRef = useRef(null);
  const previousFocusRef = useRef(window.document.activeElement);

  useEffect(() => {
    const previousFocus = previousFocusRef.current;
    stayRef.current?.focus();
    return () => previousFocus?.focus?.();
  }, []);

  function trapFocus(event) {
    if (event.key === 'Escape') {
      blocker.reset();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled])')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && window.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && window.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="assessment-leave-backdrop">
      <section ref={dialogRef} className="assessment-leave-dialog" role="alertdialog" aria-modal="true" aria-labelledby="assessment-leave-title" onKeyDown={trapFocus}>
        <h2 id="assessment-leave-title">Quitter avec des changements non enregistrés ?</h2>
        <p>Attendez l’enregistrement du brouillon ou restez sur cette page pour éviter toute perte.</p>
        <div>
          <button ref={stayRef} type="button" className="secondary-btn" onClick={() => blocker.reset()}>Rester sur la page</button>
          <button type="button" className="danger-btn" onClick={() => blocker.proceed()}>Quitter sans attendre</button>
        </div>
      </section>
    </div>
  );
}

export default function AssessmentBuilder({
  document,
  onDocumentChange,
  classes = [],
  saveStatus,
  saveError,
  lastSavedAt,
  conflict,
  onSaveDraft,
  onUseRemoteDraft,
  onReloadSource,
  onDuplicateDraft,
  onPublish,
  publishing = false,
  validationErrors = [],
  apiError = '',
  successMessage = '',
  blocker,
}) {
  const firstStandardQuestion = document.questions[0]?.clientId || null;
  const firstStage = document.stages[0]?.clientId || null;
  const firstProgressiveQuestion = document.stages[0]?.questions[0]?.clientId || null;
  const [selectedQuestionId, setSelectedQuestionId] = useState(firstStandardQuestion || firstProgressiveQuestion);
  const [selectedStageId, setSelectedStageId] = useState(firstStage);
  const [planOpen, setPlanOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState('cadrage');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reorderAnnouncement, setReorderAnnouncement] = useState('');
  const previewReturnFocusRef = useRef(null);
  const errorsById = useMemo(
    () => new Map(validationErrors.map((validationError) => [validationError.id, validationError])),
    [validationErrors],
  );
  const standardTotalPoints = useMemo(
    () => document.questions.reduce((total, question) => total + (Number(question.points) || 0), 0),
    [document.questions],
  );

  const selectedStageIndex = Math.max(0, document.stages.findIndex((stage) => stage.clientId === selectedStageId));
  const selectedStage = document.stages[selectedStageIndex];
  const selectedQuestionIndex = document.type === 'standard'
    ? Math.max(0, document.questions.findIndex((question) => question.clientId === selectedQuestionId))
    : Math.max(0, (selectedStage?.questions || []).findIndex((question) => question.clientId === selectedQuestionId));
  const selectedQuestion = document.type === 'standard'
    ? document.questions[selectedQuestionIndex]
    : selectedStage?.questions[selectedQuestionIndex];

  useEffect(() => {
    if (!validationErrors.length) return;
    const firstError = validationErrors[0];
    setMobileSection(firstError.section === 'contenu' ? 'contenu' : 'cadrage');
    if (firstError.itemId) {
      const matchingStage = document.stages.find((stage) => stage.clientId === firstError.itemId);
      const stageWithQuestion = document.stages.find((stage) => stage.questions.some((question) => question.clientId === firstError.itemId));
      if (matchingStage) setSelectedStageId(matchingStage.clientId);
      if (stageWithQuestion) {
        setSelectedStageId(stageWithQuestion.clientId);
        setSelectedQuestionId(firstError.itemId);
      } else if (document.questions.some((question) => question.clientId === firstError.itemId)) {
        setSelectedQuestionId(firstError.itemId);
      }
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.document.getElementById(firstError.id)?.focus());
    });
  }, [validationErrors]); // eslint-disable-line react-hooks/exhaustive-deps -- le focus ne doit se rejouer qu’à une nouvelle tentative de validation.

  function updateDocument(patch) {
    onDocumentChange((current) => ({ ...current, ...patch }));
  }

  function updateStandardQuestion(questionIndex, patch) {
    onDocumentChange((current) => ({
      ...current,
      questions: current.questions.map((question, index) => (
        index === questionIndex ? { ...question, ...patch } : question
      )),
    }));
  }

  function updateChoice(questionIndex, choiceIndex, patch) {
    onDocumentChange((current) => ({
      ...current,
      questions: current.questions.map((question, index) => index === questionIndex ? {
        ...question,
        choices: question.choices.map((choice, currentChoiceIndex) => (
          currentChoiceIndex === choiceIndex ? { ...choice, ...patch } : choice
        )),
      } : question),
    }));
  }

  function setQuestionType(questionIndex, multiple) {
    onDocumentChange((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex) return question;
        const firstCorrect = question.choices.findIndex((choice) => choice.is_correct);
        return {
          ...question,
          multiple,
          choices: multiple ? question.choices : question.choices.map((choice, choiceIndex) => ({
            ...choice,
            is_correct: firstCorrect >= 0 && choiceIndex === firstCorrect,
          })),
        };
      }),
    }));
  }

  function markCorrect(questionIndex, choiceIndex) {
    const question = document.questions[questionIndex];
    onDocumentChange((current) => ({
      ...current,
      questions: current.questions.map((item, index) => index === questionIndex ? {
        ...item,
        choices: item.choices.map((choice, currentChoiceIndex) => ({
          ...choice,
          is_correct: question.multiple
            ? (currentChoiceIndex === choiceIndex ? !choice.is_correct : choice.is_correct)
            : currentChoiceIndex === choiceIndex,
        })),
      } : item),
    }));
  }

  function addStandardQuestion() {
    const question = createStandardQuestion();
    onDocumentChange((current) => ({ ...current, questions: [...current.questions, question] }));
    setSelectedQuestionId(question.clientId);
    setMobileSection('contenu');
  }

  function duplicateStandardQuestion(questionIndex) {
    const duplicate = cloneQuestion(document.questions[questionIndex]);
    onDocumentChange((current) => {
      const questions = [...current.questions];
      questions.splice(questionIndex + 1, 0, duplicate);
      return { ...current, questions };
    });
    setSelectedQuestionId(duplicate.clientId);
  }

  function removeStandardQuestion(questionIndex) {
    if (document.questions.length <= 1) return;
    const nextQuestions = document.questions.filter((_, index) => index !== questionIndex);
    onDocumentChange((current) => ({ ...current, questions: nextQuestions }));
    setSelectedQuestionId(nextQuestions[Math.min(questionIndex, nextQuestions.length - 1)]?.clientId || null);
  }

  function moveStandardQuestion(questionIndex, offset) {
    const nextIndex = questionIndex + offset;
    onDocumentChange((current) => ({ ...current, questions: moveItem(current.questions, questionIndex, nextIndex) }));
    setReorderAnnouncement(`Question déplacée en position ${nextIndex + 1} sur ${document.questions.length}.`);
  }

  function updateStage(stageIndex, updater) {
    onDocumentChange((current) => ({
      ...current,
      stages: current.stages.map((stage, index) => index === stageIndex
        ? (typeof updater === 'function' ? updater(stage) : { ...stage, ...updater })
        : stage),
    }));
  }

  function addStage() {
    const stage = createStage(document.stages.length);
    onDocumentChange((current) => ({ ...current, stages: [...current.stages, stage] }));
    setSelectedStageId(stage.clientId);
    setSelectedQuestionId(stage.questions[0].clientId);
    setMobileSection('contenu');
  }

  function removeStage(stageIndex) {
    if (document.stages.length <= 1) return;
    const nextStages = document.stages.filter((_, index) => index !== stageIndex);
    onDocumentChange((current) => ({ ...current, stages: nextStages }));
    const nextStage = nextStages[Math.min(stageIndex, nextStages.length - 1)];
    setSelectedStageId(nextStage.clientId);
    setSelectedQuestionId(nextStage.questions[0]?.clientId || null);
  }

  function addProgressiveQuestion(stageIndex) {
    const question = cloneQuestion({ body: '' }, 'progressive');
    updateStage(stageIndex, (stage) => ({ ...stage, questions: [...stage.questions, question] }));
    setSelectedQuestionId(question.clientId);
  }

  function duplicateProgressiveQuestion(stageIndex, questionIndex) {
    const duplicate = cloneQuestion(document.stages[stageIndex].questions[questionIndex], 'progressive');
    updateStage(stageIndex, (stage) => {
      const questions = [...stage.questions];
      questions.splice(questionIndex + 1, 0, duplicate);
      return { ...stage, questions };
    });
    setSelectedQuestionId(duplicate.clientId);
  }

  function removeProgressiveQuestion(stageIndex, questionIndex) {
    const questions = document.stages[stageIndex].questions;
    if (questions.length <= 1) return;
    const nextQuestions = questions.filter((_, index) => index !== questionIndex);
    updateStage(stageIndex, { questions: nextQuestions });
    setSelectedQuestionId(nextQuestions[Math.min(questionIndex, nextQuestions.length - 1)]?.clientId || null);
  }

  function moveProgressiveQuestion(stageIndex, questionIndex, offset) {
    const stage = document.stages[stageIndex];
    const nextIndex = questionIndex + offset;
    updateStage(stageIndex, { questions: moveItem(stage.questions, questionIndex, nextIndex) });
    setReorderAnnouncement(`Question du stade ${stageIndex + 1} déplacée en position ${nextIndex + 1} sur ${stage.questions.length}.`);
  }

  function focusValidationError(validationError) {
    setMobileSection(validationError.section === 'contenu' ? 'contenu' : 'cadrage');
    if (validationError.itemId) {
      const matchingStage = document.stages.find((stage) => stage.clientId === validationError.itemId);
      const stageWithQuestion = document.stages.find((stage) => stage.questions.some((question) => question.clientId === validationError.itemId));
      if (matchingStage) setSelectedStageId(matchingStage.clientId);
      if (stageWithQuestion) {
        setSelectedStageId(stageWithQuestion.clientId);
        setSelectedQuestionId(validationError.itemId);
      } else if (document.questions.some((question) => question.clientId === validationError.itemId)) {
        setSelectedQuestionId(validationError.itemId);
      }
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.document.getElementById(validationError.id)?.focus());
    });
  }

  function openPreview(event) {
    previewReturnFocusRef.current = event.currentTarget;
    setPreviewOpen(true);
  }

  function reloadSourceAfterConfirmation() {
    const confirmed = window.confirm('Recharger l’évaluation d’origine ? Les modifications locales non enregistrées seront abandonnées. Vous pouvez aussi les conserver en dupliquant cette version.');
    if (confirmed) onReloadSource?.();
  }

  const sectionClass = (section) => mobileSection === section ? 'is-mobile-active' : '';

  return (
    <div className="assessment-builder" data-builder-type={document.type}>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="builder-reorder-announcement">{reorderAnnouncement}</p>
      <header className="assessment-builder-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={document.type === 'progressive' ? faLayerGroup : faCircleQuestion} /> Builder d’évaluation</span>
          <h1>{document.source === 'edit' || document.source === 'draft' ? 'Modifier l’évaluation' : 'Créer une évaluation'}</h1>
          <StatusLine status={saveStatus} lastSavedAt={lastSavedAt} />
        </div>
        <div className="assessment-builder-header-actions">
          <button type="button" className="secondary-btn" onClick={() => void onSaveDraft()} disabled={saveStatus === 'saving' || publishing}>
            <FontAwesomeIcon icon={faFloppyDisk} /> Enregistrer le brouillon
          </button>
          <button type="button" className="primary-btn" onClick={onPublish} disabled={saveStatus === 'saving' || publishing}>
            <FontAwesomeIcon icon={faPaperPlane} /> {publishing ? 'Publication…' : 'Vérifier et publier'}
          </button>
        </div>
      </header>

      <nav className="assessment-builder-mobile-nav" aria-label="Étapes du builder">
        {[
          ['cadrage', '1. Cadrage'],
          ['contenu', '2. Contenu'],
          ['parametres', '3. Paramètres'],
          ['controle', '4. Aperçu'],
        ].map(([section, label]) => (
          <button key={section} type="button" className={mobileSection === section ? 'active' : ''} aria-current={mobileSection === section ? 'step' : undefined} onClick={() => setMobileSection(section)}>{label}</button>
        ))}
      </nav>

      {(apiError || successMessage) && (
        <div className={`alert ${apiError ? 'error' : 'success'} assessment-builder-banner`} role={apiError ? 'alert' : 'status'}>
          {apiError || successMessage}
        </div>
      )}

      {saveError && (
        <div className="alert error assessment-builder-banner" role="alert">
          <div><strong>Le brouillon n’a pas pu être enregistré.</strong><br />{saveError}</div>
          <button type="button" className="secondary-btn" onClick={() => void onSaveDraft()}><FontAwesomeIcon icon={faRotateRight} /> Réessayer</button>
        </div>
      )}

      {conflict && (
        <div className="alert warning assessment-builder-banner builder-conflict" role="alert">
          <div><strong>{conflict.kind === 'source' ? 'L’évaluation d’origine a changé.' : 'Une version plus récente existe.'}</strong><br />{conflict.message}</div>
          <div>
            <button type="button" className="secondary-btn" onClick={conflict.kind === 'source' ? reloadSourceAfterConfirmation : onUseRemoteDraft}>
              {conflict.kind === 'source' ? 'Recharger l’évaluation' : 'Charger la version distante'}
            </button>
            {conflict.canDuplicate && <button type="button" className="secondary-btn" onClick={onDuplicateDraft}><FontAwesomeIcon icon={faCopy} /> Dupliquer en nouvelle version</button>}
          </div>
        </div>
      )}

      <button type="button" className="assessment-plan-toggle secondary-btn" aria-expanded={planOpen} onClick={() => setPlanOpen((current) => !current)}>
        <FontAwesomeIcon icon={faBars} /> {planOpen ? 'Masquer le plan' : 'Afficher le plan'}
      </button>

      <div
        className="assessment-builder-layout"
        inert={publishing ? '' : undefined}
        aria-busy={publishing || undefined}
      >
        <aside className={`assessment-builder-plan ${planOpen ? 'is-open' : ''}`} aria-label="Plan des questions">
          <div className="assessment-pane-heading">
            <div>
              <span>Plan</span>
              <strong>{document.type === 'standard' ? `${document.questions.length} question(s)` : `${document.stages.length} stade(s)`}</strong>
            </div>
          </div>
          {document.type === 'standard' ? (
            <ol className="assessment-question-plan">
              {document.questions.map((question, index) => (
                <li key={question.clientId} className={selectedQuestionId === question.clientId ? 'selected' : ''}>
                  <button type="button" className="assessment-plan-select" onClick={() => { setSelectedQuestionId(question.clientId); setMobileSection('contenu'); setPlanOpen(false); }}>
                    <span>Q{index + 1}</span>
                    <strong>{question.body || 'Question sans énoncé'}</strong>
                  </button>
                  <div className="assessment-plan-order">
                    <button type="button" onClick={() => moveStandardQuestion(index, -1)} disabled={index === 0} aria-label={`Monter la question ${index + 1}`} title="Monter"><FontAwesomeIcon icon={faArrowUp} /></button>
                    <button type="button" onClick={() => moveStandardQuestion(index, 1)} disabled={index === document.questions.length - 1} aria-label={`Descendre la question ${index + 1}`} title="Descendre"><FontAwesomeIcon icon={faArrowDown} /></button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="assessment-stage-plan">
              {document.stages.map((stage, stageIndex) => (
                <li key={stage.clientId}>
                  <button type="button" className={selectedStageId === stage.clientId ? 'assessment-stage-select selected' : 'assessment-stage-select'} onClick={() => { setSelectedStageId(stage.clientId); setSelectedQuestionId(stage.questions[0]?.clientId); }}>
                    <span>Stade {stageIndex + 1}</span><strong>{stage.name || 'Sans nom'}</strong>
                  </button>
                  <ol>
                    {stage.questions.map((question, questionIndex) => (
                      <li key={question.clientId} className={selectedQuestionId === question.clientId ? 'selected' : ''}>
                        <button type="button" className="assessment-plan-select" onClick={() => { setSelectedStageId(stage.clientId); setSelectedQuestionId(question.clientId); setMobileSection('contenu'); setPlanOpen(false); }}>
                          <span>Q{questionIndex + 1}</span><strong>{question.body || 'Question sans énoncé'}</strong>
                        </button>
                        <div className="assessment-plan-order">
                          <button type="button" onClick={() => moveProgressiveQuestion(stageIndex, questionIndex, -1)} disabled={questionIndex === 0} aria-label={`Monter la question ${questionIndex + 1} du stade ${stageIndex + 1}`}><FontAwesomeIcon icon={faArrowUp} /></button>
                          <button type="button" onClick={() => moveProgressiveQuestion(stageIndex, questionIndex, 1)} disabled={questionIndex === stage.questions.length - 1} aria-label={`Descendre la question ${questionIndex + 1} du stade ${stageIndex + 1}`}><FontAwesomeIcon icon={faArrowDown} /></button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </aside>

        <section className="assessment-builder-canvas" aria-label="Canevas de l’évaluation">
          <section className={`assessment-builder-section ${sectionClass('cadrage')}`} data-builder-section="cadrage">
            <div className="assessment-section-heading">
              <div><span>Étape 1</span><h2>Cadrage</h2></div>
              <p>Les informations présentées aux participants.</p>
            </div>
            <div className="form-grid">
              <label className="span-2">
                Titre de l’évaluation *
                <input id="builder-title" value={document.title} onChange={(event) => updateDocument({ title: event.target.value })} aria-invalid={errorsById.has('builder-title')} aria-describedby={errorsById.has('builder-title') ? 'builder-title-error' : undefined} />
                <span id="builder-title-error"><FieldError error={errorsById.get('builder-title')} /></span>
              </label>
              {document.type === 'standard' ? (
                <>
                  <label>
                    Classe ou cohorte *
                    <select id="builder-class" value={document.school_class_id} onChange={(event) => updateDocument({ school_class_id: event.target.value })} aria-invalid={errorsById.has('builder-class')}>
                      <option value="">Choisir une classe</option>
                      {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}{schoolClass.academic_year ? ` · ${schoolClass.academic_year}` : ''}</option>)}
                    </select>
                    <FieldError error={errorsById.get('builder-class')} />
                  </label>
                  <label>
                    Mode
                    <input value="Standard" readOnly aria-readonly="true" />
                  </label>
                  <label>
                    Ouverture *
                    <input id="builder-starts-at" type="datetime-local" value={document.starts_at} onChange={(event) => updateDocument({ starts_at: event.target.value })} aria-invalid={errorsById.has('builder-starts-at')} />
                    <FieldError error={errorsById.get('builder-starts-at')} />
                  </label>
                  <label>
                    Fermeture facultative
                    <input id="builder-ends-at" type="datetime-local" min={document.starts_at || undefined} value={document.ends_at} onChange={(event) => updateDocument({ ends_at: event.target.value })} aria-invalid={errorsById.has('builder-ends-at')} />
                    <FieldError error={errorsById.get('builder-ends-at')} />
                  </label>
                </>
              ) : (
                <div className="span-2 alert info">Mode progressif public : les dates et la classe ne sont pas prises en charge par le contrat actuel.</div>
              )}
              <label className="span-2">
                Description
                <textarea rows="3" value={document.description} onChange={(event) => updateDocument({ description: event.target.value })} />
              </label>
            </div>
          </section>

          <section className={`assessment-builder-section ${sectionClass('contenu')}`} data-builder-section="contenu">
            <div className="assessment-section-heading">
              <div><span>Étape 2</span><h2>Contenu</h2></div>
              <p>Structurez les questions et leurs réponses.</p>
            </div>

            {document.type === 'standard' ? (
              <label className="assessment-mobile-question-select">
                Question affichée
                <select value={selectedQuestionId || ''} onChange={(event) => setSelectedQuestionId(event.target.value)}>
                  {document.questions.map((question, index) => (
                    <option key={question.clientId} value={question.clientId}>Question {index + 1} — {question.body || 'Sans énoncé'}</option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="assessment-mobile-question-select assessment-mobile-progressive-select">
                <label>
                  Stade affiché
                  <select value={selectedStageId || ''} onChange={(event) => {
                    const stage = document.stages.find((item) => item.clientId === event.target.value);
                    setSelectedStageId(event.target.value);
                    setSelectedQuestionId(stage?.questions[0]?.clientId || null);
                  }}>
                    {document.stages.map((stage, index) => <option key={stage.clientId} value={stage.clientId}>Stade {index + 1} — {stage.name || 'Sans nom'}</option>)}
                  </select>
                </label>
                <label>
                  Question affichée
                  <select value={selectedQuestionId || ''} onChange={(event) => setSelectedQuestionId(event.target.value)}>
                    {(selectedStage?.questions || []).map((question, index) => <option key={question.clientId} value={question.clientId}>Question {index + 1} — {question.body || 'Sans énoncé'}</option>)}
                  </select>
                </label>
              </div>
            )}

            {document.type === 'standard' && selectedQuestion ? (
              <article className="assessment-question-editor" aria-labelledby="selected-question-heading">
                <div className="assessment-editor-heading">
                  <div><span>Question {selectedQuestionIndex + 1} sur {document.questions.length}</span><h3 id="selected-question-heading">Modifier la question</h3></div>
                  <div className="assessment-editor-commands">
                    <button type="button" className="text-btn" onClick={() => moveStandardQuestion(selectedQuestionIndex, -1)} disabled={selectedQuestionIndex === 0}><FontAwesomeIcon icon={faArrowUp} /> Monter</button>
                    <button type="button" className="text-btn" onClick={() => moveStandardQuestion(selectedQuestionIndex, 1)} disabled={selectedQuestionIndex === document.questions.length - 1}><FontAwesomeIcon icon={faArrowDown} /> Descendre</button>
                    <button type="button" className="text-btn" onClick={() => duplicateStandardQuestion(selectedQuestionIndex)}><FontAwesomeIcon icon={faCopy} /> Dupliquer</button>
                    <button type="button" className="text-btn danger" onClick={() => removeStandardQuestion(selectedQuestionIndex)} disabled={document.questions.length <= 1}><FontAwesomeIcon icon={faTrash} /> Supprimer</button>
                  </div>
                </div>
                <label>
                  Énoncé *
                  <textarea id={`question-${selectedQuestion.clientId}-body`} rows="3" value={selectedQuestion.body} onChange={(event) => updateStandardQuestion(selectedQuestionIndex, { body: event.target.value })} aria-invalid={errorsById.has(`question-${selectedQuestion.clientId}-body`)} />
                  <FieldError error={errorsById.get(`question-${selectedQuestion.clientId}-body`)} />
                </label>
                <div className="form-grid assessment-question-options">
                  <label>
                    Type de question
                    <select value={selectedQuestion.multiple ? 'multiple' : 'single'} onChange={(event) => setQuestionType(selectedQuestionIndex, event.target.value === 'multiple')}>
                      <option value="single">Réponse unique</option>
                      <option value="multiple">Réponses multiples</option>
                    </select>
                  </label>
                  <label>
                    Points
                    <input id={`question-${selectedQuestion.clientId}-points`} type="number" min="1" max="100" value={selectedQuestion.points} onChange={(event) => updateStandardQuestion(selectedQuestionIndex, { points: Number(event.target.value) })} aria-invalid={errorsById.has(`question-${selectedQuestion.clientId}-points`)} />
                    <FieldError error={errorsById.get(`question-${selectedQuestion.clientId}-points`)} />
                  </label>
                </div>
                <fieldset id={`question-${selectedQuestion.clientId}-correct`} className="assessment-answer-editor" aria-invalid={errorsById.has(`question-${selectedQuestion.clientId}-correct`)} tabIndex={errorsById.has(`question-${selectedQuestion.clientId}-correct`) ? '-1' : undefined}>
                  <legend>Réponses et corrigé *</legend>
                  <p className="muted">{selectedQuestion.multiple ? 'Cochez toutes les bonnes réponses.' : 'Sélectionnez la bonne réponse.'}</p>
                  {selectedQuestion.choices.map((choice, choiceIndex) => (
                    <div className={choice.is_correct ? 'assessment-answer-row correct' : 'assessment-answer-row'} key={choice.clientId}>
                      <input type={selectedQuestion.multiple ? 'checkbox' : 'radio'} name={`correct-${selectedQuestion.clientId}`} checked={choice.is_correct} onChange={() => markCorrect(selectedQuestionIndex, choiceIndex)} aria-label={`Bonne réponse ${choiceIndex + 1}`} />
                      <label htmlFor={`choice-${choice.clientId}-body`} className="sr-only">Réponse {choiceIndex + 1}</label>
                      <input id={`choice-${choice.clientId}-body`} value={choice.body} placeholder={`Réponse ${choiceIndex + 1}`} onChange={(event) => updateChoice(selectedQuestionIndex, choiceIndex, { body: event.target.value })} aria-invalid={errorsById.has(`choice-${choice.clientId}-body`)} />
                      <button type="button" className="icon-btn danger" onClick={() => updateStandardQuestion(selectedQuestionIndex, { choices: selectedQuestion.choices.filter((_, index) => index !== choiceIndex) })} disabled={selectedQuestion.choices.length <= 2} aria-label={`Supprimer la réponse ${choiceIndex + 1}`}><FontAwesomeIcon icon={faTrash} /></button>
                    </div>
                  ))}
                  <FieldError error={errorsById.get(`question-${selectedQuestion.clientId}-correct`) || errorsById.get(`question-${selectedQuestion.clientId}-choices`)} />
                  <button type="button" className="secondary-btn small" onClick={() => updateStandardQuestion(selectedQuestionIndex, { choices: [...selectedQuestion.choices, createChoice()] })}><FontAwesomeIcon icon={faPlus} /> Ajouter une réponse</button>
                </fieldset>
                <label>
                  Explication après correction
                  <textarea rows="2" value={selectedQuestion.explanation} onChange={(event) => updateStandardQuestion(selectedQuestionIndex, { explanation: event.target.value })} />
                </label>
              </article>
            ) : document.type === 'progressive' && selectedStage && selectedQuestion ? (
              <article className="assessment-question-editor" aria-labelledby="selected-question-heading">
                <div className="assessment-editor-heading">
                  <div><span>{selectedStage.name || `Stade ${selectedStageIndex + 1}`} · Question {selectedQuestionIndex + 1}</span><h3 id="selected-question-heading">Modifier la question progressive</h3></div>
                  <div className="assessment-editor-commands">
                    <button type="button" className="text-btn" onClick={() => moveProgressiveQuestion(selectedStageIndex, selectedQuestionIndex, -1)} disabled={selectedQuestionIndex === 0}><FontAwesomeIcon icon={faArrowUp} /> Monter</button>
                    <button type="button" className="text-btn" onClick={() => moveProgressiveQuestion(selectedStageIndex, selectedQuestionIndex, 1)} disabled={selectedQuestionIndex === selectedStage.questions.length - 1}><FontAwesomeIcon icon={faArrowDown} /> Descendre</button>
                    <button type="button" className="text-btn" onClick={() => duplicateProgressiveQuestion(selectedStageIndex, selectedQuestionIndex)}><FontAwesomeIcon icon={faCopy} /> Dupliquer</button>
                    <button type="button" className="text-btn danger" onClick={() => removeProgressiveQuestion(selectedStageIndex, selectedQuestionIndex)} disabled={selectedStage.questions.length <= 1}><FontAwesomeIcon icon={faTrash} /> Supprimer</button>
                  </div>
                </div>
                <label>
                  Nom du stade *
                  <input id={`stage-${selectedStage.clientId}-name`} value={selectedStage.name} onChange={(event) => updateStage(selectedStageIndex, { name: event.target.value })} aria-invalid={errorsById.has(`stage-${selectedStage.clientId}-name`)} />
                  <FieldError error={errorsById.get(`stage-${selectedStage.clientId}-name`)} />
                </label>
                <label>
                  Énoncé Oui / Non *
                  <textarea id={`question-${selectedQuestion.clientId}-body`} rows="3" value={selectedQuestion.body} onChange={(event) => updateStage(selectedStageIndex, (stage) => ({ ...stage, questions: stage.questions.map((question, index) => index === selectedQuestionIndex ? { ...question, body: event.target.value } : question) }))} aria-invalid={errorsById.has(`question-${selectedQuestion.clientId}-body`)} />
                  <FieldError error={errorsById.get(`question-${selectedQuestion.clientId}-body`)} />
                </label>
                <div className="alert info">Le contrat progressif existant impose deux réponses : « Oui » vaut 1 point et « Non » vaut 0 point.</div>
              </article>
            ) : (
              <div className="empty builder-empty-state">Aucune question sélectionnée.</div>
            )}

            <div className="assessment-content-actions">
              {document.type === 'standard' ? (
                <button id="builder-add-question" type="button" className="secondary-btn" onClick={addStandardQuestion}><FontAwesomeIcon icon={faPlus} /> Ajouter une question</button>
              ) : (
                <>
                  <button type="button" className="secondary-btn" onClick={() => addProgressiveQuestion(selectedStageIndex)}><FontAwesomeIcon icon={faPlus} /> Ajouter une question au stade</button>
                  <button id="builder-add-stage" type="button" className="secondary-btn" onClick={addStage}><FontAwesomeIcon icon={faLayerGroup} /> Ajouter un stade</button>
                  <button type="button" className="text-btn danger" onClick={() => removeStage(selectedStageIndex)} disabled={document.stages.length <= 1}><FontAwesomeIcon icon={faTrash} /> Supprimer ce stade</button>
                </>
              )}
            </div>
          </section>

          <section className={`assessment-builder-section assessment-mobile-control ${sectionClass('controle')}`} data-builder-section="controle">
            <div className="assessment-section-heading"><div><span>Étape 4</span><h2>Contrôle et publication</h2></div></div>
            {validationErrors.length ? (
              <div className="builder-validation-summary" role="alert" tabIndex="-1">
                <h3><FontAwesomeIcon icon={faTriangleExclamation} /> {validationErrors.length} point(s) à corriger</h3>
                <ol>{validationErrors.map((validationError) => <li key={`${validationError.id}-${validationError.message}`}><button type="button" onClick={() => focusValidationError(validationError)}>{validationError.message}</button></li>)}</ol>
              </div>
            ) : <div className="alert success"><FontAwesomeIcon icon={faCircleCheck} /> Lancez la validation pour vérifier cette évaluation.</div>}
            <button type="button" className="secondary-btn" onClick={openPreview}><FontAwesomeIcon icon={faEye} /> Aperçu participant</button>
            <button type="button" className="primary-btn" onClick={onPublish} disabled={publishing}><FontAwesomeIcon icon={faPaperPlane} /> {publishing ? 'Publication…' : 'Vérifier et publier'}</button>
          </section>
        </section>

        <aside className={`assessment-builder-settings ${sectionClass('parametres')}`} data-builder-section="parametres" aria-label="Réglages contextuels">
          <div className="assessment-pane-heading"><div><span>Réglages</span><strong>Contexte</strong></div></div>
          {document.type === 'standard' ? (
            <>
              <dl className="assessment-settings-facts" aria-label="Règles appliquées à cette évaluation">
                <div><dt>Total</dt><dd>{standardTotalPoints} point{standardTotalPoints > 1 ? 's' : ''}</dd></div>
                <div><dt>Questions multiples</dt><dd>Notées sur l’ensemble exact des réponses</dd></div>
                <div><dt>Temps et auto-soumission</dt><dd>{formatAvailabilityEnd(document.ends_at)}</dd></div>
                <div><dt>Ordre des questions</dt><dd>Mélangé en session connectée, conservé en accès public</dd></div>
              </dl>
              <p className="assessment-settings-note">Ces règles existantes sont reprises à l’identique dans l’aperçu participant.</p>
              <label className="toggle-field">
                <input type="checkbox" checked={document.show_corrections} onChange={(event) => updateDocument({ show_corrections: event.target.checked })} />
                <span className="toggle-field-copy"><strong>Correction disponible</strong><small>Afficher réponses correctes et explications après soumission.</small></span>
              </label>
            </>
          ) : (
            <>
              <label>
                Seuil de « Oui » par stade
                <input id="builder-stage-threshold" type="number" min="1" max="20" value={document.stage_threshold} onChange={(event) => updateDocument({ stage_threshold: Number(event.target.value) })} aria-invalid={errorsById.has('builder-stage-threshold')} />
                <FieldError error={errorsById.get('builder-stage-threshold')} />
              </label>
              <label className="toggle-field">
                <input type="checkbox" checked={document.require_stage_pass} onChange={(event) => updateDocument({ require_stage_pass: event.target.checked })} />
                <span className="toggle-field-copy"><strong>Blocage par seuil</strong><small>Maintenir le participant au stade lorsque le seuil est atteint.</small></span>
              </label>
            </>
          )}

          <div className="assessment-settings-divider" />
          {validationErrors.length ? (
            <div className="builder-validation-summary" role="alert">
              <h3><FontAwesomeIcon icon={faTriangleExclamation} /> À corriger</h3>
              <ol>{validationErrors.slice(0, 5).map((validationError) => <li key={`${validationError.id}-${validationError.message}`}><button type="button" onClick={() => focusValidationError(validationError)}>{validationError.message}</button></li>)}</ol>
            </div>
          ) : <p className="muted">Les erreurs de validation apparaîtront ici avant publication.</p>}
          <button type="button" className="secondary-btn assessment-preview-trigger" onClick={openPreview}><FontAwesomeIcon icon={faEye} /> Aperçu participant</button>
        </aside>
      </div>

      <AssessmentPreview document={document} open={previewOpen} onClose={() => { setPreviewOpen(false); window.requestAnimationFrame(() => previewReturnFocusRef.current?.focus()); }} />

      {blocker?.state === 'blocked' && <LeaveGuardDialog blocker={blocker} />}
    </div>
  );
}
