import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEdit, 
  faTrash,
  faArrowLeft,
  faCheckCircle,
  faTimesCircle,
  faCalendarDays,
  faLayerGroup,
  faUsers,
  faLink,
  faCopy,
  faPaperPlane,
  faTriangleExclamation,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useDialog } from '../components/DialogProvider.jsx';
import { formatDateTime } from '../utils/time.js';
import { useAuth } from '../AuthContext.jsx';

export default function QuizView() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm, alert } = useDialog();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [stats, setStats] = useState(null);
  const canSeeWrongStats = user?.is_super_admin || (user?.plan_features || []).includes('wrong_question_stats');

  useEffect(() => {
    loadQuiz();
    if (canSeeWrongStats) {
      api.get(`/admin/quizzes/${id}/stats`).then((r) => setStats(r.data)).catch(() => {});
    }
  }, [id, canSeeWrongStats]);

  async function loadQuiz() {
    try {
      const response = await api.get(`/admin/quizzes/${id}`);
      setQuiz(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuiz() {
    const ok = await confirm({
      title: 'Supprimer le QCM',
      message: 'Êtes-vous sûr de vouloir supprimer ce QCM ? Cette action est irréversible.',
      confirmText: 'Supprimer',
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/quizzes/${id}`);
      navigate('/admin/quizzes');
    } catch (err) {
      alert({ title: 'Erreur', message: getApiError(err), variant: 'error' });
    }
  }

  async function notifyStudents() {
    const ok = await confirm({
      title: 'Notifier les élèves',
      message: 'Envoyer un email à tous les élèves de la classe pour les informer de ce QCM ?',
      confirmText: 'Envoyer',
      danger: false,
    });
    if (!ok) return;
    setNotifying(true);
    try {
      const response = await api.post(`/admin/quizzes/${id}/notify`);
      await alert({ title: 'Notification envoyée', message: response.data.message });
    } catch (err) {
      await alert({ title: 'Erreur', message: getApiError(err), variant: 'error' });
    } finally {
      setNotifying(false);
    }
  }

  function getPublicLink() {
    if (!quiz?.access_token) return null;
    return `${window.location.origin}/quiz/${quiz.access_token}`;
  }

  function copyLink() {
    const link = getPublicLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function exportStatsPdf() {
    const questions = stats?.questions || [];
    if (!quiz || questions.length === 0) return;

    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[character]));

    const totals = questions.reduce((summary, question) => ({
      answered: summary.answered + Number(question.answered || 0),
      wrong: summary.wrong + Number(question.wrong || 0),
      unanswered: summary.unanswered + Number(question.unanswered || 0),
      expected: summary.expected + Number(question.total || 0),
    }), { answered: 0, wrong: 0, unanswered: 0, expected: 0 });

    const globalWrongRate = totals.answered > 0
      ? Math.round((totals.wrong / totals.answered) * 100)
      : 0;
    const globalUnansweredRate = totals.expected > 0
      ? Math.round((totals.unanswered / totals.expected) * 100)
      : 0;

    const rows = questions.map((question, index) => `
      <tr>
        <td class="rank">${index + 1}</td>
        <td class="question">${escapeHtml(question.body)}</td>
        <td>${Number(question.answered || 0)}</td>
        <td>${Number(question.wrong || 0)}</td>
        <td class="wrong-rate">${Number(question.wrong_rate || 0)}%</td>
        <td>${Number(question.unanswered || 0)}</td>
        <td class="unanswered-rate">${Number(question.unanswered_rate || 0)}%</td>
      </tr>
    `).join('');

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert({
        title: 'Export PDF bloqué',
        message: "Autorisez les fenêtres contextuelles pour télécharger le rapport PDF.",
        variant: 'error',
      });
      return;
    }

    reportWindow.opener = null;
    reportWindow.document.write(`<!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Analyse QCM - ${escapeHtml(quiz.title)}</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #172033; font-family: Arial, sans-serif; font-size: 11px; }
            header { border-bottom: 3px solid #5b5cf6; margin-bottom: 16px; padding-bottom: 12px; }
            h1 { font-size: 21px; margin: 0 0 6px; }
            .meta { color: #68748a; margin: 0; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
            .summary-card { border: 1px solid #dfe4ee; border-radius: 9px; padding: 10px 12px; }
            .summary-card span { color: #68748a; display: block; font-size: 10px; margin-bottom: 4px; }
            .summary-card strong { font-size: 18px; }
            .summary-card.wrong strong { color: #dc2626; }
            .summary-card.unanswered strong { color: #64748b; }
            table { border-collapse: collapse; width: 100%; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            th { background: #5b5cf6; color: #fff; padding: 8px 7px; text-align: left; }
            td { border-bottom: 1px solid #dfe4ee; padding: 8px 7px; vertical-align: top; }
            tbody tr:nth-child(even) { background: #f6f7fb; }
            .rank { text-align: center; width: 34px; }
            .question { font-weight: 600; max-width: 390px; white-space: pre-wrap; }
            .wrong-rate { color: #dc2626; font-weight: 700; }
            .unanswered-rate { color: #64748b; font-weight: 700; }
            footer { color: #7b8498; font-size: 9px; margin-top: 12px; text-align: right; }
          </style>
        </head>
        <body>
          <header>
            <h1>Analyse des réponses — ${escapeHtml(quiz.title)}</h1>
            <p class="meta">
              Classe : ${escapeHtml(quiz.school_class?.name || 'Non renseignée')}
              · ${Number(stats.submissions || 0)} soumission(s)
              · Exporté le ${escapeHtml(new Date().toLocaleString('fr-FR'))}
            </p>
          </header>
          <section class="summary">
            <div class="summary-card"><span>Questions analysées</span><strong>${questions.length}</strong></div>
            <div class="summary-card"><span>Réponses données</span><strong>${totals.answered}</strong></div>
            <div class="summary-card wrong"><span>Taux global de réponses fausses</span><strong>${globalWrongRate}%</strong></div>
            <div class="summary-card unanswered"><span>Taux global de non-réponse</span><strong>${globalUnansweredRate}%</strong></div>
          </section>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Réponses données</th>
                <th>Fausses</th>
                <th>% fausses</th>
                <th>Non répondues</th>
                <th>% non répondues</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <footer>QCM Pro — Rapport d'analyse des réponses</footer>
          <script>window.onload = function () { window.print(); };<\/script>
        </body>
      </html>`);
    reportWindow.document.close();
  }

  function getStatusBadge(quiz) {
    const now = new Date();
    const startsAt = new Date(quiz.starts_at);
    const endsAt = quiz.ends_at ? new Date(quiz.ends_at) : null;

    if (!quiz.is_published) {
      return <span className="badge badge-draft">Brouillon</span>;
    }
    
    if (now < startsAt) {
      return <span className="badge badge-locked">Verrouillé</span>;
    }
    
    if (endsAt && now > endsAt) {
      return <span className="badge badge-closed">Fermé</span>;
    }
    
    return <span className="badge badge-open">Ouvert</span>;
  }

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;
  if (error) return <div className="page"><div className="alert error">{error}</div></div>;
  if (!quiz) return <div className="page"><div className="panel">QCM introuvable</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/admin/quizzes" className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} /> Retour à la liste
          </Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faEye} /> Visualisation</span>
          <h1>{quiz.title}</h1>
          <p>{quiz.description || 'Aucune description'}</p>
        </div>
        <div className="header-actions">
          <button onClick={notifyStudents} className="secondary-btn" disabled={notifying}>
            <FontAwesomeIcon icon={faPaperPlane} /> {notifying ? 'Envoi...' : 'Notifier par email'}
          </button>
          <Link to={quiz.type === 'progressive' ? `/admin/quizzes/${quiz.id}/progressive/edit` : `/admin/quizzes/${quiz.id}/edit`} className="primary-btn">
            <FontAwesomeIcon icon={faEdit} /> Modifier
          </Link>
          <button onClick={deleteQuiz} className="danger-btn">
            <FontAwesomeIcon icon={faTrash} /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid-two">
        <div className="panel">
          <h2>Informations</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Statut</span>
              {getStatusBadge(quiz)}
            </div>
            <div className="info-item">
              <span className="info-label"><FontAwesomeIcon icon={faLayerGroup} /> Classe</span>
              <span>{quiz.school_class?.name || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label"><FontAwesomeIcon icon={faCalendarDays} /> Ouverture</span>
              <span>{formatDateTime(quiz.starts_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label"><FontAwesomeIcon icon={faCalendarDays} /> Fermeture</span>
              <span>{quiz.ends_at ? formatDateTime(quiz.ends_at) : 'Pas de limite'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Questions</span>
              <span>{quiz.questions?.length || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-label"><FontAwesomeIcon icon={faUsers} /> Soumissions</span>
              <span>{quiz.submissions_count || 0}</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2><FontAwesomeIcon icon={faLink} /> Lien de partage</h2>
          <p>Envoyez ce lien aux participants pour qu'ils accèdent au QCM :</p>
          {getPublicLink() ? (
            <div className="share-link-box">
              <input 
                type="text" 
                value={getPublicLink()} 
                readOnly 
                className="share-link-input"
                onClick={(e) => e.target.select()}
              />
              <button type="button" className="primary-btn" onClick={copyLink}>
                <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          ) : (
            <p className="muted">Aucun lien disponible.</p>
          )}

          <h2 style={{marginTop: '1.5rem'}}>Statistiques</h2>
          <div className="stats-list">
            <div className="stat-item">
              <span>Total de points</span>
              <strong>{quiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0}</strong>
            </div>
            <div className="stat-item">
              <span>Total de choix</span>
              <strong>{quiz.questions?.reduce((sum, q) => sum + (q.choices?.length || 0), 0) || 0}</strong>
            </div>
            <div className="stat-item">
              <span>Publié</span>
              <strong>{quiz.is_published ? 'Oui' : 'Non'}</strong>
            </div>
          </div>
        </div>
      </div>

      {stats && stats.submissions > 0 && (
        <div className="panel">
          <div className="question-analysis-header">
            <h2><FontAwesomeIcon icon={faTriangleExclamation} /> Analyse des réponses par question</h2>
            <button type="button" className="secondary-btn no-print" onClick={exportStatsPdf}>
              <FontAwesomeIcon icon={faFilePdf} /> Exporter en PDF
            </button>
          </div>
          <p className="muted">
            Le taux de réponses fausses est calculé uniquement parmi les réponses données. Les non-réponses sont présentées séparément sur {stats.submissions} soumission(s).
          </p>
          <div className="failed-list">
            {stats.questions.map((q, i) => (
              <div className="failed-item" key={q.id}>
                <div className="failed-rank">{i + 1}</div>
                <div className="failed-analysis">
                  <div className="failed-body">{q.body}</div>
                  <div className="failed-metrics">
                    <div className="failed-metric wrong">
                      <div className="failed-metric-head">
                        <span>{q.wrong} fausse(s) sur {q.answered} réponse(s)</span>
                        <strong>{q.wrong_rate}%</strong>
                      </div>
                      <div className="failed-bar-track">
                        <div className="failed-bar-fill" style={{ width: `${q.wrong_rate}%` }} />
                      </div>
                    </div>
                    <div className="failed-metric unanswered">
                      <div className="failed-metric-head">
                        <span>{q.unanswered} non répondue(s) sur {q.total}</span>
                        <strong>{q.unanswered_rate}%</strong>
                      </div>
                      <div className="failed-bar-track">
                        <div className="failed-bar-fill unanswered" style={{ width: `${q.unanswered_rate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h2>Questions ({quiz.questions?.length || 0})</h2>
        {!quiz.questions || quiz.questions.length === 0 ? (
          <div className="empty">Aucune question</div>
        ) : (
          <div className="questions-view">
            {quiz.questions.map((question, index) => (
              <div key={index} className="question-view-card">
                <div className="question-view-header">
                  <h3>Question {index + 1}</h3>
                  <span className="badge">{question.points || 1} point{question.points > 1 ? 's' : ''}</span>
                </div>
                <p className="question-text">{question.body}</p>
                <div className="choices-view">
                  {question.choices?.map((choice, cIndex) => (
                    <div 
                      key={cIndex} 
                      className={`choice-view ${choice.is_correct ? 'correct' : ''}`}
                    >
                      {choice.is_correct ? (
                        <FontAwesomeIcon icon={faCheckCircle} className="correct-icon" />
                      ) : (
                        <FontAwesomeIcon icon={faTimesCircle} className="incorrect-icon" />
                      )}
                      <span>{choice.body}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
