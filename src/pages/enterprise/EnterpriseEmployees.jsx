import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlus, faClipboardCheck, faMagnifyingGlass, faPenToSquare, faUsers } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import { formatAssessmentType, seniorityLabel } from '../../utils/enterprise.js';

export default function EnterpriseEmployees() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enterprise/employees')
      .then((response) => setEmployees(response.data))
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filteredEmployees = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('fr');
    if (!search) return employees;
    return employees.filter((employee) => [employee.full_name, employee.job_title, employee.department, employee.email]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase('fr').includes(search)));
  }, [employees, query]);

  return (
    <div className="page enterprise-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faUsers} /> Collaborateurs</span>
          <h1>Votre équipe</h1>
          <p>Centralisez les informations nécessaires aux entretiens de soft skills.</p>
        </div>
        <div className="header-actions"><Link className="primary-btn" to="/entreprise/collaborateurs/nouveau"><FontAwesomeIcon icon={faCirclePlus} /> Ajouter un collaborateur</Link></div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="enterprise-toolbar panel">
        <div className="input-icon">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, un service ou une fonction" />
        </div>
        <span>{filteredEmployees.length} collaborateur{filteredEmployees.length > 1 ? 's' : ''}</span>
      </div>

      {loading ? <div className="panel">Chargement...</div> : filteredEmployees.length === 0 ? (
        <div className="empty">Aucun collaborateur ne correspond à votre recherche.</div>
      ) : (
        <section className="panel table-panel enterprise-table-panel">
          <table>
            <thead><tr><th>Collaborateur</th><th>Fonction / service</th><th>Ancienneté</th><th>Dernier diagnostic</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const latest = employee.latest_assessment;
                return (
                  <tr key={employee.id}>
                    <td><strong>{employee.full_name}</strong>{employee.email && <small className="table-subline">{employee.email}</small>}</td>
                    <td><strong>{employee.job_title || 'Non renseignée'}</strong><small className="table-subline">{employee.department || 'Service non renseigné'}</small></td>
                    <td>{seniorityLabel(employee.seniority_months)}</td>
                    <td>{latest ? <><strong>{latest.total_score}/100</strong><small className="table-subline">{formatAssessmentType(latest.type)}</small></> : <span className="muted">Pas encore réalisé</span>}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="icon-btn" title="Modifier" aria-label={`Modifier ${employee.full_name}`} to={`/entreprise/collaborateurs/${employee.id}/modifier`}><FontAwesomeIcon icon={faPenToSquare} /></Link>
                        <Link className="secondary-btn small" to={`/entreprise/diagnostics/nouveau?employee=${employee.id}`}><FontAwesomeIcon icon={faClipboardCheck} /> Diagnostiquer</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
