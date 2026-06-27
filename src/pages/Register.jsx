import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUserPlus, faKey, faRightToBracket, faGraduationCap, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
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
      <div className="auth-card">
        <div className="auth-hero">
          <span><FontAwesomeIcon icon={faGraduationCap} /></span>
          <h1>Rejoignez votre classe</h1>
          <p>Créez votre compte élève pour accéder à vos QCM et suivre vos notes.</p>
          <ul className="auth-hero-list">
            <li><FontAwesomeIcon icon={faCircleCheck} /> Un seul code suffit pour rejoindre votre classe</li>
            <li><FontAwesomeIcon icon={faCircleCheck} /> Passez vos tests à l'heure programmée</li>
            <li><FontAwesomeIcon icon={faCircleCheck} /> Consultez vos résultats à tout moment</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="form-card">
          <h2><FontAwesomeIcon icon={faUserPlus} /> Inscription élève</h2>
          {error && <div className="alert error">{error}</div>}

          <label>
            Nom complet
            <div className="input-icon">
              <FontAwesomeIcon icon={faUserPlus} />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Votre nom et prénom" required />
            </div>
          </label>

          <label>
            Email
            <div className="input-icon">
              <FontAwesomeIcon icon={faEnvelope} />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com" required />
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
                className="code-input"
                required
              />
            </div>
            <small className="hint"><FontAwesomeIcon icon={faGraduationCap} /> Demandez ce code à votre formateur.</small>
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
                <input type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} placeholder="Répétez" required />
              </div>
            </label>
          </div>

          <button className="primary-btn" disabled={loading}>
            <FontAwesomeIcon icon={faUserPlus} /> {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <div className="auth-links">
            <span className="muted">Déjà inscrit ?</span>
            <Link className="auth-link" to="/login">
              <FontAwesomeIcon icon={faRightToBracket} /> Se connecter
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
