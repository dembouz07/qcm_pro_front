import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faPlus,
  faTrash,
  faCalendarDays,
  faDiagramProject,
  faCircleQuestion,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { validateProgressiveQuiz } from '../quizFormValidation.js';

function emptyStage(index) {
  return { name: `Stade ${index + 1}`, questions: [''] };
}

export default function ProgressiveQuizForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState({
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    stage_threshold: 1,
    require_stage_pass: true,
  });
  const [stages, setStages] = useState([emptyStage(0), emptyStage(1)]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;

    api.get(`/admin/quizzes/${id}`)
      .then((response) => {
          const quiz = response.data;
          if (quiz.type !== 'progressive') {
            setError("Ce QCM n'est pas un diagnostic progressif.");
            return;
          }

          const groupedStages = Object.values((quiz.questions || []).reduce((groups, question) => {
            const stageNumber = question.stage || 1;
            if (!groups[stageNumber]) {
              groups[stageNumber] = {
                name: question.stage_name || `Stade ${stageNumber}`,
                questions: [],
              };
            }
            groups[stageNumber].questions.push(question.body || '');
            return groups;
          }, {}));

          setForm({
            title: quiz.title || '',
            description: quiz.description || '',
            starts_at: quiz.starts_at?.slice(0, 16) || '',
            ends_at: quiz.ends_at?.slice(0, 16) || '',
            stage_threshold: quiz.stage_threshold || 1,
            require_stage_pass: quiz.require_stage_pass ?? true,
          });
          setStages(groupedStages.length ? groupedStages : [emptyStage(0)]);
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => setInitialLoading(false));
  }, [id, isEditing]);

  function updateStageName(stageIndex, value) {
    setStages((current) =>
      current.map((stage, i) => (i === stageIndex ? { ...stage, name: value } : stage))
    );
  }

  function updateQuestion(stageIndex, qIndex, value) {
    setStages((current) =>
      current.map((stage, i) =>
        i === stageIndex
          ? { ...stage, questions: stage.questions.map((q, j) => (j === qIndex ? value : q)) }
          : stage
      )
    );
  }

  function addQuestion(stageIndex) {
    setStages((current) =>
      current.map((stage, i) =>
        i === stageIndex ? { ...stage, questions: [...stage.questions, ''] } : stage
      )
    );
  }

  function removeQuestion(stageIndex, qIndex) {
    setStages((current) =>
      current.map((stage, i) =>
        i === stageIndex
          ? { ...stage, questions: stage.questions.filter((_, j) => j !== qIndex) }
          : stage
      )
    );
  }

  function addStage() {
    setStages((current) => [...current, emptyStage(current.length)]);
  }

  function removeStage(stageIndex) {
    setStages((current) => current.filter((_, i) => i !== stageIndex));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const validationError = validateProgressiveQuiz(form, stages);
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      ...form,
      stage_threshold: Number(form.stage_threshold),
      stages: stages.map((stage) => ({
        name: stage.name.trim(),
        questions: stage.questions.map((q) => q.trim()).filter(Boolean)
      }))
    };

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/admin/progressive-quizzes/${id}`, payload);
      } else {
        await api.post('/admin/progressive-quizzes', payload);
      }
      navigate('/admin/quizzes');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return <div className="page"><div className="panel">Chargement du diagnostic...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to={isEditing ? `/admin/quizzes/${id}` : '/admin/quizzes/create'} className="back-link"><FontAwesomeIcon icon={faArrowLeft} /> {isEditing ? 'Retour au QCM' : 'Retour au choix du format'}</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faDiagramProject} /> Diagnostic progressif</span>
          <h1>{isEditing ? 'Modifier le QCM progressif' : 'Créer un QCM progressif'}</h1>
          <p>
            Questionnaire public par stades avec réponses Oui/Non. Les participants y accèdent par lien
            et renseignent uniquement leur nom et leur prénom.
          </p>
        </div>
      </div>

      <form className="builder" onSubmit={handleSubmit}>
        {error && <div className="alert error">{error}</div>}

        <div className="panel form-grid">
          <label className="span-2">
            Titre du diagnostic *
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Grille de Diagnostic d'équipe"
              required
            />
          </label>

          <div className="span-2 alert info">
            Accès public : aucune classe n’est requise. Le participant s’identifie avec son nom et son prénom.
          </div>

          <label className="span-2">
            Seuil de validation par stade (nb de "Oui") *
            <input
              type="number"
              min="1"
              max="20"
              value={form.stage_threshold}
              onChange={(e) => setForm({ ...form, stage_threshold: e.target.value })}
              required
            />
            <small className="muted">Le seuil doit pouvoir être atteint dans chaque stade.</small>
          </label>

          <label className="span-2 toggle-field">
            <input
              type="checkbox"
              checked={form.require_stage_pass}
              onChange={(e) => setForm({ ...form, require_stage_pass: e.target.checked })}
            />
            <span className="toggle-field-copy">
              <strong>Exiger la réussite de chaque étape</strong>
              <small>Décochez cette option pour laisser le participant continuer même s’il n’atteint pas le seuil d’un stade.</small>
            </span>
          </label>

          <label>
            Ouverture *
            <div className="input-icon plain">
              <FontAwesomeIcon icon={faCalendarDays} />
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                required
              />
            </div>
          </label>

          <label>
            Fermeture facultative
            <div className="input-icon plain">
              <FontAwesomeIcon icon={faCalendarDays} />
              <input
                type="datetime-local"
                min={form.starts_at || undefined}
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
          </label>

          <label className="span-2">
            Description
            <textarea
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
        </div>

        <div className="questions-list">
          {stages.map((stage, stageIndex) => (
            <div className="question-card" key={stageIndex}>
              <div className="question-head">
                <h3><FontAwesomeIcon icon={faLayerGroup} /> Stade {stageIndex + 1}</h3>
                {stages.length > 1 && (
                  <button type="button" className="icon-btn danger" onClick={() => removeStage(stageIndex)} title="Supprimer le stade">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>

              <label>
                Nom du stade
                <input
                  value={stage.name}
                  onChange={(e) => updateStageName(stageIndex, e.target.value)}
                  placeholder={`Stade ${stageIndex + 1}`}
                  maxLength="190"
                  required
                />
              </label>

              <div className="choices" style={{ marginTop: 16 }}>
                {stage.questions.map((question, qIndex) => (
                  <div className="choice-row" key={qIndex} style={{ gridTemplateColumns: '36px 1fr 44px' }}>
                    <span style={{ textAlign: 'center', fontWeight: 800, color: 'var(--muted)' }}>{qIndex + 1}</span>
                    <input
                      value={question}
                      onChange={(e) => updateQuestion(stageIndex, qIndex, e.target.value)}
                      placeholder="Texte de la question (réponse Oui/Non)"
                      required
                    />
                    {stage.questions.length > 1 && (
                      <button type="button" className="icon-btn danger" onClick={() => removeQuestion(stageIndex, qIndex)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" className="secondary-btn small" style={{ marginTop: 12 }} onClick={() => addQuestion(stageIndex)}>
                <FontAwesomeIcon icon={faPlus} /> Ajouter une question
              </button>
            </div>
          ))}
        </div>

        <div className="builder-actions">
          <button type="button" className="secondary-btn" onClick={addStage}>
            <FontAwesomeIcon icon={faPlus} /> Ajouter un stade
          </button>
          <button className="primary-btn" disabled={loading}>
            <FontAwesomeIcon icon={faCircleQuestion} /> {loading ? 'Enregistrement...' : (isEditing ? 'Enregistrer les modifications' : 'Créer le diagnostic')}
          </button>
        </div>
      </form>
    </div>
  );
}
