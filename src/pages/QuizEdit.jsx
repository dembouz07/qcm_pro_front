import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faSave, 
  faTrash, 
  faPlus,
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useDialog } from '../components/DialogProvider.jsx';
import { formatClassLabel } from '../utils/academicYear.js';

export default function QuizEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useDialog();
  const [classes, setClasses] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/admin/quizzes/${id}`),
      api.get('/admin/classes')
    ]).then(([quizResponse, classesResponse]) => {
      const quizData = quizResponse.data;
      
      // Debug: afficher les données brutes
      console.log('🔍 Quiz data loaded:', quizData);
      
      // S'assurer que les questions et choix ont la bonne structure
      if (quizData.questions) {
        quizData.questions = quizData.questions.map((q, qIndex) => {
          console.log(`Question ${qIndex + 1}:`, q.body);
          console.log(`Choices:`, q.choices);
          
          return {
            id: q.id,
            body: q.body || '',
            explanation: q.explanation || '',
            points: q.points || 1,
            choices: (q.choices || []).map((c, cIndex) => {
              console.log(`  Choice ${cIndex + 1}:`, c);
              return {
                id: c.id,
                body: c.body || '',
                is_correct: !!c.is_correct
              };
            })
          };
        });
      }
      
      console.log('✅ Quiz data processed:', quizData);
      
      setQuiz(quizData);
      setClasses(classesResponse.data);
      setLoading(false);
    }).catch(err => {
      console.error('❌ Error loading quiz:', err);
      setError(getApiError(err));
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.put(`/admin/quizzes/${id}`, quiz);
      navigate('/admin/quizzes');
    } catch (err) {
      setError(getApiError(err));
      setSaving(false);
    }
  }

  function updateQuestion(index, field, value) {
    const newQuestions = [...quiz.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuiz({ ...quiz, questions: newQuestions });
  }

  function updateChoice(questionIndex, choiceIndex, field, value) {
    const newQuestions = [...quiz.questions];
    const newChoices = [...newQuestions[questionIndex].choices];
    newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], choices: newChoices };
    setQuiz({ ...quiz, questions: newQuestions });
  }

  function addQuestion() {
    setQuiz({
      ...quiz,
      questions: [...quiz.questions, {
        body: '',
        points: 1,
        choices: [
          { body: '', is_correct: true },
          { body: '', is_correct: false }
        ]
      }]
    });
  }

  async function removeQuestion(index) {
    const ok = await confirm({ title: 'Supprimer la question', message: 'Supprimer cette question ?', confirmText: 'Supprimer' });
    if (!ok) return;
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== index)
    });
  }

  function addChoice(questionIndex) {
    const newQuestions = [...quiz.questions];
    newQuestions[questionIndex].choices.push({ body: '', is_correct: false });
    setQuiz({ ...quiz, questions: newQuestions });
  }

  function removeChoice(questionIndex, choiceIndex) {
    const newQuestions = [...quiz.questions];
    newQuestions[questionIndex].choices = newQuestions[questionIndex].choices.filter((_, i) => i !== choiceIndex);
    setQuiz({ ...quiz, questions: newQuestions });
  }

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;
  if (!quiz) return <div className="page"><div className="panel">QCM introuvable</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faEdit} /> Édition</span>
          <h1>Modifier le QCM</h1>
          <p>Modifiez les informations et les questions du questionnaire.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="panel form-grid">
        {error && <div className="alert error span-2">{error}</div>}

        <label className="span-2">
          Titre du QCM *
          <input 
            value={quiz.title} 
            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} 
            required 
          />
        </label>

        <label>
          Classe *
          <select 
            value={quiz.school_class_id} 
            onChange={(e) => setQuiz({ ...quiz, school_class_id: parseInt(e.target.value) })}
            required
          >
            <option value="">Choisir une classe</option>
            {classes.map((classe) => (
              <option key={classe.id} value={classe.id}>{formatClassLabel(classe)}</option>
            ))}
          </select>
        </label>

        <label>
          Publié
          <div className="checkbox-group">
            <input 
              type="checkbox" 
              checked={quiz.is_published || false}
              onChange={(e) => setQuiz({ ...quiz, is_published: e.target.checked })}
            />
            <span>Rendre visible aux étudiants</span>
          </div>
        </label>

        <label>
          Date d'ouverture *
          <div className="input-icon plain">
            <FontAwesomeIcon icon={faCalendarDays} />
            <input 
              type="datetime-local" 
              value={quiz.starts_at?.slice(0, 16) || ''} 
              onChange={(e) => setQuiz({ ...quiz, starts_at: e.target.value })}
              required
            />
          </div>
        </label>

        <label>
          Date de fermeture
          <div className="input-icon plain">
            <FontAwesomeIcon icon={faCalendarDays} />
            <input 
              type="datetime-local" 
              value={quiz.ends_at?.slice(0, 16) || ''} 
              onChange={(e) => setQuiz({ ...quiz, ends_at: e.target.value })}
            />
          </div>
        </label>

        <label className="span-2">
          Description
          <textarea 
            rows="3" 
            value={quiz.description || ''} 
            onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
          />
        </label>

        <label className="span-2 toggle-field">
          <input
            type="checkbox"
            checked={quiz.show_corrections || false}
            onChange={(e) => setQuiz({ ...quiz, show_corrections: e.target.checked })}
          />
          <span>Afficher la correction aux élèves après soumission (bonnes réponses + explications)</span>
        </label>

        <div className="span-2">
          <h2>Questions ({quiz.questions.length})</h2>
          {quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <h3>Question {qIndex + 1}</h3>
                <button 
                  type="button" 
                  onClick={() => removeQuestion(qIndex)} 
                  className="icon-btn danger"
                  disabled={quiz.questions.length <= 1}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>

              <label>
                Énoncé de la question *
                <textarea
                  rows="2"
                  value={question.body}
                  onChange={(e) => updateQuestion(qIndex, 'body', e.target.value)}
                  required
                />
              </label>

              <label>
                Points
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={question.points || 1}
                  onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                />
              </label>

              <label>
                Explication (affichée dans la correction, optionnel)
                <textarea
                  rows="2"
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Pourquoi cette réponse est correcte..."
                />
              </label>

              <div className="choices-list">
                <strong>Choix de réponses ({question.choices?.length || 0})</strong>
                {(question.choices || []).map((choice, cIndex) => (
                  <div key={cIndex} className="choice-row">
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      checked={!!choice.is_correct}
                      onChange={() => {
                        // Désélectionner tous les autres choix
                        const newQuestions = [...quiz.questions];
                        newQuestions[qIndex].choices = newQuestions[qIndex].choices.map((c, i) => ({
                          ...c,
                          is_correct: i === cIndex
                        }));
                        setQuiz({ ...quiz, questions: newQuestions });
                      }}
                    />
                    <input
                      type="text"
                      value={choice.body || ''}
                      onChange={(e) => updateChoice(qIndex, cIndex, 'body', e.target.value)}
                      placeholder={`Choix ${cIndex + 1}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeChoice(qIndex, cIndex)}
                      className="icon-btn danger"
                      disabled={question.choices.length <= 2}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addChoice(qIndex)} 
                  className="secondary-btn small"
                >
                  <FontAwesomeIcon icon={faPlus} /> Ajouter un choix
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="secondary-btn">
            <FontAwesomeIcon icon={faPlus} /> Ajouter une question
          </button>
        </div>

        <button className="primary-btn span-2" disabled={saving}>
          <FontAwesomeIcon icon={faSave} /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}
