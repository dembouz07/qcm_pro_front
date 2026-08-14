import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

export default function ParticipantQuizState({ type, title, message, onRetry }) {
  if (type === 'loading') {
    return (
      <div className="participant-state participant-state-loading" role="status" aria-live="polite" aria-busy="true">
        <span className="participant-state-spinner" aria-hidden="true" />
        <p>{message || 'Chargement du QCM…'}</p>
      </div>
    );
  }

  const isError = type === 'error';
  return (
    <section className="panel center participant-state" role={isError ? 'alert' : 'status'}>
      {isError && (
        <div className="big-icon warning" aria-hidden="true">
          <FontAwesomeIcon icon={faTriangleExclamation} />
        </div>
      )}
      <h1>{title || (isError ? 'QCM indisponible' : 'Aucune question disponible')}</h1>
      {message && <p>{message}</p>}
      {onRetry && (
        <button className="primary-btn" type="button" onClick={onRetry}>
          <FontAwesomeIcon icon={faRotateRight} /> Réessayer
        </button>
      )}
    </section>
  );
}
