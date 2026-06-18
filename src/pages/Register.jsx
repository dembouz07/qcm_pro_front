import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faGraduationCap, faLock, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', school_class_id: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/classes').then((response) => setClasses(response.data));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/student');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={handleSubmit} className="form-card register-card">
        <h2><FontAwesomeIcon icon={faUserPlus} /> Inscription élève</h2>
        {error && <div className="alert error">{error}</div>}

        <label>
          Nom complet
          <div className="input-icon">
            <FontAwesomeIcon icon={faUserPlus} />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
        </label>

        <label>
          Email
          <div className="input-icon">
            <FontAwesomeIcon icon={faEnvelope} />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
        </label>

        <label>
          Classe
          <div className="input-icon">
            <FontAwesomeIcon icon={faGraduationCap} />
            <select value={form.school_class_id} onChange={(e) => setForm({ ...form, school_class_id: e.target.value })} required>
              <option value="">Choisir une classe</option>
              {classes.map((classe) => <option key={classe.id} value={classe.id}>{classe.name}</option>)}
            </select>
          </div>
        </label>

        <label>
          Mot de passe
          <div className="input-icon">
            <FontAwesomeIcon icon={faLock} />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
        </label>

        <label>
          Confirmer le mot de passe
          <div className="input-icon">
            <FontAwesomeIcon icon={faLock} />
            <input type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />
          </div>
        </label>

        <button className="primary-btn" disabled={loading}>
          <FontAwesomeIcon icon={faUserPlus} /> {loading ? 'Création...' : 'Créer mon compte'}
        </button>

        <p className="muted center">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
      </form>
    </section>
  );
}
