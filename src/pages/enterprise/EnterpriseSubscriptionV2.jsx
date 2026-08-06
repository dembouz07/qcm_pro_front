import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCircleCheck, faCompass, faCreditCard, faPeopleGroup, faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../../api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatDateTime } from '../../utils/time.js';
import { PRICE_CATALOG } from '../../config/offers.js';

const FALLBACK_PLANS = [
  { id: 'enterprise', name: 'Entreprise Essentiel', price: PRICE_CATALOG.enterprise.monthly, employee_limit: PRICE_CATALOG.enterprise.employeeLimit },
  { id: 'enterprise_team', name: 'Entreprise Équipe', price: PRICE_CATALOG.enterpriseTeam.monthly, employee_limit: PRICE_CATALOG.enterpriseTeam.employeeLimit },
];

const PLAN_DETAILS = {
  enterprise: {
    icon: faBuilding,
    tagline: 'Pour lancer et suivre un premier périmètre soft skills.',
    features: ['Jusqu’à 25 collaborateurs', 'Diagnostics individuels T0 et suivi', 'Plans d’action et progression par pilier'],
  },
  enterprise_team: {
    icon: faPeopleGroup,
    tagline: 'Pour déployer le parcours auprès d’une équipe élargie.',
    features: ['Jusqu’à 100 collaborateurs', 'Tout le parcours Essentiel', 'Capacité adaptée aux équipes et pilotes étendus'],
  },
};

export default function EnterpriseSubscriptionV2() {
  const { setUser } = useAuth();
  const [params] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkout(plan) {
    setPayingPlan(plan);
    setError('');
    try {
      const response = await api.post('/enterprise/subscription/checkout', { plan, billing_period: 'monthly' });
      if (response.data.url) window.location.href = response.data.url;
    } catch (err) {
      setError(getApiError(err));
      setPayingPlan('');
    }
  }

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;

  const plans = info?.plans?.length ? info.plans : FALLBACK_PLANS;
  const currentPlan = info?.current_plan || 'free';

  return (
    <div className="page subscription-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faBuilding} /> Forfaits Entreprise</span>
          <h1>Une limite claire pour chaque taille d’équipe.</h1>
          <p>Essentiel couvre jusqu’à 25 collaborateurs ; Équipe étend le même parcours jusqu’à 100. Chaque paiement ajoute un mois sans reconduction automatique.</p>
        </div>
        <div className="header-actions"><Link className="secondary-btn" to="/guide"><FontAwesomeIcon icon={faCompass} /> Guide entreprise</Link></div>
      </div>

      {error && <div className="alert error"><FontAwesomeIcon icon={faTriangleExclamation} /> {error}</div>}
      {message && <div className="alert success"><FontAwesomeIcon icon={faCircleCheck} /> {message}</div>}

      <div className="subscription-current">
        <div><small>Votre formule actuelle</small><strong>{plans.find((plan) => plan.id === currentPlan)?.name || 'À activer'}</strong></div>
        {info?.is_active && info?.subscribed_until && <span>Active jusqu’au {formatDateTime(info.subscribed_until)}</span>}
      </div>

      <section className="subscription-plans enterprise-subscription-plans" aria-label="Forfaits Entreprise">
        {plans.map((plan) => {
          const details = PLAN_DETAILS[plan.id] || PLAN_DETAILS.enterprise;
          const isCurrent = currentPlan === plan.id;
          const isPaying = payingPlan === plan.id;
          const recommended = plan.id === 'enterprise_team';
          return (
            <article className={`subscription-plan-card ${recommended ? 'recommended' : ''} ${isCurrent ? 'current' : ''}`} key={plan.id}>
              {recommended && <span className="subscription-plan-badge">Jusqu’à 100</span>}
              {isCurrent && <span className="subscription-current-badge"><FontAwesomeIcon icon={faCircleCheck} /> Actuelle</span>}
              <div className="subscription-plan-icon enterprise"><FontAwesomeIcon icon={details.icon} /></div>
              <h2>{plan.name}</h2>
              <p>{details.tagline}</p>
              <div className="subscription-plan-price"><strong>{Number(plan.price).toLocaleString('fr-FR')}</strong><span>F CFA / mois</span></div>
              <ul>{details.features.map((feature) => <li key={feature}><FontAwesomeIcon icon={faCircleCheck} /> {feature}</li>)}</ul>
              <button className={recommended ? 'primary-btn large' : 'secondary-btn large'} onClick={() => checkout(plan.id)} disabled={Boolean(payingPlan)}>
                <FontAwesomeIcon icon={isPaying ? faSpinner : faCreditCard} spin={isPaying} />
                {isPaying ? 'Redirection...' : isCurrent ? 'Renouveler pour 1 mois' : `Choisir ${plan.name}`}
              </button>
            </article>
          );
        })}
      </section>

      <p className="subscription-secure">Paiement sécurisé via PayTech, sans renouvellement automatique : Wave, Orange Money ou carte bancaire. Pour un pilote déductible d’un contrat annuel, demandez un devis avant paiement.</p>
    </div>
  );
}
