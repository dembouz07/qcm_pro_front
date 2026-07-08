import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faCheckCircle, faCircle, faCirclePlus, faCircleQuestion, faFloppyDisk, faPlus, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

const emptyQuestion = () => ({
  body: '',
  explanation: '',
  points: 1,
  choices: [
    { body: '', is_correct: true },
    { body: '', is_correct: false }
  ]
});

export default function QuizForm() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    school_class_id: '',
    starts_at: '',
    ends_at: '',
    show_corrections: false,
    questions: [emptyQuestion()]
  });

  useEffect(() => {
    api.get('/admin/classes').then((response) => setClasses(response.data));
  }, []);

  function updateQuestion(index, patch) {
    const questions = [...form.questions];
    questions[index] = { ...questions[index], ...patch };
    setForm({ ...form, questions });
  }

  function updateChoice(questionIndex, choiceIndex, patch) {
    const questions = [...form.questions];
    const choices = [...questions[questionIndex].choices];
    choices[choiceIndex] = { ...choices[choiceIndex], ...patch };
    questions[questionIndex] = { ...questions[questionIndex], choices };
    setForm({ ...form, questions });
  }

  function markCorrect(questionIndex, choiceIndex) {
    const questions = [...form.questions];
    questions[questionIndex].choices = questions[questionIndex].choices.map((choice, index) => ({
      ...choice,
      is_correct: index === choiceIndex
    }));
    setForm({ ...form, questions });
  }

  function addChoice(questionIndex) {
    const questions = [...form.questions];
    questions[questionIndex].choices.push({ body: '', is_correct: false });
    setForm({ ...form, questions });
  }

  function removeChoice(questionIndex, choiceIndex) {
    const questions = [...form.questions];
    if (questions[questionIndex].choices.length <= 2) return;
    questions[questionIndex].choices = questions[questionIndex].choices.filter((_, index) => index !== choiceIndex);
    if (!questions[questionIndex].choices.some((choice) => choice.is_correct)) {
      questions[questionIndex].choices[0].is_correct = true;
    }
    setForm({ ...form, questions });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/admin/quizzes', {
        ...form,
        school_class_id: Number(form.school_class_id),
        ends_at: form.ends_at || null
      });
      navigate('/admin');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/admin/quizzes/create" className="back-link"><FontAwesomeIcon icon={faArrowLeft} /> Retour au choix du format</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faCircleQuestion} /> Création manuelle</span>
          <h1>Nouveau QCM</h1>
          <p>Saisissez les questions, les choix et cochez la bonne réponse.</p>
        </div>
      </div>

      <form className="builder" onSubmit={handleSubmit}>
        {error && <div className="alert error">{error}</div>}

        <section className="panel form-grid">
          <label>
            Titre du QCM
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Classe concernée
            <select value={form.school_class_id} onChange={(e) => setForm({ ...form, school_class_id: e.target.value })} required>
              <option value="">Choisir une classe</option>
              {classes.map((classe) => <option key={classe.id} value={classe.id}>{classe.name}</option>)}
            </select>
          </label>
          <label>
            Ouverture précise
            <div className="input-icon plain">
              <FontAwesomeIcon icon={faCalendarDays} />
              <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
            </div>
          </label>
          <label>
            Fermeture facultative
            <div className="input-icon plain">
              <FontAwesomeIcon icon={faCalendarDays} />
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </label>
          <label className="span-2">
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" />
          </label>
          <label className="span-2 toggle-field">
            <input
              type="checkbox"
              checked={form.show_corrections}
              onChange={(e) => setForm({ ...form, show_corrections: e.target.checked })}
            />
            <span>Afficher la correction aux élèves après soumission (bonnes réponses + explications)</span>
          </label>
        </section>

        <section className="questions-list">
          {form.questions.map((question, questionIndex) => (
            <article className="question-card" key={questionIndex}>
              <div className="question-head">
                <h3><FontAwesomeIcon icon={faCircleQuestion} /> Question {questionIndex + 1}</h3>
                <button type="button" className="icon-btn danger" onClick={() => setForm({ ...form, questions: form.questions.filter((_, index) => index !== questionIndex) })} disabled={form.questions.length === 1}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>

              <label>
                Texte de la question
                <textarea value={question.body} onChange={(e) => updateQuestion(questionIndex, { body: e.target.value })} required />
              </label>

              <label className="points-field">
                Points
                <input type="number" min="1" value={question.points} onChange={(e) => updateQuestion(questionIndex, { points: Number(e.target.value) })} />
              </label>

              <label>
                Explication (affichée dans la correction, optionnel)
                <textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(questionIndex, { explanation: e.target.value })}
                  rows="2"
                  placeholder="Pourquoi cette réponse est correcte..."
                />
              </label>

              <div className="choices-head">Réponses <span>— cliquez sur le rond à gauche pour définir la bonne réponse</span></div>
              <div className="choices">
                {question.choices.map((choice, choiceIndex) => (
                  <div className={`choice-row ${choice.is_correct ? 'correct' : ''}`} key={choiceIndex}>
                    <button
                      type="button"
                      className={`check-btn ${choice.is_correct ? 'on' : ''}`}
                      onClick={() => markCorrect(questionIndex, choiceIndex)}
                      title="Marquer comme bonne réponse"
                    >
                      <FontAwesomeIcon icon={choice.is_correct ? faCheckCircle : faCircle} />
                    </button>
                    <input placeholder={`Choix ${choiceIndex + 1}`} value={choice.body} onChange={(e) => updateChoice(questionIndex, choiceIndex, { body: e.target.value })} required />
                    <button type="button" className="icon-btn danger" onClick={() => removeChoice(questionIndex, choiceIndex)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="secondary-btn small" onClick={() => addChoice(questionIndex)}>
                <FontAwesomeIcon icon={faPlus} /> Ajouter un choix
              </button>
            </article>
          ))}
        </section>

        <div className="builder-actions">
          <button type="button" className="secondary-btn" onClick={() => setForm({ ...form, questions: [...form.questions, emptyQuestion()] })}>
            <FontAwesomeIcon icon={faCirclePlus} /> Ajouter une question
          </button>
          <button className="primary-btn" disabled={loading}>
            <FontAwesomeIcon icon={faFloppyDisk} /> {loading ? 'Enregistrement...' : 'Créer le QCM'}
          </button>
        </div>
      </form>
    </div>
  );
}
