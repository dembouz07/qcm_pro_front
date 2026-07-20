import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles, faArrowLeft, faCheckCircle, faCircle, faTrash, faPlus,
  faCirclePlus, faFloppyDisk, faCalendarDays, faTriangleExclamation, faEye,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { parseQuiz } from '../quizParser.js';
import { validateStandardQuiz } from '../quizFormValidation.js';

const SAMPLE = `1. Quelle est la capitale du Sénégal ?
A) Dakar
B) Thiès
C) Saint-Louis
Réponse : A

2. Quels sont des langages web ? 
- HTML *
- Python
- CSS *

3. AWS est un fournisseur cloud ?
[x] Vrai
[ ] Faux`;

export default function SmartCreateQuiz() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [meta, setMeta] = useState({ title: '', description: '', school_class_id: '', starts_at: '', ends_at: '', show_corrections: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/classes')
      .then((response) => setClasses(response.data))
      .catch((err) => setError(`Impossible de charger les classes. ${getApiError(err)}`));
  }, []);

  function analyze() {
    setError('');
    const { questions: qs, warnings: w } = parseQuiz(text);
    if (qs.length === 0) {
      setError("Aucune question détectée. Vérifiez le texte collé (une question par bloc, avec ses choix en dessous).");
      return;
    }
    setQuestions(qs);
    setWarnings(w);
  }

  // édition
  const upQ = (qi, patch) => setQuestions((qs) => qs.map((q, i) => i === qi ? { ...q, ...patch } : q));
  const upC = (qi, ci, patch) => setQuestions((qs) => qs.map((q, i) => i === qi ? { ...q, choices: q.choices.map((c, j) => j === ci ? { ...c, ...patch } : c) } : q));
  const markCorrect = (qi, ci) => setQuestions((qs) => qs.map((q, i) => {
    if (i !== qi) return q;
    const choices = q.choices.map((c, j) => j === ci ? { ...c, is_correct: !c.is_correct } : c);
    return { ...q, uncertain: !choices.some((choice) => choice.is_correct), choices };
  }));
  const addChoice = (qi) => setQuestions((qs) => qs.map((q, i) => i === qi ? { ...q, choices: [...q.choices, { body: '', is_correct: false }] } : q));
  const removeChoice = (qi, ci) => setQuestions((qs) => qs.map((q, i) => {
    if (i !== qi || q.choices.length <= 2) return q;
    const choices = q.choices.filter((_, j) => j !== ci);
    return { ...q, uncertain: !choices.some((choice) => choice.is_correct), choices };
  }));
  const addQuestion = () => setQuestions((qs) => [...qs, { body: '', points: 1, explanation: '', choices: [{ body: '', is_correct: false }, { body: '', is_correct: false }], uncertain: true }]);
  const removeQuestion = (qi) => setQuestions((qs) => qs.length > 1 ? qs.filter((_, i) => i !== qi) : qs);

  async function save() {
    setError('');
    const validationError = validateStandardQuiz({ ...meta, questions });
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/quizzes', {
        title: meta.title,
        description: meta.description.trim(),
        school_class_id: Number(meta.school_class_id),
        starts_at: meta.starts_at,
        ends_at: meta.ends_at || null,
        show_corrections: meta.show_corrections,
        is_published: true,
        questions: questions.map((q) => ({
          body: q.body,
          points: Number(q.points) || 1,
          explanation: q.explanation || '',
          choices: q.choices.map((c) => ({ body: c.body, is_correct: !!c.is_correct })),
        })),
      });
      navigate('/admin/quizzes');
    } catch (e) { setError(getApiError(e)); } finally { setLoading(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/admin/quizzes/create" className="back-link"><FontAwesomeIcon icon={faArrowLeft} /> Retour au choix du format</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faWandMagicSparkles} /> Création assistée</span>
          <h1>Coller un QCM (tout format)</h1>
          <p>Collez un QCM généré par IA ou copié d'ailleurs. Il est analysé automatiquement, puis vous vérifiez et corrigez les bonnes réponses avant d'enregistrer.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {!questions ? (
        <div className="grid-two">
          <section className="panel">
            <label>
              Collez votre QCM ici
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows="16"
                placeholder={"Collez votre texte...\n\nExemple :\n1. Question ?\nA) Choix\nB) Choix\nRéponse : B"}
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.92rem' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="primary-btn" onClick={analyze} disabled={!text.trim()}>
                <FontAwesomeIcon icon={faWandMagicSparkles} /> Analyser le texte
              </button>
              <button className="secondary-btn" type="button" onClick={() => setText(SAMPLE)}>
                <FontAwesomeIcon icon={faEye} /> Voir un exemple
              </button>
            </div>
          </section>

          <div className="panel docs-panel">
            <h2>Formats reconnus</h2>
            <p className="muted">Le système s'adapte à la plupart des formats :</p>
            <pre>{`1. Question ?
A) Choix        B) Choix
Réponse : B

Question 2 : ... ?
a. Choix
b. Choix ✓

3) Vrai ou faux ?
[x] Vrai
[ ] Faux

• Choix (bonne réponse)
- Choix *`}</pre>
            <p className="muted">Marqueurs de bonne réponse acceptés : <strong>*, ✓, [x], (correct), (bonne réponse)</strong> ou une ligne <strong>« Réponse : B »</strong>.</p>
          </div>
        </div>
      ) : (
        <div className="builder">
          <section className="panel form-grid">
            <label className="span-2">
              Titre du QCM
              <input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="Titre du QCM" required />
            </label>
            <label>
              Classe concernée
              <select value={meta.school_class_id} onChange={(e) => setMeta({ ...meta, school_class_id: e.target.value })} required>
                <option value="">Choisir une classe</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>
              Affichage de la correction
              <select value={meta.show_corrections ? '1' : '0'} onChange={(e) => setMeta({ ...meta, show_corrections: e.target.value === '1' })}>
                <option value="1">Oui — l'élève voit la correction</option>
                <option value="0">Non</option>
              </select>
            </label>
            <label>
              Ouverture
              <div className="input-icon plain">
                <FontAwesomeIcon icon={faCalendarDays} />
                <input type="datetime-local" value={meta.starts_at} onChange={(e) => setMeta({ ...meta, starts_at: e.target.value })} required />
              </div>
            </label>
            <label>
              Fermeture (facultatif)
              <div className="input-icon plain">
                <FontAwesomeIcon icon={faCalendarDays} />
                <input type="datetime-local" min={meta.starts_at || undefined} value={meta.ends_at} onChange={(e) => setMeta({ ...meta, ends_at: e.target.value })} />
              </div>
            </label>
            <label className="span-2">
              Description
              <textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} rows="3" />
            </label>
          </section>

          {warnings.length > 0 && questions.some((q) => q.uncertain) && (
            <div className="alert error" style={{ background: 'rgba(245,158,11,0.12)', color: '#92400e', border: '1px solid rgba(245,158,11,0.3)' }}>
              <FontAwesomeIcon icon={faTriangleExclamation} /> {questions.filter((q) => q.uncertain).length} question(s) sans bonne réponse détectée : cochez au moins une réponse avant l'enregistrement.
            </div>
          )}

          <div className="review-bar panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <strong><FontAwesomeIcon icon={faCheckCircle} /> {questions.length} question(s) détectée(s)</strong>
            <button className="secondary-btn small" type="button" onClick={() => { setQuestions(null); setWarnings([]); }}>
              <FontAwesomeIcon icon={faArrowLeft} /> Modifier le texte collé
            </button>
          </div>

          {questions.map((q, qi) => (
            <article className={`panel question-card ${q.uncertain ? 'q-uncertain' : ''}`} key={qi}>
              <div className="question-head">
                <h3>Question {qi + 1} {q.uncertain && <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#92400e' }}><FontAwesomeIcon icon={faTriangleExclamation} /> à vérifier</span>}</h3>
                <button type="button" className="icon-btn danger" onClick={() => removeQuestion(qi)} disabled={questions.length === 1} title="Supprimer la question" aria-label={`Supprimer la question ${qi + 1}`}><FontAwesomeIcon icon={faTrash} /></button>
              </div>
              <label>
                Énoncé
                <textarea value={q.body} onChange={(e) => upQ(qi, { body: e.target.value })} rows="2" required />
              </label>
              <label className="points-field">
                Points
                <input type="number" min="1" max="100" value={q.points} onChange={(e) => upQ(qi, { points: Number(e.target.value) })} required />
              </label>

              <div className="choices-head">Réponses <span>— cliquez sur le rond pour cocher la/les bonne(s) réponse(s) (plusieurs possibles)</span></div>
              <div className="choices">
                {q.choices.map((c, ci) => (
                  <div className={`choice-row ${c.is_correct ? 'correct' : ''}`} key={ci}>
                    <button type="button" className={`check-btn ${c.is_correct ? 'on' : ''}`} onClick={() => markCorrect(qi, ci)} title="Marquer comme bonne réponse">
                      <FontAwesomeIcon icon={c.is_correct ? faCheckCircle : faCircle} />
                    </button>
                    <input value={c.body} onChange={(e) => upC(qi, ci, { body: e.target.value })} placeholder={`Choix ${ci + 1}`} required />
                    <button type="button" className="icon-btn danger" onClick={() => removeChoice(qi, ci)} disabled={q.choices.length <= 2} title="Supprimer le choix" aria-label={`Supprimer le choix ${ci + 1}`}><FontAwesomeIcon icon={faTrash} /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="secondary-btn small" onClick={() => addChoice(qi)}><FontAwesomeIcon icon={faPlus} /> Ajouter un choix</button>
            </article>
          ))}

          <div className="builder-actions">
            <button type="button" className="secondary-btn" onClick={addQuestion}><FontAwesomeIcon icon={faCirclePlus} /> Ajouter une question</button>
            <button type="button" className="primary-btn" onClick={save} disabled={loading}>
              <FontAwesomeIcon icon={faFloppyDisk} /> {loading ? 'Enregistrement...' : 'Enregistrer le QCM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
