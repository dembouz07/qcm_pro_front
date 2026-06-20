import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faGraduationCap, faLock, faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError, getCsrfCookie } from '../api.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    email: '',
    name: '',
    school_class_id: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/classes').then((response) => setClasses(response.data)).catch(() => {});
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await getCsrfCookie();
      const response = await api.post('/auth/forgot-password', form);
      setSuccess(response.data.message || 'Mot de passe réinitialisé avec succès.');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={handleSubmit} className="form-card register-card">
        <h2><FontAwesomeIcon icon={faKey} /> Mot de passe oublié</h2>
        <p className="muted">Confirmez votre identité pour définir un nouveau mot de passe.</p>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <label>
          Nom complet
          <div className="input-icon">
            <FontAwesomeIcon icon={faUser} />
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
          Nouveau mot de passe
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
          <FontAwesomeIcon icon={faKey} /> {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
        </button>

        <p className="muted center">
          <Link className="auth-link" to="/login">Retour à la connexion</Link>
        </p>
      </form>
    </section>
  );
}
