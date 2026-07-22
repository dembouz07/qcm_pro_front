import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardQuestion, faPaperPlane, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function PublicSurvey() {
  const { token } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get(`/public/surveys/${token}`)
      .then((r) => setSurvey(r.data))
      .catch((e) => setError(getApiError(e)));
  }, [token]);

  function setText(qid, v) { setAnswers((a) => ({ ...a, [qid]: v })); }
  function setSingle(qid, v) { setAnswers((a) => ({ ...a, [qid]: v })); }
  function toggleMulti(qid, v) {
    setAnswers((a) => {
      const arr = Array.isArray(a[qid]) ? a[qid] : [];
      return { ...a, [qid]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    // vérifier que toutes les questions ont une réponse
    for (const q of survey.questions) {
      const v = answers[q.id];
      const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) { setError('Merci de répondre à toutes les questions.'); return; }
    }
    setLoading(true);
    try {
      await api.post(`/public/surveys/${token}/respond`, { answers });
      setDone(true);
    } catch (err) { setError(getApiError(err)); } finally { setLoading(false); }
  }

  if (error && !survey) {
    return (
      <div className="page narrow">
        <div className="panel center">
          <div className="big-icon warning"><FontAwesomeIcon icon={faTriangleExclamation} /></div>
          <h1>Sondage indisponible</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (!survey) return <div className="center-screen">Chargement...</div>;

  if (done) {
    return (
      <div className="page narrow">
        <div className="panel center success-panel">
          <div className="big-icon success"><FontAwesomeIcon icon={faCircleCheck} /></div>
          <h1>Merci !</h1>
          <p>Votre réponse a bien été enregistrée. Vous pouvez fermer cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardQuestion} /> Questionnaire anonyme</span>
          <h1>{survey.title}</h1>
          {survey.description && <p>{survey.description}</p>}
        </div>
      </div>

      <form onSubmit={submit} className="builder">
        {error && <div className="alert error">{error}</div>}

        {survey.questions.map((q, i) => (
          <article className="panel question-card" key={q.id}>
            <h3>Question {i + 1}</h3>
            <p className="question-text">{q.body}</p>

            {q.type === 'text' && (
              <textarea rows="3" value={answers[q.id] || ''} onChange={(e) => setText(q.id, e.target.value)} placeholder="Votre réponse..." />
            )}

            {q.type === 'single' && (
              <div className="choice-options single-column">
                {q.options.map((opt) => (
                  <label className={`answer-option ${answers[q.id] === opt ? 'selected' : ''}`} key={opt}>
                    <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt} onChange={() => setSingle(q.id, opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'multiple' && (
              <div className="choice-options single-column">
                {q.options.map((opt) => {
                  const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                  return (
                    <label className={`answer-option ${checked ? 'selected' : ''}`} key={opt}>
                      <input type="checkbox" checked={checked} onChange={() => toggleMulti(q.id, opt)} />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </article>
        ))}

        <div className="builder-actions">
          <button className="primary-btn" disabled={loading}><FontAwesomeIcon icon={faPaperPlane} /> {loading ? 'Envoi...' : 'Envoyer mes réponses'}</button>
        </div>
      </form>
    </div>
  );
}
