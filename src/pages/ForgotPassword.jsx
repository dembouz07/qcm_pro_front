import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faKey, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError, getCsrfCookie } from '../api.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCheckEmail(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await getCsrfCookie();
      await api.post('/auth/check-email', { email });
      setStep(2);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
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
      <form onSubmit={step === 1 ? handleCheckEmail : handleReset} className="form-card register-card">
        <h2><FontAwesomeIcon icon={faKey} /> Mot de passe oublié</h2>
        <p className="muted">
          {step === 1
            ? 'Entrez votre email pour vérifier votre compte.'
            : 'Compte vérifié. Choisissez un nouveau mot de passe.'}
        </p>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <label>
          Email
          <div className="input-icon">
            <FontAwesomeIcon icon={faEnvelope} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={step === 2}
              required
            />
          </div>
        </label>

        {step === 2 && (
          <>
            <label>
              Nouveau mot de passe
              <div className="input-icon">
                <FontAwesomeIcon icon={faLock} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </label>

            <label>
              Confirmer le mot de passe
              <div className="input-icon">
                <FontAwesomeIcon icon={faLock} />
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
              </div>
            </label>
          </>
        )}

        <button className="primary-btn" disabled={loading || !!success}>
          {step === 1 ? (
            <>
              <FontAwesomeIcon icon={faArrowRight} /> {loading ? 'Vérification...' : 'Vérifier l\'email'}
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faKey} /> {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </>
          )}
        </button>

        {step === 2 && !success && (
          <button
            type="button"
            className="secondary-btn"
            onClick={() => { setStep(1); setError(''); setPassword(''); setPasswordConfirmation(''); }}
          >
            Changer d'email
          </button>
        )}

        <p className="muted center">
          <Link className="auth-link" to="/login">Retour à la connexion</Link>
        </p>
      </form>
    </section>
  );
}
