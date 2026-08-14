import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faCheck, faClock, faPaperPlane, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { answerLabels, countAnswered, firstUnansweredIndex, toggleAnswer } from './quizEngine.js';

export default function ParticipantQuizFlow({
  questions = [],
  answers = {},
  onAnswersChange,
  onSubmit,
  disabled = false,
  submitting = false,
  autoSubmitting = false,
  error = '',
  warning = '',
  autoSubmitError = '',
  onRetryAutoSubmit,
  timer,
  cancelAction,
  submitLabel = 'Envoyer mes réponses',
  reviewLabel = 'Relire mes réponses',
  reducedMotionOverride,
}) {
  const initialIndex = firstUnansweredIndex(questions, answers);
  const allAnsweredInitially = questions.length > 0 && countAnswered(questions, answers) === questions.length;
  const [view, setView] = useState(allAnsweredInitially ? 'review' : 'question');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(1);
  const headingRef = useRef(null);
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = reducedMotionOverride ?? systemReducedMotion;
  const headingId = useId();

  const answeredCount = useMemo(() => countAnswered(questions, answers), [questions, answers]);
  const currentQuestion = questions[currentIndex];
  const busy = submitting || autoSubmitting;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [currentIndex, view]);

  if (!currentQuestion) return null;

  function updateAnswer(choiceId) {
    if (disabled || busy) return;
    const nextAnswers = toggleAnswer(
      answers,
      currentQuestion.id,
      choiceId,
      Boolean(currentQuestion.multiple),
    );
    onAnswersChange(nextAnswers, currentQuestion);
  }

  function previousQuestion() {
    setDirection(-1);
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function nextQuestion() {
    if (currentIndex === questions.length - 1) {
      setView('review');
      return;
    }
    setDirection(1);
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
  }

  function editQuestion(index) {
    setDirection(index < currentIndex ? -1 : 1);
    setCurrentIndex(index);
    setView('question');
  }

  return (
    <section
      className="participant-quiz-flow"
      aria-busy={busy}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <div className="participant-quiz-statusbar">
        <div>
          <strong>{view === 'review' ? 'Revue finale' : `Question ${currentIndex + 1} sur ${questions.length}`}</strong>
          <span>{answeredCount} réponse{answeredCount > 1 ? 's' : ''} enregistrée{answeredCount > 1 ? 's' : ''}</span>
        </div>
        {timer}
      </div>

      <div
        className="participant-progress"
        role="progressbar"
        aria-label="Progression du QCM"
        aria-valuemin="1"
        aria-valuemax={questions.length}
        aria-valuenow={view === 'review' ? questions.length : currentIndex + 1}
        aria-valuetext={view === 'review' ? 'Revue finale' : `Question ${currentIndex + 1} sur ${questions.length}`}
      >
        <motion.span
          initial={false}
          animate={{ width: `${view === 'review' ? 100 : ((currentIndex + 1) / questions.length) * 100}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
        />
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {view === 'review' ? 'Revue finale des réponses' : `Question ${currentIndex + 1} sur ${questions.length}`}
      </p>

      {error && <div className="alert error" role="alert">{error}</div>}
      {warning && <div className="alert warning" role="status">{warning}</div>}
      {autoSubmitting && (
        <div className="alert warning" role="status">
          <FontAwesomeIcon icon={faClock} /> Soumission automatique en cours…
        </div>
      )}
      {autoSubmitError && (
        <div className="alert error participant-auto-submit-error" role="alert">
          <div><strong>La soumission automatique a échoué.</strong><br />{autoSubmitError}</div>
          {onRetryAutoSubmit && (
            <button className="secondary-btn" type="button" onClick={onRetryAutoSubmit} disabled={busy}>
              <FontAwesomeIcon icon={faRotateRight} /> Réessayer l’envoi automatique
            </button>
          )}
        </div>
      )}

      {view === 'question' ? (
        <motion.div
          key={currentQuestion.id}
          className="participant-question-step"
          initial={reducedMotion ? false : { opacity: 0, x: direction * 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
        >
          <h2 id={headingId} ref={headingRef} tabIndex="-1" className="participant-question-title">
            {currentQuestion.body}
          </h2>
          <fieldset className="participant-question-fieldset" aria-labelledby={headingId}>
            <legend className="sr-only">
              {currentQuestion.body}. {currentQuestion.multiple ? 'Plusieurs réponses possibles.' : 'Une seule réponse possible.'}
            </legend>
            {currentQuestion.multiple && <p className="participant-question-hint">Plusieurs réponses possibles</p>}
            <div className="participant-choice-list">
              {(currentQuestion.choices || []).map((choice, choiceIndex) => {
                const value = answers[currentQuestion.id];
                const selected = currentQuestion.multiple
                  ? Array.isArray(value) && value.includes(choice.id)
                  : value === choice.id;
                return (
                  <label className={`participant-choice ${selected ? 'selected' : ''}`} key={choice.id}>
                    <input
                      type={currentQuestion.multiple ? 'checkbox' : 'radio'}
                      name={`participant-question-${currentQuestion.id}`}
                      checked={selected}
                      onChange={() => updateAnswer(choice.id)}
                      disabled={disabled || busy}
                    />
                    <span className="participant-choice-key" aria-hidden="true">{String.fromCharCode(65 + choiceIndex)}</span>
                    <span>{choice.body}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="participant-navigation">
            <button className="secondary-btn" type="button" onClick={previousQuestion} disabled={currentIndex === 0 || busy}>
              <FontAwesomeIcon icon={faArrowLeft} /> Précédent
            </button>
            <button className="primary-btn" type="button" onClick={nextQuestion} disabled={disabled || busy}>
              {currentIndex === questions.length - 1 ? reviewLabel : 'Suivant'} <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="participant-review"
          initial={reducedMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
        >
          <div className="participant-review-heading">
            <div>
              <span className="eyebrow"><FontAwesomeIcon icon={faCheck} /> Avant l’envoi</span>
              <h2 ref={headingRef} tabIndex="-1">Vérifiez vos réponses</h2>
              <p>Vous pouvez encore modifier une réponse avant de confirmer.</p>
            </div>
            <strong>{answeredCount}/{questions.length}</strong>
          </div>
          <ol className="participant-review-list">
            {questions.map((question, index) => {
              const labels = answerLabels(question, answers[question.id]);
              return (
                <li key={question.id}>
                  <div>
                    <strong>Question {index + 1}</strong>
                    <span>{question.body}</span>
                    <small className={labels.length ? '' : 'is-missing'}>
                      {labels.length ? labels.join(', ') : 'Sans réponse'}
                    </small>
                  </div>
                  <button className="text-btn" type="button" onClick={() => editQuestion(index)}>Modifier</button>
                </li>
              );
            })}
          </ol>
          <div className="participant-navigation participant-review-actions">
            {cancelAction}
            <button
              className="primary-btn"
              type="button"
              onClick={onSubmit}
              disabled={answeredCount !== questions.length || disabled || busy}
            >
              <FontAwesomeIcon icon={faPaperPlane} /> {submitting ? 'Envoi…' : submitLabel}
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}
