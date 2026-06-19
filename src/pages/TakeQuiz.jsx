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
  const submitRef = useRef(null);

  useEffect(() => {
    api.get(`/student/quizzes/${id}`)
      .then((response) => setQuiz(response.data))
      .catch((err) => setError(getApiError(err)));
  }, [id]);

  // Timer pour le compte à rebours et soumission automatique
  useEffect(() => {
    if (!quiz || !quiz.ends_at || result) return;

    const interval = setInterval(() => {
      const now = new Date();
      const endsAt = new Date(quiz.ends_at);
      const diff = endsAt - now;

      if (diff <= 0) {
        // Temps écoulé - soumettre automatiquement
        setTimeLeft(0);
        clearInterval(interval);
        
        if (submitRef.current && !result) {
          submitRef.current();
        }
      } else {
        // Calculer le temps restant
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft({ hours, minutes, seconds, total: diff });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, result]);

  function choose(questionId, choiceId) {
    setAnswers({ ...answers, [questionId]: choiceId });
  }

  async function submit(event) {
    if (event) event.preventDefault();
    
    // Éviter les soumissions multiples
    if (loading || result) return;
    
    setError('');

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = quiz.questions.length;

    // Si soumission manuelle, vérifier que toutes les questions sont répondues
    if (answeredCount !== totalQuestions && event) {
      setError(`Veuillez répondre à toutes les questions avant d'envoyer. (${answeredCount}/${totalQuestions} répondues)`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, choiceId]) => ({
          question_id: Number(questionId),
          choice_id: Number(choiceId)
        }))
      };
      const response = await api.post(`/student/quizzes/${id}/submit`, payload);
      setResult(response.data.submission);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  // Référence pour la soumission automatique
  useEffect(() => {
    submitRef.current = submit;
  });

  // Formater le temps restant
  function formatTimeLeft() {
    if (!timeLeft) return null;
    if (timeLeft === 0) return 'Temps écoulé !';
    
    const { hours, minutes, seconds, total } = timeLeft;
    
    // Afficher en rouge si moins de 5 minutes
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
        {timeLeft === 0 && <div className="alert warning"><FontAwesomeIcon icon={faClock} /> Temps écoulé ! Soumission automatique en cours...</div>}
        
        {quiz.questions.map((question, index) => (
          <article className="question-card test-question" key={question.id}>
            <h2>Question {index + 1}</h2>
            <p className="question-text">{question.body}</p>
            <div className="choice-options">
              {question.choices.map((choice) => (
                <label className={`answer-option ${answers[question.id] === choice.id ? 'selected' : ''}`} key={choice.id}>
                  <input type="radio" name={`question-${question.id}`} checked={answers[question.id] === choice.id} onChange={() => choose(question.id, choice.id)} disabled={timeLeft === 0 || loading} />
                  <span>{choice.body}</span>
                </label>
              ))}
            </div>
          </article>
        ))}

        <div className="builder-actions sticky-actions">
          <Link className="secondary-btn" to="/student">Annuler</Link>
          <button className="primary-btn" disabled={loading || timeLeft === 0}>
            <FontAwesomeIcon icon={faPaperPlane} /> {loading ? 'Envoi...' : 'Envoyer mes réponses'}
          </button>
        </div>
      </form>
    </div>
  );
}
