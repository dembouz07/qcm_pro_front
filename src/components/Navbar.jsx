import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faBuilding, faChartLine, faClipboardCheck, faClipboardQuestion, faCirclePlus, faCompass, faCrown, faDoorOpen, faGear, faLayerGroup, faSackDollar, faUserShield, faUsers, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../AuthContext.jsx';
import { homePathFor } from '../utils/homePath.js';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasFeature = (feature) => user?.is_super_admin || (user?.plan_features || []).includes(feature);

  // Verrouille le défilement de la page quand le tiroir est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  }

  // Ne pas afficher la sidebar pendant le chargement ou si pas connecté
  if (loading || !user) return null;

  return (
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <Link className="brand" to={homePathFor(user)} onClick={() => setMenuOpen(false)}>
          <img src="/cp_sidebar.png?v=1" className="brand-logo" alt="Check Performance" />
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu" aria-expanded={menuOpen}>
          <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
        </button>
      </div>

      <div className="sidebar-body">
        <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <div className="user-pill">
          <FontAwesomeIcon icon={user.role === 'superadmin' ? faCrown : user.role === 'admin' ? faUserShield : user.role === 'enterprise' ? faBuilding : faBookOpen} />
          <div>
            <strong>{user.name}</strong>
            <small>{user.role === 'superadmin' ? 'Super-administrateur' : user.role === 'admin' ? 'Formateur' : user.role === 'enterprise' ? user.company?.name || 'Entreprise' : user.school_class?.name || 'Élève'}</small>
          </div>
        </div>

        <nav onClick={() => setMenuOpen(false)}>
          {user.role === 'superadmin' ? (
            <>
              <NavLink to="/superadmin" end><FontAwesomeIcon icon={faChartLine} /> Tableau de bord</NavLink>
              <NavLink to="/superadmin/revenue"><FontAwesomeIcon icon={faSackDollar} /> Revenus</NavLink>
              <NavLink to="/superadmin/users"><FontAwesomeIcon icon={faUserShield} /> Utilisateurs</NavLink>
            </>
          ) : user.role === 'admin' ? (
            <>
              <NavLink to="/admin" end><FontAwesomeIcon icon={faChartLine} /> Tableau de bord</NavLink>
              <NavLink to="/admin/classes"><FontAwesomeIcon icon={faLayerGroup} /> Classes</NavLink>
              <NavLink to="/admin/quizzes" end><FontAwesomeIcon icon={faLayerGroup} /> Gérer les QCM</NavLink>
              <NavLink to="/admin/quizzes/create"><FontAwesomeIcon icon={faCirclePlus} /> Créer un QCM</NavLink>
              <NavLink to="/admin/results"><FontAwesomeIcon icon={faChartLine} /> Notes</NavLink>
              {hasFeature('surveys') && <NavLink to="/admin/surveys"><FontAwesomeIcon icon={faClipboardQuestion} /> Sondages</NavLink>}
              <NavLink to="/admin/subscription"><FontAwesomeIcon icon={faCrown} /> Abonnement</NavLink>
            </>
          ) : user.role === 'enterprise' ? (
            <>
              <NavLink to="/entreprise" end><FontAwesomeIcon icon={faChartLine} /> Tableau de bord</NavLink>
              <NavLink to="/entreprise/collaborateurs"><FontAwesomeIcon icon={faUsers} /> Collaborateurs</NavLink>
              <NavLink to="/entreprise/diagnostics"><FontAwesomeIcon icon={faClipboardCheck} /> Diagnostics Mindset</NavLink>
              <NavLink to="/entreprise/suivi"><FontAwesomeIcon icon={faChartLine} /> Suivi de progression</NavLink>
              <NavLink to="/entreprise/abonnement"><FontAwesomeIcon icon={faCrown} /> Abonnement</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/student" end><FontAwesomeIcon icon={faBookOpen} /> Mes QCM</NavLink>
              <NavLink to="/student/notes"><FontAwesomeIcon icon={faChartLine} /> Notes</NavLink>
            </>
          )}
          <NavLink to="/guide"><FontAwesomeIcon icon={faCompass} /> Guide d’utilisation</NavLink>
          <NavLink to="/account"><FontAwesomeIcon icon={faGear} /> Mon compte</NavLink>
        </nav>

        <button className="logout" onClick={handleLogout}>
          <FontAwesomeIcon icon={faDoorOpen} /> Déconnexion
        </button>
      </div>

      <div
        className="sidebar-backdrop"
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
    </aside>
  );
}
