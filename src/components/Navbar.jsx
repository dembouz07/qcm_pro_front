import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faChartLine, faDoorOpen, faFileImport, faGraduationCap, faLayerGroup, faCirclePlus, faUserShield, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <Link className="brand" to={user.role === 'admin' ? '/admin' : '/student'} onClick={() => setMenuOpen(false)}>
          <span className="brand-icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
          <span>QCM Pro</span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu" aria-expanded={menuOpen}>
          <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
        </button>
      </div>

      <div className="sidebar-body">
        <div className="user-pill">
          <FontAwesomeIcon icon={user.role === 'admin' ? faUserShield : faBookOpen} />
          <div>
            <strong>{user.name}</strong>
            <small>{user.role === 'admin' ? 'Administrateur' : user.school_class?.name || 'Élève'}</small>
          </div>
        </div>

        <nav onClick={() => setMenuOpen(false)}>
          {user.role === 'admin' ? (
            <>
              <NavLink to="/admin" end><FontAwesomeIcon icon={faChartLine} /> Tableau de bord</NavLink>
              <NavLink to="/admin/classes"><FontAwesomeIcon icon={faLayerGroup} /> Classes</NavLink>
              <NavLink to="/admin/quizzes"><FontAwesomeIcon icon={faLayerGroup} /> Gérer les QCM</NavLink>
              <NavLink to="/admin/quizzes/new"><FontAwesomeIcon icon={faCirclePlus} /> Nouveau QCM</NavLink>
              <NavLink to="/admin/quizzes/import"><FontAwesomeIcon icon={faFileImport} /> Importer QCM</NavLink>
              <NavLink to="/admin/results"><FontAwesomeIcon icon={faChartLine} /> Notes</NavLink>
            </>
          ) : (
            <NavLink to="/student"><FontAwesomeIcon icon={faBookOpen} /> Mes QCM</NavLink>
          )}
        </nav>

        <button className="logout" onClick={handleLogout}>
          <FontAwesomeIcon icon={faDoorOpen} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
