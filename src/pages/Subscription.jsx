import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faCircleCheck, faTriangleExclamation, faCrown, faSpinner } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { formatDateTime } from '../utils/time.js';

export default function Subscription() {
  const { setUser, user } = useAuth();
  const [params] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadStatus() {
    try {
      const response = await api.get('/admin/subscription');
      setInfo(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  // Au retour du paiement, vérifier le statut
  async function verifyAfterPayment() {
    try {
      const response = await api.post('/admin/subscription/verify');
      setInfo((prev) => ({ ...prev, ...response.data }));
      if (response.data.is_active) {
        setMessage('Paiement confirmé ! Votre abonnement est actif.');
        // rafraîchir l'utilisateur global
        const me = await api.get('/auth/me');
        setUser(me.data);
      }
    } catch (err) {
      setError(getApiError(err));
    }
  }

  useEffect(() => {
    loadStatus();
    if (params.get('paid') === '1') {
      verifyAfterPayment();
    }
    if (params.get('canceled') === '1') {
      setError('Paiement annulé.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePay() {
    setPaying(true);
    setError('');
    try {
      const response = await api.post('/admin/subscription/checkout');
      if (response.data.url) {
        window.location.href = response.data.url; // redirection vers PayDunya
      }
    } catch (err) {
      setError(getApiError(err));
      setPaying(false);
    }
  }

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;

  const isActive = info?.is_active;

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCrown} /> Abonnement</span>
          <h1>Mon abonnement formateur</h1>
          <p>Accédez à toutes les fonctionnalités en activant votre abonnement mensuel.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success"><FontAwesomeIcon icon={faCircleCheck} /> {message}</div>}

      <div className="panel sub-card">
        <div className={`sub-status ${isActive ? 'active' : 'inactive'}`}>
          <FontAwesomeIcon icon={isActive ? faCircleCheck : faTriangleExclamation} />
          <div>
            <strong>{isActive ? 'Abonnement actif' : 'Abonnement inactif'}</strong>
            {isActive
              ? <small>Valable jusqu'au {formatDateTime(info.subscribed_until)}</small>
              : <small>Activez votre abonnement pour créer des QCM.</small>}
          </div>
        </div>

        <div className="sub-price">
          <span className="sub-amount">{info?.amount ?? 1000}</span>
          <span className="sub-currency">FCFA / mois</span>
        </div>

        <ul className="sub-features">
          <li><FontAwesomeIcon icon={faCircleCheck} /> Classes et élèves illimités</li>
          <li><FontAwesomeIcon icon={faCircleCheck} /> QCM manuel, import (CSV/Word/PDF), progressif</li>
          <li><FontAwesomeIcon icon={faCircleCheck} /> Liens publics et suivi des notes</li>
          <li><FontAwesomeIcon icon={faCircleCheck} /> Export Excel / PDF des résultats</li>
        </ul>

        <button className="primary-btn large" onClick={handlePay} disabled={paying}>
          <FontAwesomeIcon icon={paying ? faSpinner : faCreditCard} spin={paying} />{' '}
          {paying ? 'Redirection...' : isActive ? 'Renouveler (1 mois)' : 'Payer 1000 FCFA'}
        </button>
        <p className="muted center" style={{ fontSize: '0.85rem' }}>
          Paiement sécurisé via PayDunya (Wave, Orange Money, carte).
        </p>
      </div>
    </div>
  );
}
