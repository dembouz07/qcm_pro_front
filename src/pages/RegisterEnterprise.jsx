import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCircleCheck, faEnvelope, faLock, faRightToBracket, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AuthTopbar from '../components/AuthTopbar.jsx';

export default function RegisterEnterprise() {
  const { registerEnterprise } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerEnterprise(form);
      navigate('/entreprise/abonnement');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <AuthTopbar active="register-enterprise" />
      <div className="auth-card">
        <div className="auth-hero">
          <span><FontAwesomeIcon icon={faBuilding} /></span>
          <h1>Espace entreprise</h1>
          <p>Mesurez et faites progresser les soft skills de vos collaborateurs avec une grille d’entretien structurée.</p>
          <ul className="auth-hero-list">
            <li><FontAwesomeIcon icon={faCircleCheck} /> Diagnostic Mindset en 4 piliers</li>
            <li><FontAwesomeIcon icon={faCircleCheck} /> Comparaison automatique entre T0 et T+6 mois</li>
            <li><FontAwesomeIcon icon={faCircleCheck} /> Plans d’action et suivi par collaborateur</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="form-card">
          <h2><FontAwesomeIcon icon={faBuilding} /> Créer l’espace entreprise</h2>
          {error && <div className="alert error">{error}</div>}

          <label>
            Nom de l’entreprise
            <div className="input-icon">
              <FontAwesomeIcon icon={faBuilding} />
              <input value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} required />
            </div>
          </label>

          <label>
            Secteur d’activité <span className="muted">(optionnel)</span>
            <input value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} />
          </label>

          <label>
            Votre nom complet
            <div className="input-icon">
              <FontAwesomeIcon icon={faUserTie} />
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
          </label>

          <label>
            Email professionnel
            <div className="input-icon">
              <FontAwesomeIcon icon={faEnvelope} />
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </div>
          </label>

          <div className="form-grid">
            <label>
              Mot de passe
              <div className="input-icon">
                <FontAwesomeIcon icon={faLock} />
                <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8 caractères min." required />
              </div>
            </label>
            <label>
              Confirmer
              <div className="input-icon">
                <FontAwesomeIcon icon={faLock} />
                <input type="password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} required />
              </div>
            </label>
          </div>

          <p className="muted collection-notice">En créant cet espace, vous confirmez avoir lu les <Link to="/cgu">CGU</Link>, les <Link to="/cgv">CGV</Link> et la <Link to="/confidentialite">politique de confidentialité</Link>.</p>

          <button className="primary-btn" disabled={loading}>
            <FontAwesomeIcon icon={faBuilding} /> {loading ? 'Création...' : 'Créer mon espace entreprise'}
          </button>

          <div className="auth-links">
            <span className="muted">Vous avez déjà un compte ?</span>
            <Link className="auth-link" to="/login"><FontAwesomeIcon icon={faRightToBracket} /> Se connecter</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
