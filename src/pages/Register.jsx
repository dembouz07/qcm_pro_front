import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faGraduationCap, faLock, faUserPlus, faKey } from '@fortawesome/free-solid-svg-icons';
import { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', class_code: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ ...form, class_code: form.class_code.trim().toUpperCase() });
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
          Code de la classe
          <div className="input-icon">
            <FontAwesomeIcon icon={faKey} />
            <input
              value={form.class_code}
              onChange={(e) => setForm({ ...form, class_code: e.target.value })}
              placeholder="Ex : AB12CD"
              style={{ textTransform: 'uppercase' }}
              required
            />
          </div>
          <small className="hint"><FontAwesomeIcon icon={faGraduationCap} /> Demandez ce code à votre formateur.</small>
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
