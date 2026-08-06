import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleCheck, faEnvelope, faKey, faLock } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError, getCsrfCookie } from '../api.js';

export default function ForgotPasswordSecure() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const emailFromLink = params.get('email') || '';
  const resetting = Boolean(token && emailFromLink);
  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await getCsrfCookie();
      const response = resetting
        ? await api.post('/auth/reset-password', { token, email, password, password_confirmation: passwordConfirmation })
        : await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message);
      if (resetting) setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form onSubmit={submit} className="form-card register-card">
        <h2><FontAwesomeIcon icon={faKey} /> {resetting ? 'Choisir un nouveau mot de passe' : 'Mot de passe oublié'}</h2>
        <p className="muted">{resetting ? 'Ce lien est personnel, à usage unique et expire après 60 minutes.' : 'Saisissez votre adresse. Si un compte existe, vous recevrez un lien sécurisé par email.'}</p>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success"><FontAwesomeIcon icon={faCircleCheck} /> {success}</div>}

        <label>Email<div className="input-icon"><FontAwesomeIcon icon={faEnvelope} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={resetting} autoComplete="email" required /></div></label>

        {resetting && (
          <>
            <label>Nouveau mot de passe<div className="input-icon"><FontAwesomeIcon icon={faLock} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength="8" required /></div></label>
            <label>Confirmer le mot de passe<div className="input-icon"><FontAwesomeIcon icon={faLock} /><input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" minLength="8" required /></div></label>
          </>
        )}

        <button className="primary-btn" disabled={loading || Boolean(success)}>
          <FontAwesomeIcon icon={resetting ? faKey : faArrowRight} /> {loading ? 'Envoi...' : resetting ? 'Réinitialiser le mot de passe' : 'Envoyer le lien sécurisé'}
        </button>
        <p className="muted center"><Link className="auth-link" to="/login">Retour à la connexion</Link></p>
      </form>
    </section>
  );
}
