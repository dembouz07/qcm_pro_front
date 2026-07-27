import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup, faEdit, faTrash, faEye, faCirclePlus,
  faCheckCircle, faTimesCircle, faCircle, faMagnifyingGlass,
  faBoxArchive, faRotateLeft, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useDialog } from '../components/DialogProvider.jsx';

const PAGE_SIZE = 8;

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { confirm, alert } = useDialog();
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active'); // active | draft | archived
  const [page, setPage] = useState(1);

  useEffect(() => { loadQuizzes(); }, []);

  useEffect(() => {
    const interval = setInterval(loadQuizzes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { setPage(1); }, [search, tab]);

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
    const ok = await confirm({
      title: 'Supprimer le QCM',
      message: 'Êtes-vous sûr de vouloir supprimer ce QCM ? Cette action est irréversible.',
      confirmText: 'Supprimer',
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/quizzes/${id}`);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert({ title: 'Erreur', message: getApiError(err), variant: 'error' });
    }
  }

  async function archiveQuiz(id) {
    try {
      const res = await api.post(`/admin/quizzes/${id}/archive`);
      setQuizzes((prev) => prev.map((q) => (q.id === id ? { ...q, archived_at: res.data.archived_at } : q)));
    } catch (err) {
      alert({ title: 'Erreur', message: getApiError(err), variant: 'error' });
    }
  }

  async function unarchiveQuiz(id) {
    try {
      await api.post(`/admin/quizzes/${id}/unarchive`);
      setQuizzes((prev) => prev.map((q) => (q.id === id ? { ...q, archived_at: null } : q)));
    } catch (err) {
      alert({ title: 'Erreur', message: getApiError(err), variant: 'error' });
    }
  }

  function getStatusBadge(quiz) {
    if (quiz.archived_at) {
      return <span className="badge badge-archived"><FontAwesomeIcon icon={faBoxArchive} /> Archivé</span>;
    }
    if (!quiz.is_published) {
      return <span className="badge badge-draft"><FontAwesomeIcon icon={faCircle} /> Brouillon</span>;
    }
    if (quiz.closed_at) {
      return <span className="badge badge-closed"><FontAwesomeIcon icon={faTimesCircle} /> Fermé</span>;
    }
    const now = new Date();
    const startsAt = new Date(quiz.starts_at);
    const endsAt = quiz.ends_at ? new Date(quiz.ends_at) : null;
    if (now < startsAt) return <span className="badge badge-locked"><FontAwesomeIcon icon={faTimesCircle} /> Verrouillé</span>;
    if (endsAt && now > endsAt) return <span className="badge badge-closed"><FontAwesomeIcon icon={faTimesCircle} /> Fermé</span>;
    return <span className="badge badge-open"><FontAwesomeIcon icon={faCheckCircle} /> Ouvert</span>;
  }

  const counts = useMemo(() => ({
    active: quizzes.filter((q) => !q.archived_at && q.is_published).length,
    draft: quizzes.filter((q) => !q.archived_at && !q.is_published).length,
    archived: quizzes.filter((q) => q.archived_at).length,
  }), [quizzes]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return quizzes
      .filter((q) => {
        if (tab === 'archived') return !!q.archived_at;
        if (tab === 'draft') return !q.archived_at && !q.is_published;
        return !q.archived_at && q.is_published; // active
      })
      .filter((q) => {
        if (!s) return true;
        return (q.title || '').toLowerCase().includes(s)
          || (q.school_class?.name || '').toLowerCase().includes(s);
      });
  }, [quizzes, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TABS = [
    { key: 'active', label: 'Actifs' },
    { key: 'draft', label: 'Brouillons' },
    { key: 'archived', label: 'Archivés' },
  ];

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faLayerGroup} /> QCM</span>
          <h1>Gestion des QCM</h1>
          <p>Consultez, modifiez, archivez et supprimez vos questionnaires.</p>
        </div>
        <div className="header-actions">
          <Link className="primary-btn" to="/admin/quizzes/create">
            <FontAwesomeIcon icon={faCirclePlus} /> Créer un QCM
          </Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="quiz-toolbar">
          <div className="segmented">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`seg-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label} <span className="seg-count">{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <div className="search-box">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              type="text"
              placeholder="Rechercher par titre ou classe"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Classe</th>
                <th>Questions</th>
                <th>Soumissions</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    {search ? 'Aucun QCM ne correspond à votre recherche.' : 'Aucun QCM dans cette catégorie.'}
                  </td>
                </tr>
              ) : (
                pageItems.map((quiz) => (
                  <tr key={quiz.id}>
                    <td>
                      <strong>{quiz.title}</strong>
                      {quiz.description && (
                        <small className="text-muted"> {quiz.description.substring(0, 50)}...</small>
                      )}
                    </td>
                    <td>{quiz.type === 'progressive' ? 'Public' : (quiz.school_class?.name || '-')}</td>
                    <td>{quiz.questions_count || 0}</td>
                    <td>{quiz.submissions_count || 0}</td>
                    <td>{getStatusBadge(quiz)}</td>
                    <td className="actions">
                      <Link to={`/admin/quizzes/${quiz.id}`} className="icon-btn" title="Voir les détails">
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      {!quiz.archived_at && (
                        <Link to={quiz.type === 'progressive' ? `/admin/quizzes/${quiz.id}/progressive/edit` : `/admin/quizzes/${quiz.id}/edit`} className="icon-btn" title="Modifier">
                          <FontAwesomeIcon icon={faEdit} />
                        </Link>
                      )}
                      {quiz.archived_at ? (
                        <button onClick={() => unarchiveQuiz(quiz.id)} className="icon-btn" title="Désarchiver">
                          <FontAwesomeIcon icon={faRotateLeft} />
                        </button>
                      ) : (
                        <button onClick={() => archiveQuiz(quiz.id)} className="icon-btn" title="Archiver">
                          <FontAwesomeIcon icon={faBoxArchive} />
                        </button>
                      )}
                      <button onClick={() => deleteQuiz(quiz.id)} className="icon-btn danger" title="Supprimer">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="icon-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span>Page {page} / {totalPages}</span>
            <button className="icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
