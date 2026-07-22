import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUserShield, faRightToBracket, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AuthTopbar from '../components/AuthTopbar.jsx';

export default function RegisterAdmin() {
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerAdmin(form);
      navigate('/admin');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <AuthTopbar />
      <div className="auth-card">
        <div className="auth-hero">
          <span><FontAwesomeIcon icon={faUserShield} /></span>
          <h1>Espace formateur</h1>
          <p>Créez votre compte formateur et gérez vos classes, QCM et résultats.</p>
          <ul className="auth-hero-list">
            <li><FontAwesomeIcon icon={faCircleCheck} /> Créez des QCM (manuel, import, progressif)</li>
            <li><FontAwesomeIcon icon={faCircleCheck} /> Partagez par lien ou par classe</li>
            <li><FontAwesomeIcon icon={faCircleCheck} /> Une formule gratuite, sans limite de durée</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="form-card">
          <h2><FontAwesomeIcon icon={faUserShield} /> Inscription formateur</h2>
          {error && <div className="alert error">{error}</div>}

          <label>
            Nom complet
            <div className="input-icon">
              <FontAwesomeIcon icon={faUserShield} />
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

          <div className="form-grid">
            <label>
              Mot de passe
              <div className="input-icon">
                <FontAwesomeIcon icon={faLock} />
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="8 caractères min." required />
              </div>
            </label>
            <label>
              Confirmer
              <div className="input-icon">
                <FontAwesomeIcon icon={faLock} />
                <input type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />
              </div>
            </label>
          </div>

          <button className="primary-btn" disabled={loading}>
            <FontAwesomeIcon icon={faUserShield} /> {loading ? 'Création...' : 'Créer mon compte formateur'}
          </button>

          <div className="auth-links">
            <span className="muted">Déjà formateur ?</span>
            <Link className="auth-link" to="/login">
              <FontAwesomeIcon icon={faRightToBracket} /> Se connecter
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
