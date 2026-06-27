import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCircleQuestion, faClock, faPaperPlane, faRotateLeft, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function TakeQuiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const answersRef = useRef({});
  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    api.get(`/student/quizzes/${id}`)
      .then((response) => setQuiz(response.data))
      .catch((err) => setError(getApiError(err)));
  }, [id]);

  // Restaurer la progression sauvegardée localement
  useEffect(() => {
    if (!quiz) return;
    try {
      const raw = localStorage.getItem(`qcm_progress_${id}`);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.answers) setAnswers(saved.answers);
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
      answers: Object.entries(currentAnswers).map(([questionId, choiceId]) => ({
        question_id: Number(questionId),
        choice_id: Number(choiceId)
      }))
    };
  }

  async function submitAnswers({ auto = false } = {}) {
    if (submittingRef.current || result || !quiz) return;

    if (!auto) {
      const answeredCount = Object.keys(answers).length;
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
      try { localStorage.removeItem(`qcm_progress_${id}`); } catch { /* ignore */ }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      submittingRef.current = false;
      setLoading(false);
      setAutoSubmitting(false);
    }
  }

  function choose(questionId, choiceId) {
    if (timeLeft === 0 || loading || autoSubmitting) return;
    setAnswers((current) => {
      const next = { ...current, [questionId]: choiceId };
      // Sauvegarde immédiate (ne dépend pas du cycle de rendu)
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
          <h1>Réponses envoyées</h1>
          <p>Votre note a été transmise à l'administrateur.</p>
          <div className="final-score">{result.note_sur_20}/20</div>
          <p className="muted">Score : {result.score}/{result.total_points} · {result.percentage}%</p>
          <Link className="primary-btn" to="/student">Retour à mes QCM</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> Test en cours</span>
          <h1>{quiz.title}</h1>
          <p>{quiz.description}</p>
          {formatTimeLeft()}
        </div>
      </div>

      <form onSubmit={submit} className="test-form">
        {error && <div className="alert error">{error}</div>}
        {autoSubmitting && <div className="alert warning"><FontAwesomeIcon icon={faClock} /> Temps écoulé : soumission automatique en cours...</div>}

        {quiz.questions.map((question, index) => {
          const longestChoice = question.choices.reduce((max, c) => Math.max(max, (c.body || '').length), 0);
          const useSingleColumn = question.choices.length < 2 || longestChoice > 60;

          return (
            <article className="question-card test-question" key={question.id}>
              <h2>Question {index + 1}</h2>
              <p className="question-text">{question.body}</p>
              <div className={`choice-options ${useSingleColumn ? 'single-column' : ''}`}>
                {question.choices.map((choice) => (
                  <label className={`answer-option ${answers[question.id] === choice.id ? 'selected' : ''}`} key={choice.id}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answers[question.id] === choice.id}
                      onChange={() => choose(question.id, choice.id)}
                      disabled={timeLeft === 0 || loading || autoSubmitting}
                    />
                    <span>{choice.body}</span>
                  </label>
                ))}
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
