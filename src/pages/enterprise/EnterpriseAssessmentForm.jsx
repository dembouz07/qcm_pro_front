import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCircleCheck, faClipboardCheck, faFloppyDisk, faLightbulb, faUserTie } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import { addMonthsToDateValue, ASSESSMENT_TYPE_LABELS, todayInputValue } from '../../utils/enterprise.js';

function createResponseState(template, storedResponses = []) {
  const storedByKey = Object.fromEntries(storedResponses.map((response) => [response.question_key, response]));
  const state = {};

  (template?.pillars || []).forEach((pillar) => {
    pillar.questions.forEach((question) => {
      const stored = storedByKey[question.key];
      state[question.key] = {
        score: stored?.score ? String(stored.score) : '',
        observation: stored?.observation || '',
      };
    });
  });

  return state;
}

function actionItems(items = []) {
  return [...items, '', '', ''].slice(0, 3);
}

export default function EnterpriseAssessmentForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [employees, setEmployees] = useState([]);
  const today = todayInputValue();
  const [form, setForm] = useState({
    company_employee_id: params.get('employee') || '',
    type: 'initial',
    assessed_at: today,
    action_items: ['', '', ''],
    support_needs: '',
    next_review_at: addMonthsToDateValue(today, 6),
  });
  const [responses, setResponses] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const assessmentStartedRef = useRef(false);

  useEffect(() => {
    const requests = [api.get('/enterprise/mindset-template'), api.get('/enterprise/employees')];
    if (editing) requests.push(api.get(`/enterprise/assessments/${id}`));

    Promise.all(requests)
      .then((result) => {
        const nextTemplate = editing ? result[2].data.template : result[0].data;
        setTemplate(nextTemplate);
        setEmployees(result[1].data);

        if (editing) {
          const assessment = result[2].data.assessment;
          setForm({
            company_employee_id: String(assessment.company_employee_id),
            type: assessment.type,
            assessed_at: String(assessment.assessed_at).slice(0, 10),
            action_items: actionItems(assessment.action_items),
            support_needs: assessment.support_needs || '',
            next_review_at: assessment.next_review_at ? String(assessment.next_review_at).slice(0, 10) : '',
          });
          setResponses(createResponseState(nextTemplate, assessment.responses));
        } else {
          setResponses(createResponseState(nextTemplate));
        }
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const totalScore = useMemo(() => Object.values(responses).reduce((total, response) => total + (Number(response.score) || 0), 0), [responses]);
  const interpretation = template?.interpretations?.find((item) => totalScore >= item.min && totalScore <= item.max);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'assessed_at' && current.type === 'initial' ? { next_review_at: addMonthsToDateValue(value, 6) } : {}),
    }));
  }

  function updateResponse(questionKey, field, value) {
    if (!editing && !assessmentStartedRef.current && form.company_employee_id) {
      assessmentStartedRef.current = true;
      void api.post('/events', {
        event: 'assessment_started',
        subject_id: Number(form.company_employee_id),
      }).catch(() => {});
    }

    setResponses((current) => ({
      ...current,
      [questionKey]: { ...current[questionKey], [field]: value },
    }));
  }

  function updateAction(index, value) {
    setForm((current) => ({
      ...current,
      action_items: current.action_items.map((item, actionIndex) => actionIndex === index ? value : item),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!form.company_employee_id) {
      setError('Sélectionnez le collaborateur concerné par cet entretien.');
      return;
    }

    if (Object.values(responses).some((response) => !response.score)) {
      setError('Attribuez une note de 1 à 5 aux 20 questions avant d’enregistrer le diagnostic.');
      return;
    }

    setSaving(true);
    const payload = {
      company_employee_id: Number(form.company_employee_id),
      type: form.type,
      assessed_at: form.assessed_at,
      responses: Object.entries(responses).map(([question_key, response]) => ({
        question_key,
        score: Number(response.score),
        observation: response.observation.trim() || null,
      })),
      action_items: form.action_items.filter((item) => item.trim()),
      support_needs: form.support_needs.trim() || null,
      next_review_at: form.next_review_at || null,
    };

    try {
      const response = editing
        ? await api.put(`/enterprise/assessments/${id}`, payload)
        : await api.post('/enterprise/assessments', payload);
      navigate(`/entreprise/diagnostics/${response.data.id}`);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page"><div className="panel">Chargement de la grille Mindset...</div></div>;

  if (!template) return <div className="page"><div className="alert error">La grille Mindset est indisponible.</div></div>;

  return (
    <div className="page enterprise-page mindset-form-page">
      <div className="page-header">
        <div>
          <Link className="back-link" to="/entreprise/diagnostics"><FontAwesomeIcon icon={faArrowLeft} /> Retour aux diagnostics</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardCheck} /> Grille d’entretien individuel</span>
          <h1>{editing ? 'Modifier le diagnostic Mindset' : 'Nouveau diagnostic Mindset'}</h1>
          <p>La version de grille utilisée au T0 est conservée pour comparer un suivi visé autour de six mois.</p>
        </div>
      </div>

      <form className="mindset-form" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}

        <section className="panel form-grid">
          <label className="span-2">
            Collaborateur
            <div className="input-icon">
              <FontAwesomeIcon icon={faUserTie} />
              <select value={form.company_employee_id} onChange={(event) => updateForm('company_employee_id', event.target.value)} required>
                <option value="">Sélectionnez un collaborateur</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name} · {employee.job_title || 'Fonction non renseignée'}</option>)}
              </select>
            </div>
          </label>
          <label>
            Type d’entretien
            <select value={form.type} onChange={(event) => updateForm('type', event.target.value)}>
              {Object.entries(ASSESSMENT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            Date de l’entretien
            <input type="date" value={form.assessed_at} onChange={(event) => updateForm('assessed_at', event.target.value)} required />
          </label>
        </section>

        <section className="mindset-score-scale panel">
          <h2><FontAwesomeIcon icon={faLightbulb} /> Échelle de notation</h2>
          <div>{template.score_scale.map((item) => <span key={item.score}><b>{item.score}</b><strong>{item.label}</strong><small>{item.description}</small></span>)}</div>
        </section>

        {template.pillars.map((pillar, pillarIndex) => {
          const pillarScore = pillar.questions.reduce((total, question) => total + (Number(responses[question.key]?.score) || 0), 0);
          return (
            <section className="mindset-pillar panel" key={pillar.key}>
              <div className="mindset-pillar-header">
                <div><span>Pilier {pillarIndex + 1}</span><h2>{pillar.label}</h2></div>
                <strong>{pillarScore} <small>/ 25</small></strong>
              </div>
              <div className="mindset-question-list">
                {pillar.questions.map((question) => (
                  <article className="mindset-question" key={question.key}>
                    <div className="mindset-question-heading"><span>{question.label}</span><h3>{question.body}</h3></div>
                    <div className="mindset-answer-grid">
                      <div className="mindset-score-selector" aria-label={`Note pour la question ${question.label}`}>
                        {[1, 2, 3, 4, 5].map((score) => (
                          <label className={Number(responses[question.key]?.score) === score ? 'selected' : ''} key={score}>
                            <input type="radio" name={`score-${question.key}`} value={score} checked={Number(responses[question.key]?.score) === score} onChange={(event) => updateResponse(question.key, 'score', event.target.value)} />
                            <span>{score}</span>
                          </label>
                        ))}
                      </div>
                      <label>
                        Verbatim / observations
                        <textarea value={responses[question.key]?.observation || ''} onChange={(event) => updateResponse(question.key, 'observation', event.target.value)} rows="3" placeholder="Exemples concrets, verbatim ou faits observés" />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
              <details className="mindset-followups"><summary>Questions de relance possibles</summary><ul>{pillar.follow_ups.map((question) => <li key={question}>{question}</li>)}</ul></details>
            </section>
          );
        })}

        <section className="mindset-total panel">
          <div><span>Score global</span><strong>{totalScore} <small>/ 100</small></strong></div>
          <div>{interpretation ? <><strong>{interpretation.label}</strong><p>{interpretation.recommendation}</p></> : <p>Renseignez les 20 notes pour obtenir la posture d’accompagnement recommandée.</p>}</div>
        </section>

        <section className="panel form-grid mindset-action-plan">
          <div className="span-2"><span className="eyebrow">Plan d’action</span><h2>Engagements et suivi</h2><p>Définissez jusqu’à trois actions concrètes avant le prochain point.</p></div>
          {form.action_items.map((item, index) => <label className="span-2" key={index}>Action {index + 1}<input value={item} onChange={(event) => updateAction(index, event.target.value)} placeholder="Ex. Mettre en place une action concrète" /></label>)}
          <label className="span-2">Appuis ou besoins exprimés<textarea value={form.support_needs} onChange={(event) => updateForm('support_needs', event.target.value)} rows="3" placeholder="Appui du manager, formation, ressources ou conditions nécessaires" /></label>
          <label>Date du prochain entretien de suivi<input type="date" value={form.next_review_at} onChange={(event) => updateForm('next_review_at', event.target.value)} /></label>
        </section>

        <div className="builder-actions">
          <Link className="secondary-btn" to="/entreprise/diagnostics"><FontAwesomeIcon icon={faArrowLeft} /> Annuler</Link>
          <button className="primary-btn" disabled={saving}><FontAwesomeIcon icon={saving ? faCircleCheck : faFloppyDisk} /> {saving ? 'Enregistrement...' : editing ? 'Enregistrer les modifications' : 'Enregistrer le diagnostic'}</button>
        </div>
      </form>
    </div>
  );
}
