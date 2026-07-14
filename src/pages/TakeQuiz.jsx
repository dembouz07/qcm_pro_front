import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCircleQuestion, faClock, faPaperPlane, faRotateLeft, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAntiCheat } from '../useAntiCheat.js';
import AntiCheatRules from '../components/AntiCheatRules.jsx';
import CorrectionView from '../components/CorrectionView.jsx';

// Mélange (Fisher-Yates) — l'ordre d'affichage change par élève/tentative.
// La soumission se fait par id, donc mélanger l'affichage ne modifie pas la correction.
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffleQuiz(quiz) {
  if (!quiz || !Array.isArray(quiz.questions)) return quiz;
  return {
    ...quiz,
    questions: shuffleArray(quiz.questions).map((q) => ({
      ...q,
      choices: Array.isArray(q.choices) ? shuffleArray(q.choices) : q.choices,
    })),
  };
}

export default function TakeQuiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [correction, setCorrection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [warning, setWarning] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [started, setStarted] = useState(false);

  const answersRef = useRef({});
  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  // Anti-triche : actif seulement une fois le test démarré
  useAntiCheat({
    active: !!quiz && started && !result,
    onWarn: (msg) => setWarning(msg),
    onTerminate: (reason) => {
      setTerminationReason(reason);
      submitAnswers({ auto: true });
    }
  });

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    api.get(`/student/quizzes/${id}`)
      .then((response) => setQuiz(shuffleQuiz(response.data)))
      .catch((err) => setError(getApiError(err)));
  }, [id]);

  // Restaurer la progression sauvegardée localement
  useEffect(() => {
    if (!quiz) return;
    try {
      const raw = localStorage.getItem(`qcm_progress_${id}`);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.answers && Object.keys(saved.answers).length > 0) {
          setAnswers(saved.answers);
          setStarted(true); // reprise : le test était déjà commencé
        }
      }
    } catch {
      // ignore
    }
  }, [quiz, id]);

  // Sauvegarder la progression à chaque réponse
  useEffect(() => {
    if (!quiz || result) return;
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(`qcm_progress_${id}`, JSON.stringify({ answers }));
    } catch {
      // ignore
    }
  }, [answers, quiz, result, id]);

  useEffect(() => {
    if (!quiz || !quiz.ends_at || result) return;

    function updateTimer() {
      const endsAt = new Date(quiz.ends_at).getTime();
      const diff = endsAt - Date.now();

      if (diff <= 0) {
        setTimeLeft(0);

        if (!autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          submitAnswers({ auto: true });
        }

        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff
      });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [quiz, result]);

  function buildPayload(auto = false) {
    const currentAnswers = auto ? answersRef.current : answers;

    return {
      auto_submit: auto,
      answers: Object.entries(currentAnswers).map(([questionId, val]) => (
        Array.isArray(val)
          ? { question_id: Number(questionId), choice_ids: val.map(Number) }
          : { question_id: Number(questionId), choice_id: Number(val) }
      ))
    };
  }

  async function submitAnswers({ auto = false } = {}) {
    if (submittingRef.current || result || !quiz) return;

    if (!auto) {
      const answeredCount = Object.values(answers).filter((v) => Array.isArray(v) ? v.length > 0 : v != null).length;
      const totalQuestions = quiz.questions.length;

      if (answeredCount !== totalQuestions) {
        setError(`Veuillez répondre à toutes les questions avant d'envoyer. (${answeredCount}/${totalQuestions} répondues)`);
        return;
      }
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');

    if (auto) {
      setAutoSubmitting(true);
    }

    try {
      const response = await api.post(`/student/quizzes/${id}/submit`, buildPayload(auto));
      setResult(response.data.submission);
      if (response.data.show_corrections && response.data.correction) {
        setCorrection(response.data.correction);
      }
      try { localStorage.removeItem(`qcm_progress_${id}`); } catch { /* ignore */ }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      submittingRef.current = false;
      setLoading(false);
      setAutoSubmitting(false);
    }
  }

  function choose(questionId, choiceId, multiple) {
    if (timeLeft === 0 || loading || autoSubmitting) return;
    setAnswers((current) => {
      let next;
      if (multiple) {
        const arr = Array.isArray(current[questionId]) ? current[questionId] : (current[questionId] != null ? [current[questionId]] : []);
        const updated = arr.includes(choiceId) ? arr.filter((x) => x !== choiceId) : [...arr, choiceId];
        next = { ...current, [questionId]: updated };
      } else {
        next = { ...current, [questionId]: choiceId };
      }
      try { localStorage.setItem(`qcm_progress_${id}`, JSON.stringify({ answers: next })); } catch { /* ignore */ }
      return next;
    });
  }

  function submit(event) {
    event.preventDefault();
    submitAnswers({ auto: false });
  }

  function formatTimeLeft() {
    if (!quiz?.ends_at) return <div className="timer"><FontAwesomeIcon icon={faClock} /> Pas d'heure de fermeture définie</div>;
    if (!timeLeft) return null;
    if (timeLeft === 0) return <div className="timer urgent"><FontAwesomeIcon icon={faClock} /> Temps écoulé</div>;

    const { hours, minutes, seconds, total } = timeLeft;
    const isUrgent = total < 5 * 60 * 1000;
    const className = isUrgent ? 'timer urgent' : 'timer';

    let text = '';
    if (hours > 0) text += `${hours}h `;
    if (minutes > 0 || hours > 0) text += `${minutes}m `;
    text += `${seconds}s`;

    return <div className={className}><FontAwesomeIcon icon={faClock} /> Temps restant : {text}</div>;
  }

  if (error && !quiz) {
    return (
      <div className="page narrow">
        <div className="panel center">
          <div className="big-icon warning"><FontAwesomeIcon icon={faTriangleExclamation} /></div>
          <h1>QCM indisponible</h1>
          <p>{error}</p>
          <Link className="primary-btn" to="/student"><FontAwesomeIcon icon={faRotateLeft} /> Retour</Link>
        </div>
      </div>
    );
  }

  if (!quiz) return <div className="center-screen">Chargement du QCM...</div>;

  if (result) {
    return (
      <div className="page narrow">
        <div className="panel center success-panel">
          <div className="big-icon success"><FontAwesomeIcon icon={faCheckCircle} /></div>
          <h1>{terminationReason ? 'Test terminé' : 'Réponses envoyées'}</h1>
          {terminationReason && <div className="alert error">{terminationReason}</div>}
          <p>Votre note a été transmise à l'administrateur.</p>
          <div className="final-score">{result.note_sur_20}/20</div>
          <p className="muted">Score : {result.score}/{result.total_points} · {result.percentage}%</p>
          <Link className="primary-btn" to="/student">Retour à mes QCM</Link>
        </div>

        {correction && (
          <div className="panel" style={{ marginTop: 18 }}>
            <h2><FontAwesomeIcon icon={faCircleQuestion} /> Correction détaillée</h2>
            <CorrectionView correction={correction} />
          </div>
        )}
      </div>
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

          <AntiCheatRules />

          <div className="builder-actions">
            <Link className="secondary-btn" to="/student"><FontAwesomeIcon icon={faRotateLeft} /> Retour</Link>
            <button className="primary-btn" onClick={() => setStarted(true)}>
              <FontAwesomeIcon icon={faCircleQuestion} /> Commencer le test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow no-select">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> Test en cours</span>
          <h1>{quiz.title}</h1>
          <p>{quiz.description}</p>
          <div className="alert warning anticheat-notice">
            <FontAwesomeIcon icon={faTriangleExclamation} /> Anti-triche actif : quitter la page, copier ou capturer l'écran mettra fin au test.
          </div>
          {formatTimeLeft()}
        </div>
      </div>

      <form onSubmit={submit} className="test-form">
        {error && <div className="alert error">{error}</div>}
        {warning && <div className="alert warning">{warning}</div>}
        {autoSubmitting && <div className="alert warning"><FontAwesomeIcon icon={faClock} /> Soumission automatique en cours...</div>}

        {quiz.questions.map((question, index) => {
          const longestChoice = question.choices.reduce((max, c) => Math.max(max, (c.body || '').length), 0);
          const useSingleColumn = question.choices.length < 2 || longestChoice > 60;

          return (
            <article className="question-card test-question" key={question.id}>
              <h2>Question {index + 1}{question.multiple ? <span className="badge" style={{ marginLeft: 10 }}>Plusieurs réponses</span> : null}</h2>
              <p className="question-text">{question.body}</p>
              <div className={`choice-options ${useSingleColumn ? 'single-column' : ''}`}>
                {question.choices.map((choice) => {
                  const isMulti = !!question.multiple;
                  const val = answers[question.id];
                  const selected = isMulti ? (Array.isArray(val) && val.includes(choice.id)) : val === choice.id;
                  return (
                    <label className={`answer-option ${selected ? 'selected' : ''}`} key={choice.id}>
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={`question-${question.id}`}
                        checked={selected}
                        onChange={() => choose(question.id, choice.id, isMulti)}
                        disabled={timeLeft === 0 || loading || autoSubmitting}
                      />
                      <span>{choice.body}</span>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}

        <div className="builder-actions sticky-actions">
          <Link className="secondary-btn" to="/student">Annuler</Link>
          <button className="primary-btn" disabled={loading || timeLeft === 0 || autoSubmitting}>
            <FontAwesomeIcon icon={faPaperPlane} /> {loading ? 'Envoi...' : 'Envoyer mes réponses'}
          </button>
        </div>
      </form>
    </div>
  );
}
