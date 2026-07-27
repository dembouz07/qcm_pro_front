import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartColumn,
  faCircleCheck,
  faCompass,
  faCreditCard,
  faCrown,
  faGift,
  faSpinner,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import api, { getApiError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { formatDateTime } from '../utils/time.js';

const FALLBACK_PLANS = [
  { id: 'premium', name: 'Formateur', price: 5000 },
];

const PLAN_DETAILS = {
  free: {
    icon: faGift,
    tagline: 'Pour créer vos premiers QCM sans payer.',
    features: ['Création manuelle', 'Import CSV, JSON, Word et PDF', 'QCM progressifs'],
    excluded: ['Sondages', 'Pourcentages des questions ratées'],
  },
  essential: {
    icon: faChartColumn,
    tagline: 'Toutes les fonctions essentielles, sans les analyses avancées.',
    features: ['Tout le socle QCM', 'Création assistée par texte', 'Classes, partage, notes et exports'],
    excluded: ['Sondages', 'Pourcentages des questions ratées'],
  },
  premium: {
    icon: faCrown,
    tagline: 'Toutes les fonctionnalités QCM Pro, sans restriction.',
    features: ['Création, import, QCM progressifs et création assistée', 'Classes, partage, notes et exports', 'Sondages anonymes et analyse des questions les plus ratées'],
    excluded: [],
  },
};

const FEATURE_NAMES = {
  quiz_smart: 'La création assistée est disponible à partir de la formule Essentielle.',
  surveys: 'Les sondages sont inclus dans la formule Complète.',
  wrong_question_stats: 'L’analyse des questions ratées est incluse dans la formule Complète.',
};

export default function Subscription() {
  const { setUser } = useAuth();
  const [params] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refreshUser() {
    const me = await api.get('/auth/me');
    setUser(me.data);
  }

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

  async function verifyAfterPayment() {
    try {
      const response = await api.post('/admin/subscription/verify');
      setInfo(response.data);
      if (response.data.is_active) {
        setMessage('Paiement confirmé : votre nouvelle formule est active.');
        await refreshUser();
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

  async function handlePay(plan) {
    setPayingPlan(plan);
    setError('');
    try {
      const response = await api.post('/admin/subscription/checkout', { plan });
      if (response.data.url) window.location.href = response.data.url;
    } catch (err) {
      setError(getApiError(err));
      setPayingPlan('');
    }
  }

  if (loading) return <div className="page"><div className="panel">Chargement...</div></div>;

  const plans = info?.plans?.length ? info.plans : FALLBACK_PLANS;
  const currentPlan = info?.current_plan || 'free';
  const upgradeMessage = FEATURE_NAMES[params.get('upgrade')];

  return (
    <div className="page subscription-page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCrown} /> Formules</span>
          <h1>Toutes les fonctionnalités pour vos évaluations</h1>
          <p>Le forfait Formateur rassemble l’ensemble des outils QCM Pro. L’offre est mensuelle.</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-btn" to="/guide"><FontAwesomeIcon icon={faCompass} /> Guide des formules</Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success"><FontAwesomeIcon icon={faCircleCheck} /> {message}</div>}
      {upgradeMessage && (
        <div className="alert warning"><FontAwesomeIcon icon={faTriangleExclamation} /> {upgradeMessage}</div>
      )}

      <div className="subscription-current">
        <div>
          <small>Votre formule actuelle</small>
          <strong>{plans.find((plan) => plan.id === currentPlan)?.name || 'Forfait à activer'}</strong>
        </div>
        {info?.is_active && info?.subscribed_until && (
          <span>Active jusqu’au {formatDateTime(info.subscribed_until)}</span>
        )}
      </div>

      <section className="subscription-plans" aria-label="Formules QCM Pro">
        {plans.map((plan) => {
          const details = PLAN_DETAILS[plan.id] || PLAN_DETAILS.free;
          const isCurrent = currentPlan === plan.id;
          const isPaying = payingPlan === plan.id;

          return (
            <article className={`subscription-plan-card ${plan.id === 'premium' ? 'recommended' : ''} ${isCurrent ? 'current' : ''}`} key={plan.id}>
              {plan.id === 'premium' && <span className="subscription-plan-badge">Accès complet</span>}
              {isCurrent && <span className="subscription-current-badge"><FontAwesomeIcon icon={faCircleCheck} /> Actuelle</span>}
              <div className={`subscription-plan-icon ${plan.id}`}><FontAwesomeIcon icon={details.icon} /></div>
              <h2>{plan.name}</h2>
              <p>{details.tagline}</p>
              <div className="subscription-plan-price">
                <strong>{plan.price === 0 ? 'Gratuit' : Number(plan.price).toLocaleString('fr-FR')}</strong>
                {plan.price > 0 && <span>F CFA / mois</span>}
              </div>
              <ul>
                {details.features.map((feature) => (
                  <li key={feature}><FontAwesomeIcon icon={faCircleCheck} /> {feature}</li>
                ))}
                {details.excluded.map((feature) => (
                  <li className="excluded" key={feature}><FontAwesomeIcon icon={faXmark} /> {feature}</li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <button className="secondary-btn large" disabled>{isCurrent ? 'Formule actuelle' : 'Toujours disponible'}</button>
              ) : (
                <button className={plan.id === 'premium' ? 'primary-btn large' : 'secondary-btn large'} onClick={() => handlePay(plan.id)} disabled={Boolean(payingPlan)}>
                  <FontAwesomeIcon icon={isPaying ? faSpinner : faCreditCard} spin={isPaying} />{' '}
                  {isPaying ? 'Redirection...' : isCurrent ? 'Renouveler pour 1 mois' : `Choisir à ${Number(plan.price).toLocaleString('fr-FR')} F`}
                </button>
              )}
            </article>
          );
        })}
      </section>

      <p className="subscription-secure">Paiement sécurisé via PayTech : Wave, Orange Money ou carte bancaire.</p>
    </div>
  );
}
