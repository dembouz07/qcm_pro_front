import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faChartLine, faDoorOpen, faFileImport, faGraduationCap, faLayerGroup, faCirclePlus, faUserShield, faBars, faXmark, faDiagramProject, faCrown, faSackDollar } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <Link className="brand" to={user.role === 'superadmin' ? '/superadmin' : user.role === 'admin' ? '/admin' : '/student'} onClick={() => setMenuOpen(false)}>
          <img src="/logoSidebar.png" className="brand-logo" alt="QCM Pro" />
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu" aria-expanded={menuOpen}>
          <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
        </button>
      </div>

      <div className="sidebar-body">
        <div className="user-pill">
          <FontAwesomeIcon icon={user.role === 'superadmin' ? faCrown : user.role === 'admin' ? faUserShield : faBookOpen} />
          <div>
            <strong>{user.name}</strong>
            <small>{user.role === 'superadmin' ? 'Super-administrateur' : user.role === 'admin' ? 'Administrateur' : user.school_class?.name || 'Élève'}</small>
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
              <NavLink to="/admin/subscription"><FontAwesomeIcon icon={faCrown} /> Abonnement</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/student" end><FontAwesomeIcon icon={faBookOpen} /> Mes QCM</NavLink>
              <NavLink to="/student/notes"><FontAwesomeIcon icon={faChartLine} /> Notes</NavLink>
            </>
          )}
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
