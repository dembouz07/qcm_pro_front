import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faPlus, faTrash, faUsers, faChevronRight, faEnvelope, faUserGraduate } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState('');

  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  async function loadClasses() {
    const response = await api.get('/admin/classes');
    setClasses(response.data);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function selectClass(classe) {
    setSelectedClass(classe);
    setStudents([]);
    setLoadingStudents(true);
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
    if (!confirm('Supprimer cette classe ?')) return;
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
        <input placeholder="Code, ex: TA" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <button className="primary-btn"><FontAwesomeIcon icon={faPlus} /> Ajouter</button>
      </form>

      <div className="grid-two">
        <div className="panel">
          <h2><FontAwesomeIcon icon={faLayerGroup} /> Classes</h2>
          {classes.length === 0 ? <div className="empty">Aucune classe créée.</div> : classes.map((classe) => (
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

        <div className="panel">
          <h2><FontAwesomeIcon icon={faUserGraduate} /> Étudiants {selectedClass ? `· ${selectedClass.name}` : ''}</h2>
          {!selectedClass ? (
            <div className="empty">Sélectionnez une classe à gauche pour voir ses étudiants.</div>
          ) : loadingStudents ? (
            <div className="empty">Chargement...</div>
          ) : students.length === 0 ? (
            <div className="empty">Aucun étudiant dans cette classe.</div>
          ) : (
            <div className="answer-list">
              {students.map((student) => (
                <div className="list-item" key={student.id}>
                  <div>
                    <strong>{student.name}</strong>
                    <small><FontAwesomeIcon icon={faEnvelope} /> {student.email}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
