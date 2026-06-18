import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCircleQuestion, faPaperPlane, faRotateLeft, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function TakeQuiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/student/quizzes/${id}`)
      .then((response) => setQuiz(response.data))
      .catch((err) => setError(getApiError(err)));
  }, [id]);

  function choose(questionId, choiceId) {
    setAnswers({ ...answers, [questionId]: choiceId });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (Object.keys(answers).length !== quiz.questions.length) {
      setError('Veuillez répondre à toutes les questions avant d’envoyer.');
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
        </div>
      </div>

      <form onSubmit={submit} className="test-form">
        {error && <div className="alert error">{error}</div>}
        {quiz.questions.map((question, index) => (
          <article className="question-card test-question" key={question.id}>
            <h2>Question {index + 1}</h2>
            <p className="question-text">{question.body}</p>
            <div className="choice-options">
              {question.choices.map((choice) => (
                <label className={`answer-option ${answers[question.id] === choice.id ? 'selected' : ''}`} key={choice.id}>
                  <input type="radio" name={`question-${question.id}`} checked={answers[question.id] === choice.id} onChange={() => choose(question.id, choice.id)} />
                  <span>{choice.body}</span>
                </label>
              ))}
            </div>
          </article>
        ))}

        <div className="builder-actions sticky-actions">
          <Link className="secondary-btn" to="/student">Annuler</Link>
          <button className="primary-btn" disabled={loading}>
            <FontAwesomeIcon icon={faPaperPlane} /> {loading ? 'Envoi...' : 'Envoyer mes réponses'}
          </button>
        </div>
      </form>
    </div>
  );
}
