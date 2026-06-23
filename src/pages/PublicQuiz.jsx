import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faCircleQuestion, 
  faClock, 
  faLock, 
  faPaperPlane, 
  faTriangleExclamation,
  faUser,
  faBookOpen
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { countdownTo, formatDateTime } from '../utils/time.js';

export default function PublicQuiz() {
  const { token } = useParams();

  // Étapes : 'loading' | 'info' | 'quiz' | 'result' | 'error'
  const [step, setStep] = useState('loading');
  const [quizInfo, setQuizInfo] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Formulaire participant
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [referentiel, setReferentiel] = useState('');

  // Réponses
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const answersRef = useRef({});
  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Charger les infos du quiz
  useEffect(() => {
    api.get(`/public/quiz/${token}`)
      .then((response) => {
        setQuizInfo(response.data);
        setStep('info');
      })
      .catch((err) => {
        setError(getApiError(err));
        setStep('error');
      });
  }, [token]);

  // Rafraîchir les infos si le quiz est verrouillé (pour le countdown)
  useEffect(() => {
    if (step !== 'info' || !quizInfo?.is_locked) return;

    const interval = setInterval(() => {
      api.get(`/public/quiz/${token}`)
        .then((response) => {
          setQuizInfo(response.data);
          if (response.data.is_open) {
            // Le quiz vient de s'ouvrir
          }
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [step, quizInfo, token]);

  // Timer pour le quiz ouvert
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

  async function handleStart(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post(`/public/quiz/${token}/start`, {
        nom,
        prenom,
        referentiel
      });
      setQuiz(response.data);
      setStep('quiz');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function buildPayload(auto = false) {
    const currentAnswers = auto ? answersRef.current : answers;
    return {
      nom,
      prenom,
      referentiel,
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
        setError(`Veuillez répondre à toutes les questions. (${answeredCount}/${totalQuestions} répondues)`);
        return;
      }
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');

    if (auto) setAutoSubmitting(true);

    try {
      const response = await api.post(`/public/quiz/${token}/submit`, buildPayload(auto));
      setResult(response.data.submission);
      setStep('result');
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
    setAnswers((current) => ({ ...current, [questionId]: choiceId }));
  }

  function submit(event) {
    event.preventDefault();
    submitAnswers({ auto: false });
  }

  function formatTimeLeftDisplay() {
    if (!quiz?.ends_at) return <div className="timer"><FontAwesomeIcon icon={faClock} /> Pas de limite de temps</div>;
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

  // ─── ÉTAPE : Erreur ─────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="page narrow public-quiz-page">
        <div className="panel center">
          <div className="big-icon warning"><FontAwesomeIcon icon={faTriangleExclamation} /></div>
          <h1>QCM indisponible</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ─── ÉTAPE : Chargement ──────────────────────────────────
  if (step === 'loading') {
    return <div className="center-screen">Chargement du QCM...</div>;
  }

  // ─── ÉTAPE : Résultat ────────────────────────────────────
  if (step === 'result' && result) {
    return (
      <div className="page narrow public-quiz-page">
        <div className="panel center success-panel">
          <div className="big-icon success"><FontAwesomeIcon icon={faCheckCircle} /></div>
          <h1>Réponses envoyées</h1>
          <p>Merci <strong>{prenom} {nom}</strong>, votre note a été enregistrée.</p>
          <div className="final-score">{result.note_sur_20}/20</div>
          <p className="muted">Score : {result.score}/{result.total_points} · {result.percentage}%</p>
        </div>
      </div>
    );
  }

  // ─── ÉTAPE : Formulaire d'identification + info quiz ─────
  if (step === 'info') {
    return (
      <div className="page narrow public-quiz-page">
        <div className="panel center">
          <div className="big-icon"><FontAwesomeIcon icon={faBookOpen} /></div>
          <h1>{quizInfo.title}</h1>
          {quizInfo.description && <p>{quizInfo.description}</p>}
          <div className="meta-line"><FontAwesomeIcon icon={faClock} /> Ouverture : {formatDateTime(quizInfo.starts_at)}</div>
          {quizInfo.ends_at && <div className="meta-line"><FontAwesomeIcon icon={faClock} /> Fermeture : {formatDateTime(quizInfo.ends_at)}</div>}
          <div className="meta-line">{quizInfo.questions_count} questions</div>
        </div>

        {quizInfo.is_closed && (
          <div className="alert warning">
            <FontAwesomeIcon icon={faTriangleExclamation} /> Ce QCM est fermé.
          </div>
        )}

        {quizInfo.is_locked && (
          <div className="panel center">
            <div className="big-icon"><FontAwesomeIcon icon={faLock} /></div>
            <h2>QCM pas encore ouvert</h2>
            <p>Ce QCM sera disponible le <strong>{formatDateTime(quizInfo.starts_at)}</strong></p>
            <div className="countdown"><FontAwesomeIcon icon={faLock} /> Ouvre dans {countdownTo(quizInfo.starts_at)}</div>
          </div>
        )}

        {quizInfo.is_open && (
          <form className="panel form-grid" onSubmit={handleStart}>
            <h2><FontAwesomeIcon icon={faUser} /> Identification</h2>
            <p>Renseignez vos informations pour accéder au QCM.</p>

            {error && <div className="alert error span-2">{error}</div>}

            <label>
              Nom *
              <input 
                value={nom} 
                onChange={(e) => setNom(e.target.value)} 
                placeholder="Votre nom" 
                required 
              />
            </label>

            <label>
              Prénom *
              <input 
                value={prenom} 
                onChange={(e) => setPrenom(e.target.value)} 
                placeholder="Votre prénom" 
                required 
              />
            </label>

            <label className="span-2">
              Référentiel *
              <input 
                value={referentiel} 
                onChange={(e) => setReferentiel(e.target.value)} 
                placeholder="Votre référentiel (ex: Développement Web, Réseaux...)" 
                required 
              />
            </label>

            <button className="primary-btn span-2" disabled={loading}>
              <FontAwesomeIcon icon={faCircleQuestion} /> {loading ? 'Chargement...' : 'Accéder au QCM'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // ─── ÉTAPE : Quiz en cours ───────────────────────────────
  if (step === 'quiz' && quiz) {
    return (
      <div className="page narrow public-quiz-page">
        <div className="page-header">
          <div>
            <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> Test en cours</span>
            <h1>{quiz.title}</h1>
            <p>{quiz.description}</p>
            <p className="muted">Participant : {prenom} {nom} · {referentiel}</p>
            {formatTimeLeftDisplay()}
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
            <button className="primary-btn" disabled={loading || timeLeft === 0 || autoSubmitting}>
              <FontAwesomeIcon icon={faPaperPlane} /> {loading ? 'Envoi...' : 'Envoyer mes réponses'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
