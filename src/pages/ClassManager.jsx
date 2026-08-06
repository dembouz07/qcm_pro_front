import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faPlus, faTrash, faUsers, faChevronRight, faEnvelope, faUserGraduate, faMagnifyingGlass, faKey, faCopy, faChartLine, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useDialog } from '../components/DialogProvider.jsx';
import { formatClassLabel, getAcademicYearOptions, getCurrentAcademicYear, isValidAcademicYear } from '../utils/academicYear.js';

export default function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(() => ({ name: '', academic_year: getCurrentAcademicYear(), code: '' }));
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(() => getCurrentAcademicYear());
  const [error, setError] = useState('');
  const { confirm } = useDialog();

  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const studentsRef = useRef(null);
  const academicYears = useMemo(() => getAcademicYearOptions(classes), [classes]);
  const filteredClasses = useMemo(() => (
    selectedAcademicYear
      ? classes.filter((classe) => classe.academic_year === selectedAcademicYear)
      : classes
  ), [classes, selectedAcademicYear]);

  async function loadClasses() {
    const response = await api.get('/admin/classes');
    setClasses(response.data);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function selectClass(classe) {
    setSelectedClass(classe);
    setStudents([]);
    setSearch('');
    setLoadingStudents(true);
    // Sur mobile, faire défiler vers le panneau des étudiants
    if (window.innerWidth <= 980) {
      setTimeout(() => studentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
    try {
      const response = await api.get(`/admin/classes/${classe.id}`);
      setStudents(response.data.students || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoadingStudents(false);
    }
  }

  async function addClass(event) {
    event.preventDefault();
    setError('');
    if (!isValidAcademicYear(form.academic_year)) {
      setError('L’année scolaire doit respecter le format AAAA-AAAA avec deux années consécutives (ex. 2026-2027).');
      return;
    }
    try {
      await api.post('/admin/classes', form);
      setSelectedAcademicYear(form.academic_year);
      setForm({ name: '', academic_year: form.academic_year, code: '' });
      await loadClasses();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  function filterByAcademicYear(academicYear) {
    setSelectedAcademicYear(academicYear);
    if (selectedClass && academicYear && selectedClass.academic_year !== academicYear) {
      setSelectedClass(null);
      setStudents([]);
      setSearch('');
    }
  }

  async function removeClass(id) {
    const ok = await confirm({
      title: 'Supprimer la classe',
      message: 'Supprimer cette classe ? Les données associées seront perdues.',
      confirmText: 'Supprimer',
    });
    if (!ok) return;
    await api.delete(`/admin/classes/${id}`);
    if (selectedClass?.id === id) {
      setSelectedClass(null);
      setStudents([]);
    }
    await loadClasses();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faLayerGroup} /> Classes</span>
          <h1>Gestion des classes</h1>
          <p>Sélectionnez une classe pour voir ses étudiants. Chaque QCM doit être attaché à une classe précise.</p>
        </div>
      </div>

      <form className="panel inline-form class-create-form" onSubmit={addClass}>
        {error && <div className="alert error full">{error}</div>}
        <input placeholder="Nom de la classe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input
          aria-label="Année scolaire"
          title="Format attendu : 2026-2027"
          placeholder="Année : 2026-2027"
          value={form.academic_year}
          onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
          pattern="[0-9]{4}-[0-9]{4}"
          maxLength="9"
          required
        />
        <input placeholder="Code (laisser vide = auto)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <button className="primary-btn"><FontAwesomeIcon icon={faPlus} /> Ajouter</button>
      </form>

      <div className="grid-two">
        <div className="panel">
          <div className="class-list-header">
            <h2><FontAwesomeIcon icon={faLayerGroup} /> Classes</h2>
            <label className="class-year-filter">
              <span><FontAwesomeIcon icon={faCalendarDays} /> Année scolaire</span>
              <select value={selectedAcademicYear} onChange={(e) => filterByAcademicYear(e.target.value)}>
                <option value="">Toutes les années</option>
                {academicYears.map((academicYear) => (
                  <option key={academicYear} value={academicYear}>{academicYear}</option>
                ))}
              </select>
            </label>
          </div>
          {classes.length === 0 ? <div className="empty">Aucune classe créée.</div> : (
            <div className="classes-scroll">
              {filteredClasses.length === 0 ? (
                <div className="empty">Aucune classe pour l’année {selectedAcademicYear}.</div>
              ) : filteredClasses.map((classe) => (
                <div
                  className={`list-item class-row ${selectedClass?.id === classe.id ? 'selected' : ''}`}
                  key={classe.id}
                  onClick={() => selectClass(classe)}
                  role="button"
                >
                  <div>
                    <strong>{formatClassLabel(classe)}</strong>
                    <small>Code : {classe.code || '—'} · {classe.quizzes_count || 0} QCM</small>
                  </div>
                  <div className="row-actions">
                    <span className="badge"><FontAwesomeIcon icon={faUsers} /> {classe.users_count || 0} élèves</span>
                    <button
                      className="icon-btn danger"
                      onClick={(e) => { e.stopPropagation(); removeClass(classe.id); }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <FontAwesomeIcon icon={faChevronRight} className="text-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel" ref={studentsRef} style={{ scrollMarginTop: '80px' }}>
          <h2><FontAwesomeIcon icon={faUserGraduate} /> Étudiants {selectedClass ? `· ${formatClassLabel(selectedClass)}` : ''}</h2>
          {!selectedClass ? (
            <div className="empty">Sélectionnez une classe à gauche pour voir ses étudiants.</div>
          ) : (
            <>
              <div className="class-code-banner">
                <div>
                  <small><FontAwesomeIcon icon={faKey} /> Code à communiquer aux élèves pour s'inscrire</small>
                  <strong>{selectedClass.code}</strong>
                </div>
                <button type="button" className="secondary-btn small" onClick={() => copyCode(selectedClass.code)}>
                  <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>

              {loadingStudents ? (
                <div className="empty">Chargement...</div>
              ) : students.length === 0 ? (
                <div className="empty">Aucun étudiant dans cette classe.</div>
              ) : (
                <>
                  <div className="input-icon" style={{ marginBottom: 14 }}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                    <input
                      type="search"
                      placeholder="Rechercher un étudiant (nom ou email)..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {(() => {
                    const q = search.trim().toLowerCase();
                    const filtered = q
                      ? students.filter((s) =>
                          (s.name || '').toLowerCase().includes(q) ||
                          (s.email || '').toLowerCase().includes(q))
                      : students;

                    return (
                      <>
                        <div className="muted" style={{ marginBottom: 8, fontSize: '0.85rem' }}>
                          {filtered.length} / {students.length} étudiant{students.length > 1 ? 's' : ''}
                        </div>
                        <div className="students-scroll">
                          {filtered.length === 0 ? (
                            <div className="empty">Aucun étudiant ne correspond à « {search} ».</div>
                          ) : filtered.map((student) => (
                            <div className="list-item" key={student.id}>
                              <div>
                                <strong>{student.name}</strong>
                                <small><FontAwesomeIcon icon={faEnvelope} /> {student.email}</small>
                              </div>
                              <Link className="secondary-btn small" to={`/admin/students/${student.id}/results`}>
                                <FontAwesomeIcon icon={faChartLine} /> Notes
                              </Link>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
