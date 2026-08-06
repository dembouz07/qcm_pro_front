import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faKey, faMedal, faTriangleExclamation, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { formatDateTime } from '../utils/time.js';

export default function MyResults() {
  const { hash } = useLocation();
  const initialCode = hash.startsWith('#access=') ? decodeURIComponent(hash.slice(8)) : '';
  const [attemptId, setAttemptId] = useState(initialCode);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadResult(code) {
    const normalizedCode = code.trim();
    if (!normalizedCode) return;

    setError('');
    setLoading(true);
    setResults(null);

    try {
      const response = await api.post('/public/my-results', { access_token: normalizedCode });
      setResults(response.data.data || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCode) void loadResult(initialCode);
    // Le code initial suffit : il ne change pas pendant cette consultation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    void loadResult(attemptId);
  }

  return (
    <div className="page narrow public-quiz-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faClipboardList} /> Mon résultat</span>
          <h1>Consulter un résultat</h1>
          <p className="muted">Chaque passage possède un code secret. Un nom ou un prénom ne suffit jamais pour accéder à une note.</p>
        </div>
      </div>

      <form className="panel form-grid" onSubmit={handleSearch}>
        <h2 className="span-2"><FontAwesomeIcon icon={faKey} /> Code d’accès</h2>

        {error && <div className="alert error span-2">{error}</div>}

        <label className="span-2">
          Code de la tentative
          <input
            value={attemptId}
            onChange={(event) => setAttemptId(event.target.value)}
            placeholder="Code secret de 64 caractères"
            autoComplete="off"
            spellCheck="false"
            required
          />
        </label>

        <p className="muted span-2">Ce code est ajouté automatiquement au lien affiché à la fin du QCM. Conservez-le comme un mot de passe.</p>

        <button className="primary-btn span-2" disabled={loading}>
          <FontAwesomeIcon icon={faMedal} /> {loading ? 'Recherche...' : 'Voir ce résultat'}
        </button>
      </form>

      {results && (
        <div className="panel" style={{ marginTop: '1.5rem' }}>
          {results.length === 0 ? (
            <div className="empty">
              <FontAwesomeIcon icon={faTriangleExclamation} /> Aucun résultat associé à ce code.
            </div>
          ) : (
            <div className="answer-list">
              {results.map((result) => (
                <div className="answer-item" key={result.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{result.quiz_title}</strong>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{formatDateTime(result.submitted_at)}</div>
                  </div>
                  <span className="score-badge">
                    <FontAwesomeIcon icon={faAward} />{' '}
                    {result.quiz_type === 'progressive' ? `Stade ${result.stade_atteint ?? '-'}` : `${result.note_sur_20}/20`}
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
