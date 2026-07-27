import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faGraduationCap, faArrowLeft, faRightToBracket, faUserPlus, faUserShield } from '@fortawesome/free-solid-svg-icons';

export default function AuthTopbar({ active }) {
  return (
    <header className="auth-topbar">
      <Link className="brand auth-topbar-brand" to="/">
        <img src="/cp.png?v=1" className="brand-logo" alt="Check Performance" />
      </Link>

      <div className="auth-topbar-actions">
        <Link className="auth-topbar-link" to="/">
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
        {active !== 'register-admin' && (
          <Link className="auth-topbar-link" to="/register-admin">
            <FontAwesomeIcon icon={faUserShield} /> Formateur
          </Link>
        )}
        {active !== 'register-enterprise' && (
          <Link className="auth-topbar-link" to="/register-enterprise">
            <FontAwesomeIcon icon={faBuilding} /> Entreprise
          </Link>
        )}
      </div>
    </header>
  );
}
