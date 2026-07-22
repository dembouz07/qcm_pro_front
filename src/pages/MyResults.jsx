import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faMedal, faUser, faTriangleExclamation, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { formatDateTime } from '../utils/time.js';

export default function MyResults() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [referentiel, setReferentiel] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    setResults(null);

    try {
      const response = await api.post('/public/my-results', { nom, prenom, referentiel });
      setResults(response.data.data || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow public-quiz-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardList} /> Mes notes</span>
          <h1>Consulter mes résultats</h1>
          <p className="muted">Renseignez votre identité pour retrouver vos notes sur les différents tests.</p>
        </div>
      </div>

      <form className="panel form-grid" onSubmit={handleSearch}>
        <h2 className="span-2"><FontAwesomeIcon icon={faUser} /> Identité</h2>

        {error && <div className="alert error span-2">{error}</div>}

        <label>
          Nom *
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" required />
        </label>
        <label>
          Prénom *
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom" required />
        </label>
        <label className="span-2">
          Référentiel (facultatif)
          <input value={referentiel} onChange={(e) => setReferentiel(e.target.value)} placeholder="Votre référentiel" />
        </label>

        <button className="primary-btn span-2" disabled={loading}>
          <FontAwesomeIcon icon={faMedal} /> {loading ? 'Recherche...' : 'Voir mes notes'}
        </button>
      </form>

      {results && (
        <div className="panel" style={{ marginTop: '1.5rem' }}>
          {results.length === 0 ? (
            <div className="empty">
              <FontAwesomeIcon icon={faTriangleExclamation} /> Aucune note trouvée pour cette identité.
            </div>
          ) : (
            <div className="answer-list">
              {results.map((r) => (
                <div className="answer-item" key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{r.quiz_title}</strong>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{formatDateTime(r.submitted_at)}</div>
                  </div>
                  <span className="score-badge">
                    <FontAwesomeIcon icon={faAward} />{' '}
                    {r.quiz_type === 'progressive' ? `Stade ${r.stade_atteint ?? '-'}` : `${r.note_sur_20}/20`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
