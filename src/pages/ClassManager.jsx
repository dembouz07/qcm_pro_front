import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faPlus, faTrash, faUsers, faChevronRight, faEnvelope, faUserGraduate, faMagnifyingGlass, faKey, faCopy, faChartLine } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useDialog } from '../components/DialogProvider.jsx';

export default function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState('');
  const { confirm } = useDialog();

  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const studentsRef = useRef(null);

  async function loadClasses() {
    const response = await api.get('/admin/classes');
    setClasses(response.data);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function selectClass(classe) {
    setSelectedClass(classe);
    setStudents([]);
    setSearch('');
    setLoadingStudents(true);
    // Sur mobile, faire défiler vers le panneau des étudiants
    if (window.innerWidth <= 980) {
      setTimeout(() => studentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
    try {
      const response = await api.get(`/admin/classes/${classe.id}`);
      setStudents(response.data.students || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoadingStudents(false);
    }
  }

  async function addClass(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/admin/classes', form);
      setForm({ name: '', code: '' });
      await loadClasses();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function removeClass(id) {
    const ok = await confirm({
      title: 'Supprimer la classe',
      message: 'Supprimer cette classe ? Les données associées seront perdues.',
      confirmText: 'Supprimer',
    });
    if (!ok) return;
    await api.delete(`/admin/classes/${id}`);
    if (selectedClass?.id === id) {
      setSelectedClass(null);
      setStudents([]);
    }
    await loadClasses();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faLayerGroup} /> Classes</span>
          <h1>Gestion des classes</h1>
          <p>Sélectionnez une classe pour voir ses étudiants. Chaque QCM doit être attaché à une classe précise.</p>
        </div>
      </div>

      <form className="panel inline-form" onSubmit={addClass}>
        {error && <div className="alert error full">{error}</div>}
        <input placeholder="Nom de la classe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Code (laisser vide = auto)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <button className="primary-btn"><FontAwesomeIcon icon={faPlus} /> Ajouter</button>
      </form>

      <div className="grid-two">
        <div className="panel">
          <h2><FontAwesomeIcon icon={faLayerGroup} /> Classes</h2>
          {classes.length === 0 ? <div className="empty">Aucune classe créée.</div> : (
            <div className="classes-scroll">
              {classes.map((classe) => (
                <div
                  className={`list-item class-row ${selectedClass?.id === classe.id ? 'selected' : ''}`}
                  key={classe.id}
                  onClick={() => selectClass(classe)}
                  role="button"
                >
                  <div>
                    <strong>{classe.name}</strong>
                    <small>Code : {classe.code || '—'} · {classe.quizzes_count || 0} QCM</small>
                  </div>
                  <div className="row-actions">
                    <span className="badge"><FontAwesomeIcon icon={faUsers} /> {classe.users_count || 0} élèves</span>
                    <button
                      className="icon-btn danger"
                      onClick={(e) => { e.stopPropagation(); removeClass(classe.id); }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <FontAwesomeIcon icon={faChevronRight} className="text-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel" ref={studentsRef} style={{ scrollMarginTop: '80px' }}>
          <h2><FontAwesomeIcon icon={faUserGraduate} /> Étudiants {selectedClass ? `· ${selectedClass.name}` : ''}</h2>
          {!selectedClass ? (
            <div className="empty">Sélectionnez une classe à gauche pour voir ses étudiants.</div>
          ) : (
            <>
              <div className="class-code-banner">
                <div>
                  <small><FontAwesomeIcon icon={faKey} /> Code à communiquer aux élèves pour s'inscrire</small>
                  <strong>{selectedClass.code}</strong>
                </div>
                <button type="button" className="secondary-btn small" onClick={() => copyCode(selectedClass.code)}>
                  <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>

              {loadingStudents ? (
                <div className="empty">Chargement...</div>
              ) : students.length === 0 ? (
                <div className="empty">Aucun étudiant dans cette classe.</div>
              ) : (
                <>
                  <div className="input-icon" style={{ marginBottom: 14 }}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                    <input
                      type="search"
                      placeholder="Rechercher un étudiant (nom ou email)..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {(() => {
                    const q = search.trim().toLowerCase();
                    const filtered = q
                      ? students.filter((s) =>
                          (s.name || '').toLowerCase().includes(q) ||
                          (s.email || '').toLowerCase().includes(q))
                      : students;

                    return (
                      <>
                        <div className="muted" style={{ marginBottom: 8, fontSize: '0.85rem' }}>
                          {filtered.length} / {students.length} étudiant{students.length > 1 ? 's' : ''}
                        </div>
                        <div className="students-scroll">
                          {filtered.length === 0 ? (
                            <div className="empty">Aucun étudiant ne correspond à « {search} ».</div>
                          ) : filtered.map((student) => (
                            <div className="list-item" key={student.id}>
                              <div>
                                <strong>{student.name}</strong>
                                <small><FontAwesomeIcon icon={faEnvelope} /> {student.email}</small>
                              </div>
                              <Link className="secondary-btn small" to={`/admin/students/${student.id}/results`}>
                                <FontAwesomeIcon icon={faChartLine} /> Notes
                              </Link>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
