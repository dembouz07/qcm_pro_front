import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faPlus,
  faTrash,
  faCalendarDays,
  faDiagramProject,
  faCircleQuestion
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

function emptyStage(index) {
  return { name: `Stade ${index + 1}`, questions: [''] };
}

export default function ProgressiveQuizForm() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    school_class_id: '',
    starts_at: '',
    ends_at: '',
    stage_threshold: 5
  });
  const [stages, setStages] = useState([emptyStage(0), emptyStage(1)]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/classes').then((response) => setClasses(response.data));
  }, []);

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
    setLoading(true);

    const payload = {
      ...form,
      stage_threshold: Number(form.stage_threshold),
      stages: stages.map((stage) => ({
        name: stage.name,
        questions: stage.questions.filter((q) => q.trim() !== '')
      }))
    };

    try {
      await api.post('/admin/progressive-quizzes', payload);
      navigate('/admin/quizzes');
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
          <span className="eyebrow"><FontAwesomeIcon icon={faDiagramProject} /> Diagnostic progressif</span>
          <h1>Créer un QCM progressif</h1>
          <p>
            Questionnaire par stades avec réponses Oui/Non. Un stade est validé quand le participant
            atteint le seuil de "Oui". Le diagnostic s'arrête au dernier stade validé.
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

          <label>
            Classe / Direction concernée *
            <select
              value={form.school_class_id}
              onChange={(e) => setForm({ ...form, school_class_id: e.target.value })}
              required
            >
              <option value="">Choisir une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>{classe.name}</option>
              ))}
            </select>
          </label>

          <label>
            Seuil de validation par stade (nb de "Oui") *
            <input
              type="number"
              min="1"
              max="20"
              value={form.stage_threshold}
              onChange={(e) => setForm({ ...form, stage_threshold: e.target.value })}
              required
            />
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
            <FontAwesomeIcon icon={faCircleQuestion} /> {loading ? 'Création...' : 'Créer le diagnostic'}
          </button>
        </div>
      </form>
    </div>
  );
}
