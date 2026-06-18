import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faPlus, faTrash, faUsers } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

export default function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [error, setError] = useState('');

  async function loadClasses() {
    const response = await api.get('/admin/classes');
    setClasses(response.data);
  }

  useEffect(() => {
    loadClasses();
  }, []);

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
    await loadClasses();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faLayerGroup} /> Classes</span>
          <h1>Gestion des classes</h1>
          <p>Chaque QCM doit être attaché à une classe précise.</p>
        </div>
      </div>

      <form className="panel inline-form" onSubmit={addClass}>
        {error && <div className="alert error full">{error}</div>}
        <input placeholder="Nom de la classe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Code, ex: TA" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <button className="primary-btn"><FontAwesomeIcon icon={faPlus} /> Ajouter</button>
      </form>

      <div className="panel">
        {classes.length === 0 ? <div className="empty">Aucune classe créée.</div> : classes.map((classe) => (
          <div className="list-item" key={classe.id}>
            <div>
              <strong>{classe.name}</strong>
              <small>Code : {classe.code || '—'} · {classe.quizzes_count || 0} QCM</small>
            </div>
            <div className="row-actions">
              <span className="badge"><FontAwesomeIcon icon={faUsers} /> {classe.users_count || 0} élèves</span>
              <button className="icon-btn danger" onClick={() => removeClass(classe.id)}><FontAwesomeIcon icon={faTrash} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
