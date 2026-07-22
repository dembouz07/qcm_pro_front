import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardQuestion, faArrowLeft, faPlus, faTrash, faCirclePlus, faFloppyDisk, faCircleQuestion,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

const emptyQuestion = () => ({ body: '', type: 'text', options: ['', ''] });

const TYPES = [
  { v: 'text', l: 'Réponse libre' },
  { v: 'single', l: 'Choix unique' },
  { v: 'multiple', l: 'Choix multiples' },
];

export default function SurveyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = !!id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/admin/surveys/${id}`)
      .then((r) => {
        setTitle(r.data.title || '');
        setDescription(r.data.description || '');
        const qs = (r.data.questions || []).map((q) => ({
          body: q.body || '',
          type: q.type || 'text',
          options: q.type === 'text' ? ['', ''] : (q.options && q.options.length >= 2 ? [...q.options] : ['', '']),
        }));
        setQuestions(qs.length ? qs : [emptyQuestion()]);
      })
      .catch((e) => setError(getApiError(e)));
  }, [id, editing]);

  const upQ = (i, patch) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const upOpt = (qi, oi, val) => setQuestions((qs) => qs.map((q, j) => j === qi ? { ...q, options: q.options.map((o, k) => (k === oi ? val : o)) } : q));
  const addOpt = (qi) => setQuestions((qs) => qs.map((q, j) => (j === qi ? { ...q, options: [...q.options, ''] } : q)));
  const rmOpt = (qi, oi) => setQuestions((qs) => qs.map((q, j) => j === qi && q.options.length > 2 ? { ...q, options: q.options.filter((_, k) => k !== oi) } : q));
  const addQ = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const rmQ = (i) => setQuestions((qs) => (qs.length > 1 ? qs.filter((_, j) => j !== i) : qs));

  async function submit(e) {
    e.preventDefault();
    setError('');
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.body.trim()) { setError(`Question ${i + 1} : intitulé vide.`); return; }
      if (q.type !== 'text') {
        const opts = q.options.map((o) => o.trim()).filter(Boolean);
        if (opts.length < 2) { setError(`Question ${i + 1} : au moins 2 options.`); return; }
      }
    }
    setLoading(true);
    try {
      const payload = {
        title,
        description,
        questions: questions.map((q) => ({
          body: q.body,
          type: q.type,
          options: q.type === 'text' ? [] : q.options.map((o) => o.trim()).filter(Boolean),
        })),
      };
      const res = editing
        ? await api.put(`/admin/surveys/${id}`, payload)
        : await api.post('/admin/surveys', payload);
      navigate(`/admin/surveys/${editing ? id : res.data.id}`);
    } catch (err) { setError(getApiError(err)); } finally { setLoading(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/admin/surveys" className="back-link"><FontAwesomeIcon icon={faArrowLeft} /> Retour aux sondages</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardQuestion} /> Sondage anonyme</span>
          <h1>{editing ? 'Modifier le questionnaire' : 'Nouveau questionnaire'}</h1>
          <p>Créez des questions, partagez le lien : les gens répondent anonymement, sans compte.</p>
        </div>
      </div>

      <form className="builder" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}

        <section className="panel form-grid">
          <label className="span-2">
            Titre
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex : Satisfaction de la formation" />
          </label>
          <label className="span-2">
            Description (optionnel)
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="2" />
          </label>
        </section>

        {questions.map((q, qi) => (
          <article className="panel question-card" key={qi}>
            <div className="question-head">
              <h3><FontAwesomeIcon icon={faCircleQuestion} /> Question {qi + 1}</h3>
              {questions.length > 1 && (
                <button type="button" className="icon-btn danger" onClick={() => rmQ(qi)}><FontAwesomeIcon icon={faTrash} /></button>
              )}
            </div>
            <label>
              Intitulé
              <textarea value={q.body} onChange={(e) => upQ(qi, { body: e.target.value })} rows="2" required />
            </label>
            <label>
              Type de réponse
              <select value={q.type} onChange={(e) => upQ(qi, { type: e.target.value })}>
                {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </label>

            {q.type !== 'text' && (
              <div className="choices">
                <div className="choices-head">Options</div>
                {q.options.map((o, oi) => (
                  <div className="choice-row" key={oi} style={{ gridTemplateColumns: '1fr 44px' }}>
                    <input value={o} onChange={(e) => upOpt(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                    <button type="button" className="icon-btn danger" onClick={() => rmOpt(qi, oi)}><FontAwesomeIcon icon={faTrash} /></button>
                  </div>
                ))}
                <button type="button" className="secondary-btn small" onClick={() => addOpt(qi)}><FontAwesomeIcon icon={faPlus} /> Ajouter une option</button>
              </div>
            )}
          </article>
        ))}

        <div className="builder-actions">
          <button type="button" className="secondary-btn" onClick={addQ}><FontAwesomeIcon icon={faCirclePlus} /> Ajouter une question</button>
          <button className="primary-btn" disabled={loading}><FontAwesomeIcon icon={faFloppyDisk} /> {loading ? 'Enregistrement...' : (editing ? 'Enregistrer les modifications' : 'Créer le sondage')}</button>
        </div>
      </form>
    </div>
  );
}
