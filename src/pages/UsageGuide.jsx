import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faChevronDown,
  faCircleCheck,
  faCompass,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../AuthContext.jsx';
import { ADMIN_GUIDE_IDS, defaultGuideFor, USAGE_GUIDES } from '../config/usageGuides.js';

export default function UsageGuide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialGuide = useMemo(() => defaultGuideFor(user), [user]);
  const [selected, setSelected] = useState(initialGuide);
  const [openHowTo, setOpenHowTo] = useState(0);
  const guide = USAGE_GUIDES[selected] || USAGE_GUIDES.student;
  const isAdmin = user?.role === 'admin';
  const isCurrent = isAdmin ? user?.current_plan === selected : true;

  useEffect(() => {
    setSelected(initialGuide);
  }, [initialGuide]);

  useEffect(() => {
    setOpenHowTo(0);
  }, [selected]);

  function handleAction() {
    if (isAdmin && !isCurrent) {
      navigate('/admin/subscription');
      return;
    }
    if (user?.role === 'enterprise' && !user.is_subscription_active) {
      navigate('/entreprise/abonnement');
      return;
    }
    navigate(guide.actionPath);
  }

  const actionTitle = isAdmin && !isCurrent
    ? 'Voir les abonnements'
    : user?.role === 'enterprise' && !user.is_subscription_active
      ? 'Activer le forfait'
      : guide.action;

  return (
    <div
      className="page usage-guide-page"
      style={{ '--guide-accent': guide.color, '--guide-soft': guide.soft }}
    >
      <div className="page-header usage-guide-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCompass} /> Centre d’aide</span>
          <h1>Guide d’utilisation</h1>
          <p>Suivez un parcours clair, adapté à votre rôle et aux fonctions de votre formule.</p>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={handleAction}>
            {actionTitle} <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="usage-guide-switcher" role="tablist" aria-label="Guides par formule">
          {ADMIN_GUIDE_IDS.map((id) => {
            const item = USAGE_GUIDES[id];
            const active = selected === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? 'active' : ''}
                onClick={() => setSelected(id)}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
                {user?.current_plan === id && <small>Actuelle</small>}
              </button>
            );
          })}
        </div>
      )}

      <motion.section
        className="usage-guide-overview"
        key={selected}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="usage-guide-summary">
          <div className="usage-guide-plan-icon"><FontAwesomeIcon icon={guide.icon} /></div>
          <div>
            <div className="usage-guide-title-row">
              <span>Guide</span>
              {isAdmin && isCurrent && <strong><FontAwesomeIcon icon={faCircleCheck} /> Formule actuelle</strong>}
            </div>
            <h2>{guide.label}</h2>
            <p>{guide.intro}</p>
          </div>
        </div>

        <div className="usage-guide-features">
          <h2>Fonctionnalités incluses</h2>
          <ul>
            {guide.features.map((feature) => (
              <li key={feature}><FontAwesomeIcon icon={faCircleCheck} /> <span>{feature}</span></li>
            ))}
          </ul>
        </div>
      </motion.section>

      <div className="usage-guide-content">
        <section className="usage-guide-journey" aria-labelledby="guide-journey-title">
          <div className="usage-guide-section-heading">
            <span>Étapes</span>
            <h2 id="guide-journey-title">Parcours recommandé</h2>
          </div>
          <ol>
            {guide.steps.map(([title, description], index) => (
              <li key={title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="usage-guide-howtos" aria-labelledby="guide-howtos-title">
          <div className="usage-guide-section-heading">
            <span>Pratique</span>
            <h2 id="guide-howtos-title">Modes d’emploi</h2>
          </div>
          <div className="usage-guide-accordion-list">
            {guide.howtos.map((howto, index) => {
              const open = openHowTo === index;
              return (
                <article className={`usage-guide-accordion ${open ? 'open' : ''}`} key={howto.title}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenHowTo(open ? -1 : index)}
                  >
                    <span><FontAwesomeIcon icon={howto.icon} /></span>
                    <strong>{howto.title}</strong>
                    <FontAwesomeIcon className="usage-guide-chevron" icon={faChevronDown} />
                  </button>
                  {open && (
                    <ol>
                      {howto.items.map((item) => <li key={item}>{item}</li>)}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="usage-guide-tip">
        <FontAwesomeIcon icon={faLightbulb} />
        <div>
          <strong>Conseil</strong>
          <p>{guide.tip}</p>
        </div>
        <button className="secondary-btn" onClick={handleAction}>
          {actionTitle} <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </section>
    </div>
  );
}
