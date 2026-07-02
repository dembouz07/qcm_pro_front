import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsersGear, faMagnifyingGlass, faRotateRight, faTriangleExclamation,
  faBan, faCircleCheck, faArrowLeft, faCrown,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';

const ROLE_LABELS = {
  superadmin: 'Super-admin',
  admin: 'Formateur',
  student: 'Élève',
};

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function loadUsers() {
    try {
      setError('');
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const response = await api.get('/superadmin/users', { params });
      setUsers(response.data.data || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  async function toggleBlock(user) {
    const action = user.is_blocked ? 'unblock' : 'block';
    if (!user.is_blocked && !window.confirm(`Bloquer ${user.name} ? Ses sessions seront fermées.`)) return;
    try {
      setBusyId(user.id);
      await api.post(`/superadmin/users/${user.id}/${action}`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u)));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faUsersGear} /> Gestion des utilisateurs</span>
          <h1>Tous les utilisateurs</h1>
          <p>Consultez et gérez l'accès de tous les comptes de la plateforme.</p>
        </div>
        <Link className="secondary-btn" to="/superadmin">
          <FontAwesomeIcon icon={faArrowLeft} /> Retour
        </Link>
      </div>

      {error && (
        <div className="alert warning">
          <FontAwesomeIcon icon={faTriangleExclamation} /> {error}
        </div>
      )}

      <div className="panel" style={{ marginBottom: 16 }}>
        <form
          onSubmit={(e) => { e.preventDefault(); loadUsers(); }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <div style={{ flex: '1 1 220px', display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Rechercher par nom ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="primary-btn" type="submit">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tous les rôles</option>
            <option value="admin">Formateurs</option>
            <option value="student">Élèves</option>
            <option value="superadmin">Super-admins</option>
          </select>
          <button className="secondary-btn" type="button" onClick={loadUsers} disabled={loading}>
            <FontAwesomeIcon icon={faRotateRight} /> Actualiser
          </button>
        </form>
      </div>

      <div className="panel table-panel">
        {loading ? (
          <div className="empty">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="empty">Aucun utilisateur trouvé.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Tests</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.role === 'superadmin' && (
                      <span className="score-badge" style={{ marginLeft: 6 }}>
                        <FontAwesomeIcon icon={faCrown} />
                      </span>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>{ROLE_LABELS[u.role] || u.role}</td>
                  <td>
                    {u.is_blocked ? (
                      <span className="score-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Bloqué</span>
                    ) : (
                      <span className="score-badge" style={{ background: '#dcfce7', color: '#15803d' }}>Actif</span>
                    )}
                  </td>
                  <td>{u.submissions_count ?? 0}</td>
                  <td>
                    {u.role === 'superadmin' ? (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    ) : (
                      <button
                        className={u.is_blocked ? 'primary-btn' : 'secondary-btn'}
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => toggleBlock(u)}
                      >
                        <FontAwesomeIcon icon={u.is_blocked ? faCircleCheck : faBan} />{' '}
                        {u.is_blocked ? 'Débloquer' : 'Bloquer'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
