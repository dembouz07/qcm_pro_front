import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faArrowLeft, faRightToBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons';

export default function AuthTopbar({ active }) {
  return (
    <header className="auth-topbar">
      <Link className="brand auth-topbar-brand" to="/">
        <span className="brand-icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
        <span>QCM Pro</span>
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
            <FontAwesomeIcon icon={faUserPlus} /> Inscription
          </Link>
        )}
      </div>
    </header>
  );
}
