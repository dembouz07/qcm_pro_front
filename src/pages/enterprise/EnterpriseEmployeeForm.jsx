import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBuilding, faFloppyDisk, faUserPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';

const EMPTY_EMPLOYEE = {
  first_name: '',
  last_name: '',
  email: '',
  job_title: '',
  department: '',
  seniority_months: '',
};

export default function EnterpriseEmployeeForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_EMPLOYEE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/enterprise/employees/${id}`)
      .then((response) => {
        const employee = response.data;
        setForm({
          first_name: employee.first_name || '',
          last_name: employee.last_name || '',
          email: employee.email || '',
          job_title: employee.job_title || '',
          department: employee.department || '',
          seniority_months: employee.seniority_months ?? '',
        });
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [editing, id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      email: form.email.trim() || null,
      job_title: form.job_title.trim() || null,
      department: form.department.trim() || null,
      seniority_months: form.seniority_months === '' ? null : Number(form.seniority_months),
    };

    try {
      if (editing) await api.put(`/enterprise/employees/${id}`, payload);
      else await api.post('/enterprise/employees', payload);
      navigate('/entreprise/collaborateurs');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;

  return (
    <div className="page narrow enterprise-page">
      <div className="page-header">
        <div>
          <Link className="back-link" to="/entreprise/collaborateurs"><FontAwesomeIcon icon={faArrowLeft} /> Retour aux collaborateurs</Link>
          <span className="eyebrow"><FontAwesomeIcon icon={faUsers} /> Collaborateur</span>
          <h1>{editing ? 'Modifier le collaborateur' : 'Ajouter un collaborateur'}</h1>
          <p>Ces informations préremplissent le contexte des entretiens Mindset.</p>
        </div>
      </div>

      <form className="panel form-grid" onSubmit={submit}>
        {error && <div className="alert error span-2">{error}</div>}
        <label>
          Prénom
          <input value={form.first_name} onChange={(event) => update('first_name', event.target.value)} required />
        </label>
        <label>
          Nom
          <input value={form.last_name} onChange={(event) => update('last_name', event.target.value)} required />
        </label>
        <label className="span-2">
          Email professionnel <span className="muted">(optionnel)</span>
          <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
        </label>
        <label>
          Fonction
          <input value={form.job_title} onChange={(event) => update('job_title', event.target.value)} placeholder="Ex. Chargé de clientèle" />
        </label>
        <label>
          Service
          <div className="input-icon">
            <FontAwesomeIcon icon={faBuilding} />
            <input value={form.department} onChange={(event) => update('department', event.target.value)} placeholder="Ex. Commercial" />
          </div>
        </label>
        <label className="span-2">
          Ancienneté dans l’organisation <span className="muted">(en mois, optionnel)</span>
          <input type="number" min="0" max="720" value={form.seniority_months} onChange={(event) => update('seniority_months', event.target.value)} placeholder="Ex. 18" />
        </label>
        <div className="span-2">
          <button className="primary-btn" disabled={saving}><FontAwesomeIcon icon={editing ? faFloppyDisk : faUserPlus} /> {saving ? 'Enregistrement...' : editing ? 'Enregistrer les modifications' : 'Ajouter le collaborateur'}</button>
        </div>
      </form>
    </div>
  );
}
