import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faGraduationCap, faArrowLeft, faRightToBracket, faUserPlus, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { bookingUrl, trackPublicIntent } from './PublicChrome.jsx';

const commercialLaunchEnabled = import.meta.env.VITE_COMMERCIAL_LAUNCH_ENABLED === 'true';

export default function AuthTopbar({ active }) {
  return (
    <header className="auth-topbar">
      <Link className="brand auth-topbar-brand" to="/">
        <picture className="brand-picture">
          <source media="(max-width: 980px)" srcSet="/cp.svg?v=2" />
          <img src="/cp.png?v=2" className="brand-logo" alt="Check Performance" />
        </picture>
      </Link>

      <div className="auth-topbar-actions">
        <Link className="auth-topbar-link auth-home-link" to="/">
          <FontAwesomeIcon icon={faArrowLeft} /> Accueil
        </Link>
        {active !== 'login' && (
          <Link className="secondary-btn small" to="/login">
            <FontAwesomeIcon icon={faRightToBracket} /> Connexion
          </Link>
        )}
        {active !== 'register' && (
          <Link className="primary-btn small" to="/register">
            <FontAwesomeIcon icon={faGraduationCap} /> Élève
          </Link>
        )}
        {active !== 'register-admin' && (commercialLaunchEnabled ? (
          <Link className="auth-topbar-link" to="/register-admin">
            <FontAwesomeIcon icon={faUserShield} /> Formateur
          </Link>
        ) : (
          <a
            className="auth-topbar-link"
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Candidater au pilote formateur"
            onClick={() => trackPublicIntent('pilot_interest_clicked', 'auth_topbar_formateur')}
          >
            <FontAwesomeIcon icon={faUserShield} /> Formateur
          </a>
        ))}
        {active !== 'register-enterprise' && (commercialLaunchEnabled ? (
          <Link className="auth-topbar-link" to="/register-enterprise">
            <FontAwesomeIcon icon={faBuilding} /> Entreprise
          </Link>
        ) : (
          <a
            className="auth-topbar-link"
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Candidater au pilote entreprise"
            onClick={() => trackPublicIntent('pilot_interest_clicked', 'auth_topbar_entreprise')}
          >
            <FontAwesomeIcon icon={faBuilding} /> Entreprise
          </a>
        ))}
      </div>
    </header>
  );
}
