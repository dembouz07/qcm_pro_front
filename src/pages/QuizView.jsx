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
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useDialog } from '../components/DialogProvider.jsx';
import { formatDateTime } from '../utils/time.js';

export default function QuizView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm, alert } = useDialog();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadQuiz();
    api.get(`/admin/quizzes/${id}/stats`).then((r) => setStats(r.data)).catch(() => {});
  }, [id]);

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
          <h2><FontAwesomeIcon icon={faTriangleExclamation} /> Questions les plus ratées</h2>
          <p className="muted">Basé sur {stats.submissions} soumission(s). Utile pour repérer les questions à revoir.</p>
          <div className="failed-list">
            {stats.questions.filter((q) => q.total > 0).map((q, i) => (
              <div className="failed-item" key={q.id}>
                <div className="failed-rank">{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="failed-body">{q.body}</div>
                  <div className="failed-bar-track">
                    <div className="failed-bar-fill" style={{ width: `${q.wrong_rate}%` }} />
                  </div>
                </div>
                <div className="failed-stat">
                  <strong>{q.wrong}</strong> ratée(s)
                  <small>{q.wrong_rate}% · {q.total} réponse(s)</small>
                </div>
              </div>
            ))}
            {stats.questions.every((q) => q.total === 0) && <p className="muted">Aucune réponse enregistrée pour l'instant.</p>}
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
