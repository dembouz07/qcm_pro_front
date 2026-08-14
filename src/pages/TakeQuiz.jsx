import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion, faClock, faRotateLeft, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAntiCheat } from '../useAntiCheat.js';
import AntiCheatRules from '../components/AntiCheatRules.jsx';
import CorrectionView from '../components/CorrectionView.jsx';
import ParticipantQuizFlow from '../features/participantQuiz/ParticipantQuizFlow.jsx';
import ParticipantQuizResult from '../features/participantQuiz/ParticipantQuizResult.jsx';
import ParticipantQuizState from '../features/participantQuiz/ParticipantQuizState.jsx';
import { captureQuizOrder, restoreQuizOrder, sanitizeAnswers } from '../features/participantQuiz/quizEngine.js';

// Fisher-Yates : l’ordre d’affichage varie par tentative, sans modifier la correction par id.
function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}
function shuffleQuiz(quiz) {
  if (!quiz || !Array.isArray(quiz.questions)) return quiz;
  return {
    ...quiz,
    questions: shuffleArray(quiz.questions).map((question) => ({
      ...question,
      choices: Array.isArray(question.choices) ? shuffleArray(question.choices) : question.choices,
    })),
  };
}

export default function TakeQuiz() {
  const { id } = useParams();
  const storageKey = `qcm_progress_${id}`;
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [correction, setCorrection] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [autoSubmitError, setAutoSubmitError] = useState('');
  const [warning, setWarning] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [started, setStarted] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const answersRef = useRef({});
  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  useAntiCheat({
    active: Boolean(quiz) && started && !result,
    onWarn: (message) => setWarning(message),
    onTerminate: (reason) => {
      setTerminationReason(reason);
      submitAnswers({ auto: true });
    },
  });

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    setFetching(true);
    setError('');
    api.get(`/student/quizzes/${id}`)
      .then((response) => {
        let nextQuiz = shuffleQuiz(response.data);
        try {
          const raw = localStorage.getItem(storageKey);
          const stored = raw ? JSON.parse(raw) : null;
          nextQuiz = restoreQuizOrder(nextQuiz, stored?.order);
        } catch {
          // Un stockage ancien ou invalide ne doit pas empêcher le chargement.
        }
        setQuiz(nextQuiz);
      })
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setFetching(false));
  }, [id, loadAttempt, storageKey]);

  useEffect(() => {
    if (!quiz) return;
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved?.answers && Object.keys(saved.answers).length > 0) {
        const restoredAnswers = sanitizeAnswers(quiz.questions, saved.answers);
        setAnswers(restoredAnswers);
        setStarted(Object.keys(restoredAnswers).length > 0);
      }
    } catch {
      // La reprise reste optionnelle si le stockage n’est pas disponible.
    }
  }, [quiz, storageKey]);

  useEffect(() => {
    if (!quiz || result || Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        answers,
        order: captureQuizOrder(quiz),
      }));
    } catch {
      // Le QCM reste utilisable lorsque le stockage est plein ou désactivé.
    }
  }, [answers, quiz, result, storageKey]);

  useEffect(() => {
    if (!quiz || !quiz.ends_at || result) return undefined;

    function updateTimer() {
      const difference = new Date(quiz.ends_at).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft(0);
        if (!autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          submitAnswers({ auto: true });
        }
        return;
      }

      setTimeLeft({
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quiz, result]); // eslint-disable-line react-hooks/exhaustive-deps -- submitAnswers lit answersRef et la ref anti-double soumission.

  function buildPayload(auto = false) {
    const currentAnswers = auto ? answersRef.current : answers;
    return {
      auto_submit: auto,
      answers: Object.entries(currentAnswers).map(([questionId, value]) => (
        Array.isArray(value)
          ? { question_id: Number(questionId), choice_ids: value.map(Number) }
          : { question_id: Number(questionId), choice_id: Number(value) }
      )),
    };
  }

  async function submitAnswers({ auto = false } = {}) {
    if (submittingRef.current || result || !quiz) return;

    if (!auto) {
      const answeredCount = Object.values(answers)
        .filter((value) => (Array.isArray(value) ? value.length > 0 : value != null)).length;
      if (answeredCount !== quiz.questions.length) {
        setError(`Veuillez répondre à toutes les questions avant d’envoyer. (${answeredCount}/${quiz.questions.length} répondues)`);
        return;
      }
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');
    setAutoSubmitError('');
    if (auto) setAutoSubmitting(true);

    try {
      const response = await api.post(`/student/quizzes/${id}/submit`, buildPayload(auto));
      setResult(response.data.submission);
      if (response.data.show_corrections && response.data.correction) {
        setCorrection(response.data.correction);
      }
      try { localStorage.removeItem(storageKey); } catch { /* La suppression est non bloquante. */ }
    } catch (requestError) {
      const message = getApiError(requestError);
      if (auto) setAutoSubmitError(message);
      else setError(message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
      setAutoSubmitting(false);
    }
  }

  function updateAnswers(nextAnswers) {
    if (timeLeft === 0 || loading || autoSubmitting) return;
    setAnswers(nextAnswers);
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        answers: nextAnswers,
        order: captureQuizOrder(quiz),
      }));
    } catch {
      // La sauvegarde sera retentée par l’effet, sans bloquer la réponse.
    }
  }

  function formatTimeLeft() {
    if (!quiz?.ends_at) return <div className="timer"><FontAwesomeIcon icon={faClock} /> Pas d’heure de fermeture définie</div>;
    if (!timeLeft) return null;
    if (timeLeft === 0) return <div className="timer urgent"><FontAwesomeIcon icon={faClock} /> Temps écoulé</div>;

    const { hours, minutes, seconds, total } = timeLeft;
    const className = total < 5 * 60 * 1000 ? 'timer urgent' : 'timer';
    let text = '';
    if (hours > 0) text += `${hours}h `;
    if (minutes > 0 || hours > 0) text += `${minutes}m `;
    text += `${seconds}s`;
    return <div className={className}><FontAwesomeIcon icon={faClock} /> Temps restant : {text}</div>;
  }

  if (fetching) return <ParticipantQuizState type="loading" />;

  if (error && !quiz) {
    return (
      <div className="page narrow">
        <ParticipantQuizState
          type="error"
          message={error}
          onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
        />
        <div className="participant-state-back">
          <Link className="text-btn" to="/student"><FontAwesomeIcon icon={faRotateLeft} /> Retour</Link>
        </div>
      </div>
    );
  }

  if (!quiz) return <ParticipantQuizState type="loading" />;

  if (!quiz.questions?.length) {
    return (
      <div className="page narrow">
        <ParticipantQuizState type="empty" message="Cette évaluation ne contient pas encore de question." />
      </div>
    );
  }

  if (result) {
    return (
      <ParticipantQuizResult
        title={terminationReason ? 'Test terminé' : 'Réponses envoyées'}
        announcement="Vos réponses ont été envoyées et votre résultat est disponible."
        actions={<Link className="primary-btn" to="/student">Retour à mes QCM</Link>}
        correction={correction ? <CorrectionView correction={correction} /> : null}
      >
        {terminationReason && <div className="alert error">{terminationReason}</div>}
        <p>Votre note a été transmise à l’administrateur.</p>
        <div className="final-score">{result.note_sur_20}/20</div>
        <p className="muted">Score : {result.score}/{result.total_points} · {result.percentage}%</p>
      </ParticipantQuizResult>
    );
  }

  if (!started) {
    return (
      <div className="page narrow">
        <div className="panel start-panel">
          <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> Avant de commencer</span>
          <h1>{quiz.title}</h1>
          {quiz.description && <p>{quiz.description}</p>}
          <div className="start-meta">
            <span>{quiz.questions.length} questions</span>
            {quiz.ends_at && <span><FontAwesomeIcon icon={faClock} /> Fermeture : {new Date(quiz.ends_at).toLocaleString('fr-FR')}</span>}
          </div>
          {autoSubmitting && (
            <div className="alert warning" role="status">
              <FontAwesomeIcon icon={faClock} /> Soumission automatique en cours…
            </div>
          )}
          {autoSubmitError && (
            <div className="alert error participant-auto-submit-error" role="alert">
              <div><strong>La soumission automatique a échoué.</strong><br />{autoSubmitError}</div>
              <button className="secondary-btn" type="button" onClick={() => submitAnswers({ auto: true })} disabled={loading}>
                Réessayer l’envoi automatique
              </button>
            </div>
          )}
          <AntiCheatRules />
          <div className="builder-actions">
            <Link className="secondary-btn" to="/student"><FontAwesomeIcon icon={faRotateLeft} /> Retour</Link>
            <button className="primary-btn" type="button" onClick={() => setStarted(true)}>
              <FontAwesomeIcon icon={faCircleQuestion} /> Commencer le test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow no-select participant-quiz-page">
      <div className="page-header participant-quiz-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> Test en cours</span>
          <h1>{quiz.title}</h1>
          {quiz.description && <p>{quiz.description}</p>}
          <div className="alert warning anticheat-notice">
            <FontAwesomeIcon icon={faTriangleExclamation} /> Anti-triche actif : quitter la page, copier ou capturer l’écran mettra fin au test.
          </div>
        </div>
      </div>

      <ParticipantQuizFlow
        questions={quiz.questions}
        answers={answers}
        onAnswersChange={updateAnswers}
        onSubmit={() => submitAnswers({ auto: false })}
        disabled={timeLeft === 0}
        submitting={loading && !autoSubmitting}
        autoSubmitting={autoSubmitting}
        error={error}
        warning={warning}
        autoSubmitError={autoSubmitError}
        onRetryAutoSubmit={() => submitAnswers({ auto: true })}
        timer={formatTimeLeft()}
        cancelAction={<Link className="secondary-btn" to="/student">Annuler</Link>}
      />
    </div>
  );
}
