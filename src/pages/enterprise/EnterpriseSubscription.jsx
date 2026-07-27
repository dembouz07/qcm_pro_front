import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCircleCheck, faCreditCard, faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatDateTime } from '../../utils/time.js';

const ENTERPRISE_PLAN = {
  id: 'enterprise',
  name: 'Entreprise',
  price: 25000,
  features: [
    'Grille Mindset Techco : Confiance, Exécution, Innovation et Création de valeur',
    'Diagnostics individuels T0 et entretiens de suivi à six mois',
    'Verbatims, plans d’action et comparaison automatique de la progression',
  ],
};

export default function EnterpriseSubscription() {
  const { setUser } = useAuth();
  const [params] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadStatus() {
    try {
      const response = await api.get('/enterprise/subscription');
      setInfo(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyAfterPayment() {
    try {
      const response = await api.post('/enterprise/subscription/verify');
      setInfo(response.data);
      if (response.data.is_active) {
        const me = await api.get('/auth/me');
        setUser(me.data);
        setMessage('Paiement confirmé : votre forfait Entreprise est actif.');
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.get('paid') === '1') verifyAfterPayment();
    else loadStatus();
    if (params.get('canceled') === '1') setError('Paiement annulé. Aucun changement n’a été appliqué.');
  }, [params]);

  async function checkout() {
    setPaying(true);
    setError('');
    try {
      const response = await api.post('/enterprise/subscription/checkout', { plan: ENTERPRISE_PLAN.id });
      if (response.data.url) window.location.href = response.data.url;
    } catch (err) {
      setError(getApiError(err));
      setPaying(false);
    }
  }

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;

  const isActive = Boolean(info?.is_active && info?.current_plan === ENTERPRISE_PLAN.id);

  return (
    <div className="page subscription-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faBuilding} /> Forfait Entreprise</span>
          <h1>Pilotez la progression des soft skills.</h1>
          <p>Centralisez les entretiens Mindset, les scores par pilier et les plans d’action de vos collaborateurs. L’offre est mensuelle.</p>
        </div>
      </div>

      {error && <div className="alert error"><FontAwesomeIcon icon={faTriangleExclamation} /> {error}</div>}
      {message && <div className="alert success"><FontAwesomeIcon icon={faCircleCheck} /> {message}</div>}

      <div className="subscription-current">
        <div>
          <small>État de votre forfait</small>
          <strong>{isActive ? 'Entreprise active' : 'À activer'}</strong>
        </div>
        {isActive && info?.subscribed_until && <span>Actif jusqu’au {formatDateTime(info.subscribed_until)}</span>}
      </div>

      <section className="subscription-plans subscription-single-plan" aria-label="Forfait Entreprise">
        <article className={`subscription-plan-card recommended ${isActive ? 'current' : ''}`}>
          <span className="subscription-plan-badge">Accès complet</span>
          {isActive && <span className="subscription-current-badge"><FontAwesomeIcon icon={faCircleCheck} /> Actif</span>}
          <div className="subscription-plan-icon enterprise"><FontAwesomeIcon icon={faBuilding} /></div>
          <h2>{ENTERPRISE_PLAN.name}</h2>
          <p>Un espace indépendant, conçu pour les entretiens et le développement des équipes.</p>
          <div className="subscription-plan-price"><strong>{ENTERPRISE_PLAN.price.toLocaleString('fr-FR')}</strong><span>F CFA / mois</span></div>
          <ul>{ENTERPRISE_PLAN.features.map((feature) => <li key={feature}><FontAwesomeIcon icon={faCircleCheck} /> {feature}</li>)}</ul>
          <button className="primary-btn large" onClick={checkout} disabled={paying}>
            <FontAwesomeIcon icon={paying ? faSpinner : faCreditCard} spin={paying} />
            {paying ? 'Redirection...' : isActive ? 'Renouveler pour 1 mois' : 'Activer le forfait Entreprise'}
          </button>
        </article>
      </section>

      <p className="subscription-secure">Paiement sécurisé via PayTech : Wave, Orange Money ou carte bancaire.</p>
    </div>
  );
}
