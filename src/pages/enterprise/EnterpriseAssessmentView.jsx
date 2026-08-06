import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowTrendUp, faCalendarDays, faChartLine, faClipboardCheck, faLightbulb, faPenToSquare, faUserTie } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import { formatAssessmentType, formatDate, signedScore } from '../../utils/enterprise.js';

export default function EnterpriseAssessmentView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/enterprise/assessments/${id}`)
      .then((response) => setData(response.data))
      .catch((err) => setError(getApiError(err)));
  }, [id]);

  const responsesByKey = useMemo(() => Object.fromEntries((data?.assessment?.responses || []).map((response) => [response.question_key, response])), [data]);

  if (!data && !error) return <div className="page"><div className="panel">Chargement...</div></div>;
  if (error) return <div className="page"><div className="alert error">{error}</div></div>;

  const { assessment, template, comparison } = data;

  return (
    <div className="page enterprise-page mindset-view-page">
      <div className="page-header">
        <div>
          <Link className="back-link" to="/entreprise/diagnostics"><FontAwesomeIcon icon={faArrowLeft} /> Retour aux diagnostics</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardCheck} /> {formatAssessmentType(assessment.type)}</span>
          <h1>{assessment.employee?.full_name}</h1>
          <p>{[assessment.employee?.job_title, assessment.employee?.department].filter(Boolean).join(' · ') || 'Fonction et service non renseignés'} · Entretien mené par {assessment.evaluator?.name || '—'} · Méthode v{assessment.methodology_version || template.version || '—'}.</p>
        </div>
        <div className="header-actions"><Link className="primary-btn" to={`/entreprise/diagnostics/${assessment.id}/modifier`}><FontAwesomeIcon icon={faPenToSquare} /> Modifier</Link></div>
      </div>

      <section className="mindset-result-hero panel">
        <div className="mindset-result-score"><span>Score global</span><strong>{assessment.total_score}<small>/100</small></strong></div>
        <div><span className="status-pill completed">{assessment.level}</span><p>Diagnostic réalisé le {formatDate(assessment.assessed_at)}.</p></div>
        {assessment.next_review_at && <div><FontAwesomeIcon icon={faCalendarDays} /><span>Prochain suivi</span><strong>{formatDate(assessment.next_review_at)}</strong></div>}
      </section>

      {comparison && (
        <section className="panel mindset-comparison">
          <div className="panel-heading">
            <div><h2><FontAwesomeIcon icon={faArrowTrendUp} /> Progression T0 / suivi</h2><p>Comparaison avec le diagnostic initial du {formatDate(comparison.baseline.assessed_at)}, soit {comparison.elapsed_days} jours avant ce suivi.</p></div>
            <strong className={comparison.delta >= 0 ? 'delta positive' : 'delta negative'}>{signedScore(comparison.delta)} / 100</strong>
          </div>
          <div className="comparison-score-row">
            <span><small>Score T0</small><strong>{comparison.baseline.total_score}/100</strong></span>
            <FontAwesomeIcon icon={faArrowTrendUp} />
            <span><small>Score de suivi</small><strong>{comparison.follow_up.total_score}/100</strong></span>
          </div>
          <div className="comparison-pillars">
            {comparison.pillars.map((pillar) => <div key={pillar.key}><strong>{pillar.label}</strong><span>{pillar.baseline_score}/25 → {pillar.score}/25</span><b className={pillar.delta >= 0 ? 'positive' : 'negative'}>{signedScore(pillar.delta)}</b></div>)}
          </div>
        </section>
      )}

      <section className="mindset-readonly-list">
        {template.pillars.map((pillar, index) => {
          const score = pillar.questions.reduce((total, question) => total + (responsesByKey[question.key]?.score || 0), 0);
          return (
            <article className="panel mindset-readonly-pillar" key={pillar.key}>
              <div className="mindset-pillar-header"><div><span>Pilier {index + 1}</span><h2>{pillar.label}</h2></div><strong>{score} <small>/25</small></strong></div>
              {pillar.questions.map((question) => {
                const response = responsesByKey[question.key];
                return (
                  <div className="mindset-readonly-response" key={question.key}>
                    <div className="mindset-question-heading"><span>{question.label}</span><h3>{question.body}</h3></div>
                    <div><span className="mindset-readonly-score">{response?.score || '—'}<small>/5</small></span><p>{response?.observation || 'Aucune observation saisie.'}</p></div>
                  </div>
                );
              })}
            </article>
          );
        })}
      </section>

      <section className="grid-two mindset-summary-grid">
        <article className="panel"><h2><FontAwesomeIcon icon={faLightbulb} /> Plan d’action</h2>{assessment.action_items?.length ? <ol className="action-items">{assessment.action_items.map((item) => <li key={item}>{item}</li>)}</ol> : <div className="empty">Aucune action concrète n’a été enregistrée.</div>}</article>
        <article className="panel"><h2><FontAwesomeIcon icon={faUserTie} /> Appuis et besoins</h2><p className="mindset-support-needs">{assessment.support_needs || 'Aucun besoin particulier n’a été renseigné.'}</p><Link className="text-link" to="/entreprise/suivi"><FontAwesomeIcon icon={faChartLine} /> Voir le suivi de progression</Link></article>
      </section>
    </div>
  );
}
