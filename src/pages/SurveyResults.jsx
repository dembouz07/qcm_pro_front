import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCalendarDays,
  faChartColumn,
  faCheck,
  faClipboardQuestion,
  faCopy,
  faFileExcel,
  faFilePdf,
  faLink,
  faLock,
  faLockOpen,
  faPen,
  faShareNodes,
  faTrash,
  faUserSecret,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import api, { getApiError } from '../api.js';
import { useDialog } from '../components/DialogProvider.jsx';

const QUESTIONS_PER_BATCH = 3;

function chunk(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) => (
    array.slice(index * size, index * size + size)
  ));
}

function hasAnswer(value) {
  return Array.isArray(value) ? value.length > 0 : value != null && String(value).trim() !== '';
}

function formatSubmittedAt(value) {
  if (!value) return 'Date non disponible';

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function AnswerValue({ value }) {
  if (!hasAnswer(value)) return <span className="survey-no-answer">Sans réponse</span>;

  if (Array.isArray(value)) {
    return (
      <div className="survey-answer-tags">
        {value.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
      </div>
    );
  }

  return <p>{value}</p>;
}

export default function SurveyResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dialog = useDialog();
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = () => api.get(`/admin/surveys/${id}`).then((r) => setSurvey(r.data)).catch((e) => setError(getApiError(e)));
  useEffect(() => { load(); }, [id]);

  const link = useMemo(
    () => (survey ? `${window.location.origin}/sondage/${survey.access_token}` : ''),
    [survey],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* Clipboard unavailable. The input remains selectable. */ }
  }

  async function toggle() {
    const r = await api.post(`/admin/surveys/${id}/toggle`);
    setSurvey((current) => ({ ...current, is_open: r.data.is_open }));
  }

  function exportExcel() {
    const responses = survey.responses || [];
    const questions = survey.questions || [];
    if (responses.length === 0) return;

    const rows = responses.map((response, index) => {
      const row = {
        '#': index + 1,
        Date: response.submitted_at ? new Date(response.submitted_at).toLocaleString('fr-FR') : '',
      };

      questions.forEach((question, questionIndex) => {
        const value = response.answers?.[question.id];
        row[`Q${questionIndex + 1}. ${question.body}`] = Array.isArray(value) ? value.join(', ') : (value ?? '');
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 5 }, { wch: 20 }, ...questions.map(() => ({ wch: 34 }))];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Réponses');
    XLSX.writeFile(workbook, `sondage-${(survey.title || 'export').replace(/[^\w-]+/g, '_')}.xlsx`);
  }

  async function remove() {
    const ok = await dialog.confirm({
      title: 'Supprimer le sondage',
      message: 'Cette action est irréversible. Continuer ?',
      confirmText: 'Supprimer',
      danger: true,
    });
    if (!ok) return;

    await api.delete(`/admin/surveys/${id}`);
    navigate('/admin/surveys');
  }

  if (error) return <div className="page"><div className="alert error">{error}</div></div>;
  if (!survey) return <div className="center-screen">Chargement...</div>;

  const responses = survey.responses || [];
  const questions = survey.questions || [];
  const questionBatches = chunk(questions, QUESTIONS_PER_BATCH);
  const answeredCount = responses.reduce((total, response) => (
    total + questions.filter((question) => hasAnswer(response.answers?.[question.id])).length
  ), 0);
  const possibleAnswers = responses.length * questions.length;
  const completionRate = possibleAnswers ? Math.round((answeredCount / possibleAnswers) * 100) : 0;

  return (
    <div className="page survey-admin-page">
      <header className="survey-hero">
        <div className="survey-hero-copy">
          <Link to="/admin/surveys" className="back-link no-print">
            <FontAwesomeIcon icon={faArrowLeft} /> Retour aux sondages
          </Link>

          <div className="survey-title-meta">
            <span className="eyebrow"><FontAwesomeIcon icon={faClipboardQuestion} /> Résultats du sondage</span>
            <span className={`survey-status ${survey.is_open ? 'is-open' : 'is-closed'}`}>
              <span aria-hidden="true" /> {survey.is_open ? 'Collecte ouverte' : 'Collecte fermée'}
            </span>
          </div>

          <h1>{survey.title}</h1>
          {survey.description && <p>{survey.description}</p>}
        </div>

        <div className="survey-action-bar no-print" aria-label="Actions du sondage">
          <button className="secondary-btn" onClick={exportExcel} disabled={responses.length === 0}>
            <FontAwesomeIcon icon={faFileExcel} /> Excel
          </button>
          <button className="primary-btn" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faFilePdf} /> Exporter en PDF
          </button>
          <Link className="secondary-btn" to={`/admin/surveys/${id}/edit`}>
            <FontAwesomeIcon icon={faPen} /> Modifier
          </Link>
          <button className="secondary-btn" onClick={toggle}>
            <FontAwesomeIcon icon={survey.is_open ? faLock : faLockOpen} /> {survey.is_open ? 'Fermer' : 'Rouvrir'}
          </button>
          <button className="survey-delete-btn" onClick={remove} aria-label="Supprimer le sondage" title="Supprimer le sondage">
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </header>

      <section className="survey-share-card no-print" aria-labelledby="share-title">
        <div className="survey-share-icon"><FontAwesomeIcon icon={faShareNodes} /></div>
        <div className="survey-share-copy">
          <h2 id="share-title">Inviter des participants</h2>
          <p>Partagez ce lien. Les réponses restent entièrement anonymes.</p>
        </div>
        <div className="survey-share-control">
          <FontAwesomeIcon icon={faLink} />
          <input value={link} readOnly aria-label="Lien public du sondage" onFocus={(event) => event.target.select()} />
          <button className={copied ? 'is-copied' : ''} onClick={copy}>
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} /> {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">{copied ? 'Lien copié dans le presse-papiers' : ''}</span>
      </section>

      {!survey.is_open && (
        <div className="survey-closed-notice no-print">
          <FontAwesomeIcon icon={faLock} />
          <div><strong>Sondage fermé</strong><span>Le lien public reste visible, mais aucune nouvelle réponse ne peut être envoyée.</span></div>
        </div>
      )}

      <section className="survey-kpis" aria-label="Indicateurs du sondage">
        <article className="survey-kpi">
          <span className="survey-kpi-icon is-purple"><FontAwesomeIcon icon={faUsers} /></span>
          <div><small>Participations</small><strong>{responses.length}</strong><span>réponse{responses.length !== 1 ? 's' : ''} reçue{responses.length !== 1 ? 's' : ''}</span></div>
        </article>
        <article className="survey-kpi">
          <span className="survey-kpi-icon is-blue"><FontAwesomeIcon icon={faClipboardQuestion} /></span>
          <div><small>Questionnaire</small><strong>{questions.length}</strong><span>question{questions.length !== 1 ? 's' : ''} au total</span></div>
        </article>
        <article className="survey-kpi">
          <span className="survey-kpi-icon is-green"><FontAwesomeIcon icon={faChartColumn} /></span>
          <div><small>Complétion</small><strong>{completionRate}%</strong><span>des champs renseignés</span></div>
        </article>
      </section>

      {responses.length === 0 ? (
        <section className="survey-empty-state">
          <span><FontAwesomeIcon icon={faUserSecret} /></span>
          <h2>En attente des premières réponses</h2>
          <p>Partagez le lien du sondage pour commencer à recueillir les avis de vos participants.</p>
        </section>
      ) : (
        <>
          <section className="survey-section" aria-labelledby="overview-title">
            <div className="survey-section-heading">
              <div>
                <span className="survey-section-kicker">Vue d’ensemble</span>
                <h2 id="overview-title">Synthèse par question</h2>
                <p>Les questions sont alignées par lots de trois pour une lecture immédiate.</p>
              </div>
              <span className="survey-section-count">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="survey-question-overview">
              {questions.map((question, questionIndex) => {
                const questionAnswers = responses
                  .map((response) => response.answers?.[question.id])
                  .filter(hasAnswer);
                const responseRate = responses.length ? Math.round((questionAnswers.length / responses.length) * 100) : 0;

                return (
                  <article className="survey-question-summary" key={question.id}>
                    <div className="survey-question-summary-head">
                      <span className="survey-question-number">Q{String(questionIndex + 1).padStart(2, '0')}</span>
                      <span className="survey-question-type">
                        {question.type === 'text' ? 'Réponse libre' : question.type === 'multiple' ? 'Choix multiples' : 'Choix unique'}
                      </span>
                    </div>
                    <h3>{question.body}</h3>

                    {question.type === 'text' ? (
                      <div className="survey-contribution-summary">
                        <div><strong>{questionAnswers.length}</strong><span>contribution{questionAnswers.length !== 1 ? 's' : ''}</span></div>
                        <span>{responseRate}% ont répondu</span>
                        <div className="survey-mini-track"><span style={{ width: `${responseRate}%` }} /></div>
                      </div>
                    ) : (
                      <div className="survey-option-results">
                        {(question.options || []).map((option) => {
                          const count = responses.filter((response) => {
                            const value = response.answers?.[question.id];
                            return Array.isArray(value) ? value.includes(option) : value === option;
                          }).length;
                          const percentage = responses.length ? Math.round((count / responses.length) * 100) : 0;

                          return (
                            <div className="survey-option-result" key={option}>
                              <div><span>{option}</span><strong>{percentage}% <small>({count})</small></strong></div>
                              <div className="survey-mini-track"><span style={{ width: `${percentage}%` }} /></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="survey-section survey-responses-section" aria-labelledby="responses-title">
            <div className="survey-section-heading">
              <div>
                <span className="survey-section-kicker">Détail anonyme</span>
                <h2 id="responses-title">Réponses individuelles</h2>
                <p>Chaque participation conserve ses trois réponses ensemble.</p>
              </div>
              <span className="survey-section-count">{responses.length} participation{responses.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="survey-responses-list">
              {responses.map((response, responseIndex) => (
                <article className="survey-response-card" key={response.id ?? responseIndex}>
                  <header className="survey-response-head">
                    <div className="survey-respondent">
                      <span className="survey-avatar"><FontAwesomeIcon icon={faUserSecret} /></span>
                      <div>
                        <span>Participation {String(responseIndex + 1).padStart(2, '0')}</span>
                        <strong>Participant anonyme</strong>
                      </div>
                    </div>
                    <time dateTime={response.submitted_at || undefined}>
                      <FontAwesomeIcon icon={faCalendarDays} /> {formatSubmittedAt(response.submitted_at)}
                    </time>
                  </header>

                  {questionBatches.map((batch, batchIndex) => (
                    <div className="survey-answer-batch" key={batchIndex}>
                      {questionBatches.length > 1 && (
                        <div className="survey-batch-label">
                          Questions {batchIndex * QUESTIONS_PER_BATCH + 1} à {batchIndex * QUESTIONS_PER_BATCH + batch.length}
                        </div>
                      )}
                      <div className="survey-answer-grid">
                        {batch.map((question) => {
                          const questionIndex = questions.findIndex((item) => item.id === question.id);
                          return (
                            <div className="survey-answer-card" key={question.id}>
                              <div className="survey-answer-question">
                                <span>Q{String(questionIndex + 1).padStart(2, '0')}</span>
                                <h3>{question.body}</h3>
                              </div>
                              <div className="survey-answer-value">
                                <AnswerValue value={response.answers?.[question.id]} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
