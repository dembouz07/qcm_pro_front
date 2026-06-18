import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLayerGroup, 
  faEdit, 
  faTrash, 
  faEye, 
  faCirclePlus,
  faFileImport,
  faCheckCircle,
  faTimesCircle,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { formatDateTime } from '../utils/time.js';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Recharger automatiquement toutes les 30 secondes pour voir les mises à jour
  useEffect(() => {
    const interval = setInterval(() => {
      loadQuizzes();
    }, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, []);

  async function loadQuizzes() {
    try {
      const response = await api.get('/admin/quizzes');
      setQuizzes(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuiz(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce QCM ?')) return;
    
    try {
      await api.delete(`/admin/quizzes/${id}`);
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err) {
      alert(getApiError(err));
    }
  }

  function getStatusBadge(quiz) {
    const now = new Date();
    const startsAt = new Date(quiz.starts_at);
    const endsAt = quiz.ends_at ? new Date(quiz.ends_at) : null;

    if (!quiz.is_published) {
      return <span className="badge badge-draft"><FontAwesomeIcon icon={faCircle} /> Brouillon</span>;
    }
    
    if (now < startsAt) {
      return <span className="badge badge-locked"><FontAwesomeIcon icon={faTimesCircle} /> Verrouillé</span>;
    }
    
    if (endsAt && now > endsAt) {
      return <span className="badge badge-closed"><FontAwesomeIcon icon={faTimesCircle} /> Fermé</span>;
    }
    
    return <span className="badge badge-open"><FontAwesomeIcon icon={faCheckCircle} /> Ouvert</span>;
  }

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faLayerGroup} /> QCM</span>
          <h1>Gestion des QCM</h1>
          <p>Consultez, modifiez et supprimez vos questionnaires.</p>
        </div>
        <div className="header-actions">
          <Link className="primary-btn" to="/admin/quizzes/new">
            <FontAwesomeIcon icon={faCirclePlus} /> Nouveau QCM
          </Link>
          <Link className="secondary-btn" to="/admin/quizzes/import">
            <FontAwesomeIcon icon={faFileImport} /> Importer
          </Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Classe</th>
                <th>Questions</th>
                <th>Soumissions</th>
                <th>Date d'ouverture</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    Aucun QCM pour le moment. Créez-en un ou importez un fichier.
                  </td>
                </tr>
              ) : (
                quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td>
                      <strong>{quiz.title}</strong>
                      {quiz.description && (
                        <small className="text-muted">{quiz.description.substring(0, 50)}...</small>
                      )}
                    </td>
                    <td>{quiz.school_class?.name || '-'}</td>
                    <td>{quiz.questions_count || 0}</td>
                    <td>{quiz.submissions_count || 0}</td>
                    <td>{formatDateTime(quiz.starts_at)}</td>
                    <td>{getStatusBadge(quiz)}</td>
                    <td className="actions">
                      <Link to={`/admin/quizzes/${quiz.id}`} className="icon-btn" title="Voir les détails">
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      <Link to={`/admin/quizzes/${quiz.id}/edit`} className="icon-btn" title="Modifier">
                        <FontAwesomeIcon icon={faEdit} />
                      </Link>
                      <button 
                        onClick={() => deleteQuiz(quiz.id)} 
                        className="icon-btn danger" 
                        title="Supprimer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
