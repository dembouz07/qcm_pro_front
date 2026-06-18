import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faRightToBracket, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../AuthContext.jsx';
import { getApiError } from '../api.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(form);
      navigate(user.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <span><FontAwesomeIcon icon={faWandMagicSparkles} /></span>
          <h1>Bienvenue sur QCM Pro</h1>
          <p>Connectez-vous pour créer, importer ou passer vos QCM à l'heure programmée.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-card">
          <h2><FontAwesomeIcon icon={faRightToBracket} /> Connexion</h2>
          {error && <div className="alert error">{error}</div>}

          <label>
            Email
            <div className="input-icon">
              <FontAwesomeIcon icon={faEnvelope} />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </label>

          <label>
            Mot de passe
            <div className="input-icon">
              <FontAwesomeIcon icon={faLock} />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </label>

          <button className="primary-btn" disabled={loading}>
            <FontAwesomeIcon icon={faRightToBracket} /> {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="muted center">Pas encore de compte élève ? <Link to="/register">Créer un compte</Link></p>
        </form>
      </div>
    </section>
  );
}
