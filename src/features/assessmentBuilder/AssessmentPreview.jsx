import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faMobileScreen, faTabletScreenButton, faXmark } from '@fortawesome/free-solid-svg-icons';
import ParticipantQuizFlow from '../participantQuiz/ParticipantQuizFlow.jsx';
import ParticipantQuizState from '../participantQuiz/ParticipantQuizState.jsx';
import { canAdvanceProgressiveStage } from '../../quizFormValidation.js';
import { toParticipantQuestions } from './assessmentBuilderModel.js';

const VIEWPORTS = [
  { width: 360, label: 'Téléphone 360 px', icon: faMobileScreen },
  { width: 768, label: 'Tablette 768 px', icon: faTabletScreenButton },
  { width: 1440, label: 'Ordinateur 1440 px', icon: faDesktop },
];

export default function AssessmentPreview({ document, open, onClose }) {
  const [viewport, setViewport] = useState(360);
  const [stageIndex, setStageIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [stageScores, setStageScores] = useState({});
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const resultRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const questions = useMemo(
    () => toParticipantQuestions(document, stageIndex),
    [document, stageIndex],
  );

  useEffect(() => {
    if (!open) return undefined;
    setAnswers({});
    setCompleted(false);
    setResultMessage('');
    setStageScores({});
    setStageIndex(0);
    closeRef.current?.focus();
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  useEffect(() => {
    setCompleted(false);
    setResultMessage('');
  }, [stageIndex]);

  useEffect(() => {
    if (completed) resultRef.current?.focus();
  }, [completed]);

  function handleDialogKeyDown(event) {
    if (event.key !== 'Tab') return;
    const focusable = [...(dialogRef.current?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ) || [])];
    if (!focusable.length) return;
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

  function finishPreviewStage() {
    if (document.type !== 'progressive') {
      setCompleted(true);
      setResultMessage('Aperçu terminé. Aucune réponse n’a été enregistrée.');
      return;
    }

    const score = questions.reduce((total, question) => (
      total + (answers[question.id] === `${question.id}-yes` ? 1 : 0)
    ), 0);
    const nextScores = { ...stageScores, [stageIndex + 1]: score };
    setStageScores(nextScores);
    const isLastStage = stageIndex >= document.stages.length - 1;
    const canAdvance = canAdvanceProgressiveStage(
      score,
      document.stage_threshold,
      document.require_stage_pass !== false,
    );

    if (canAdvance && !isLastStage) {
      setStageIndex((current) => current + 1);
      return;
    }

    setCompleted(true);
    setResultMessage(isLastStage
      ? `Diagnostic terminé au stade ${stageIndex + 1}.`
      : `Seuil atteint : le parcours s’arrête au stade ${stageIndex + 1}.`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="assessment-preview-backdrop"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
            ref={dialogRef}
            className="assessment-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-preview-title"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
            onKeyDown={handleDialogKeyDown}
          >
            <header className="assessment-preview-header">
              <div>
                <span className="eyebrow">Aperçu réel participant</span>
                <h2 id="assessment-preview-title">{document.title || 'Évaluation sans titre'}</h2>
              </div>
              <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Fermer l’aperçu">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>

            <div className="assessment-preview-toolbar" aria-label="Largeur de l’aperçu">
              {VIEWPORTS.map((item) => (
                <button
                  key={item.width}
                  type="button"
                  className={viewport === item.width ? 'active' : ''}
                  aria-pressed={viewport === item.width}
                  onClick={() => setViewport(item.width)}
                >
                  <FontAwesomeIcon icon={item.icon} /> {item.label}
                </button>
              ))}
            </div>

            {document.type === 'progressive' && (
              <div className="assessment-preview-stage" role="status">
                <strong>{document.stages[stageIndex]?.name || `Stade ${stageIndex + 1}`}</strong>
                <span>Stade {stageIndex + 1} sur {document.stages.length} · seuil {document.stage_threshold} « Oui »</span>
              </div>
            )}

            <div className="assessment-preview-canvas">
              <div
                className="assessment-preview-frame"
                data-preview-width={viewport}
                style={{ width: `${viewport}px` }}
              >
                {questions.length ? (
                  <>
                    {completed && <div ref={resultRef} className="alert success" role="status" tabIndex="-1">{resultMessage}</div>}
                    {!completed && (
                      <ParticipantQuizFlow
                        key={`${document.type}-${stageIndex}-${questions.map((question) => question.id).join('-')}`}
                        questions={questions}
                        answers={answers}
                        onAnswersChange={setAnswers}
                        onSubmit={finishPreviewStage}
                        reviewLabel={document.type === 'progressive' ? 'Relire ce stade' : 'Relire mes réponses'}
                        submitLabel={document.type === 'progressive'
                          ? (stageIndex === document.stages.length - 1 ? 'Terminer le diagnostic' : 'Vérifier ce stade')
                          : 'Terminer l’aperçu'}
                        reducedMotionOverride={reducedMotion}
                      />
                    )}
                  </>
                ) : (
                  <ParticipantQuizState type="empty" message="Ajoutez une question pour afficher l’aperçu." />
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
