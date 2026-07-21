import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBell,
  faBolt,
  faChartColumn,
  faChartLine,
  faChevronDown,
  faCircleCheck,
  faClock,
  faClipboardQuestion,
  faCloudArrowUp,
  faDiagramProject,
  faFileImport,
  faGift,
  faGraduationCap,
  faMedal,
  faMobileScreenButton,
  faPenToSquare,
  faRankingStar,
  faRightToBracket,
  faRocket,
  faShareNodes,
  faShieldHalved,
  faUserPlus,
  faUserShield,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

const WHATSAPP_NUMBER = '221774006235';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
    <path d="M16.04 4C9.95 4 5 8.95 5 15.04c0 2.13.6 4.13 1.65 5.84L5 28l7.3-1.6a11 11 0 0 0 3.74.65h.01C22.13 27.05 27 22.1 27 16.01 27 9.92 22.13 4 16.04 4zm6.45 15.6c-.27.76-1.57 1.46-2.18 1.51-.58.05-1.12.26-3.78-.79-3.18-1.25-5.2-4.5-5.36-4.71-.16-.21-1.29-1.71-1.29-3.27 0-1.55.81-2.31 1.1-2.63.27-.3.59-.37.79-.37.2 0 .39 0 .56.01.18.01.43-.07.67.51.27.66.92 2.28 1 2.45.08.16.13.36.02.57-.1.21-.16.34-.32.53-.16.18-.34.41-.48.55-.16.16-.33.34-.14.66.19.32.84 1.39 1.81 2.25 1.25 1.11 2.3 1.46 2.62 1.62.32.16.51.13.7-.08.19-.21.81-.94 1.02-1.27.21-.32.43-.27.72-.16.29.11 1.86.88 2.18 1.04.32.16.53.24.61.37.08.14.08.78-.19 1.54z" />
  </svg>
);

const features = [
  { icon: faWandMagicSparkles, title: '4 façons de créer', desc: 'Manuellement, par import, en progressif ou depuis un texte déjà préparé.' },
  { icon: faClock, title: 'Programmation précise', desc: 'Définissez l’ouverture, la fermeture et la classe concernée en quelques clics.' },
  { icon: faChartLine, title: 'Résultats instantanés', desc: 'Les notes sont calculées automatiquement et réunies dans un tableau clair.' },
  { icon: faClipboardQuestion, title: 'Sondages anonymes', desc: 'Recueillez des avis et analysez chaque réponse avec la formule Complète.' },
  { icon: faShieldHalved, title: 'Cadre anti-triche', desc: 'Limitez les tentatives et sécurisez le déroulement de chaque évaluation.' },
  { icon: faShareNodes, title: 'Accès sans friction', desc: 'Partagez un lien public ou invitez vos apprenants avec un code de classe.' },
];

const plans = [
  {
    id: 'free',
    name: 'Gratuite',
    price: '0',
    icon: faGift,
    description: 'Les outils indispensables pour commencer.',
    features: ['QCM manuel', 'Import de QCM', 'QCM progressif'],
    excluded: ['Sondages', 'Analyse des questions ratées'],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'essential',
    name: 'Essentielle',
    price: '3 000',
    icon: faBolt,
    description: 'Toutes les fonctions de travail au quotidien.',
    features: ['Tout le socle QCM', 'Création assistée depuis un texte', 'Classes, partage, notes et exports'],
    excluded: ['Sondages', 'Analyse des questions ratées'],
    badge: 'Le bon équilibre',
    cta: 'Choisir Essentielle',
  },
  {
    id: 'premium',
    name: 'Complète',
    price: '5 000',
    icon: faMedal,
    description: 'Toute la puissance de QCM Pro, sans limite fonctionnelle.',
    features: ['Toutes les fonctionnalités', 'Sondages anonymes', 'Pourcentages des questions ratées'],
    excluded: [],
    cta: 'Choisir Complète',
  },
];

const faqs = [
  { q: 'La formule gratuite expire-t-elle ?', a: 'Non. Elle reste gratuite et donne accès à la création manuelle, à l’import et aux QCM progressifs.' },
  { q: 'Quelle est la différence entre 3 000 et 5 000 F CFA ?', a: 'La formule à 3 000 F CFA inclut toutes les fonctionnalités sauf les sondages et l’analyse des questions les plus ratées. Ces deux outils sont inclus à 5 000 F CFA.' },
  { q: 'Comment les apprenants accèdent-ils aux QCM ?', a: 'Ils peuvent rejoindre une classe avec un code ou ouvrir directement un lien public, selon votre méthode de diffusion.' },
  { q: 'Quels moyens de paiement sont acceptés ?', a: 'Les paiements passent par PayTech et peuvent être effectués avec Wave, Orange Money ou une carte bancaire.' },
  { q: 'L’application mobile est-elle déjà téléchargeable ?', a: 'Elle est en préparation. La version mobile sera annoncée prochainement sur QCM Pro.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour, je souhaite des informations sur QCM Pro.')}`;
  const ease = [0.22, 1, 0.36, 1];
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } };
  const reveal = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.16 }, variants: stagger };

  return (
    <div className="landing landing-v2">
      <motion.header className="landing-nav" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, ease }}>
        <Link className="brand landing-brand" to="/" aria-label="Accueil QCM Pro">
          <img src="/logo.png" className="brand-logo" alt="QCM Pro" />
        </Link>
        <nav className="landing-nav-links" aria-label="Navigation de présentation">
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#mobile">Application</a>
          <a href="#tarifs">Tarifs</a>
        </nav>
        <div className="landing-nav-actions">
          <Link className="secondary-btn" to="/login"><FontAwesomeIcon icon={faRightToBracket} /> Connexion</Link>
          <Link className="primary-btn" to="/register-admin">Créer mon espace</Link>
        </div>
      </motion.header>

      <section className="landing-hero">
        <motion.div className="landing-hero-text" initial="hidden" animate="show" variants={stagger}>
          <motion.span className="landing-badge" variants={fadeUp}><FontAwesomeIcon icon={faGift} /> Une formule gratuite, pour toujours</motion.span>
          <motion.h1 variants={fadeUp}>Transformez vos questions en <span>évaluations qui font progresser.</span></motion.h1>
          <motion.p variants={fadeUp}>Créez des QCM soignés, partagez-les en quelques secondes et comprenez les résultats sans tableur compliqué.</motion.p>
          <motion.div className="landing-cta" variants={fadeUp}>
            <Link className="primary-btn large" to="/register-admin">Créer un QCM gratuitement <FontAwesomeIcon icon={faArrowRight} /></Link>
            <a className="secondary-btn large" href="#tarifs">Voir les 3 formules</a>
          </motion.div>
          <motion.div className="hero-proof" variants={fadeUp}>
            <span><FontAwesomeIcon icon={faCircleCheck} /> Sans carte bancaire</span>
            <span><FontAwesomeIcon icon={faCircleCheck} /> Mise en route rapide</span>
            <span><FontAwesomeIcon icon={faCircleCheck} /> Apprenants gratuits</span>
          </motion.div>
        </motion.div>

        <motion.div className="landing-hero-visual dashboard-preview" initial={{ opacity: 0, x: 30, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.22, duration: 0.7, ease }}>
          <div className="preview-window">
            <div className="preview-window-bar"><span /><span /><span /><small>app.qcmpro</small></div>
            <div className="preview-layout">
              <aside><div className="preview-logo">Q</div><i className="active" /><i /><i /><i /></aside>
              <div className="preview-content">
                <div className="preview-heading"><div><small>Bonjour Aïcha</small><strong>Votre espace QCM</strong></div><span>+ Nouveau</span></div>
                <div className="preview-kpis">
                  <div><FontAwesomeIcon icon={faFileImport} /><span><strong>24</strong><small>QCM créés</small></span></div>
                  <div><FontAwesomeIcon icon={faGraduationCap} /><span><strong>186</strong><small>Participants</small></span></div>
                  <div><FontAwesomeIcon icon={faRankingStar} /><span><strong>82%</strong><small>Score moyen</small></span></div>
                </div>
                <div className="preview-chart">
                  <div><strong>Participation</strong><small>7 derniers jours</small></div>
                  <div className="preview-bars">{[42, 65, 48, 78, 60, 91, 74].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
                </div>
              </div>
            </div>
          </div>
          <motion.div className="floating-card hero-score" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}>
            <FontAwesomeIcon icon={faChartLine} /><div><strong>+18%</strong><small>de participation</small></div>
          </motion.div>
          <motion.div className="floating-card hero-live" animate={{ y: [0, 9, 0] }} transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}>
            <span className="live-dot" /><div><strong>QCM en cours</strong><small>32 réponses reçues</small></div>
          </motion.div>
          <div className="hero-glow" />
        </motion.div>
      </section>

      <section className="landing-trust-strip" aria-label="Points forts">
        <span><FontAwesomeIcon icon={faPenToSquare} /> Création intuitive</span>
        <span><FontAwesomeIcon icon={faCloudArrowUp} /> Import Word & PDF</span>
        <span><FontAwesomeIcon icon={faDiagramProject} /> Diagnostics progressifs</span>
        <span><FontAwesomeIcon icon={faChartColumn} /> Données lisibles</span>
      </section>

      <motion.section className="landing-steps" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Simple dès le premier QCM</span><h2>De l’idée aux résultats en trois temps</h2></motion.div>
        <div className="steps-grid">
          {[
            { n: '01', icon: faPenToSquare, title: 'Créez', desc: 'Saisissez, importez ou construisez un diagnostic progressif.' },
            { n: '02', icon: faShareNodes, title: 'Diffusez', desc: 'Programmez votre test et partagez un lien ou un code de classe.' },
            { n: '03', icon: faRankingStar, title: 'Analysez', desc: 'Retrouvez les notes et les indicateurs utiles dès la soumission.' },
          ].map((step) => (
            <motion.article className="step-card" key={step.n} variants={fadeUp}>
              <span className="step-number">{step.n}</span><div className="step-icon"><FontAwesomeIcon icon={step.icon} /></div><h3>{step.title}</h3><p>{step.desc}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="landing-features" id="fonctionnalites" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Un espace vraiment complet</span><h2>Moins de manipulation, plus de temps pour accompagner</h2><p>Chaque outil est conçu pour rendre la préparation et le suivi plus fluides.</p></motion.div>
        <div className="landing-feature-grid">
          {features.map((feature) => (
            <motion.article className="landing-feature" key={feature.title} variants={fadeUp} whileHover={{ y: -6 }}>
              <div className="landing-feature-icon"><FontAwesomeIcon icon={feature.icon} /></div><h3>{feature.title}</h3><p>{feature.desc}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="landing-mobile" id="mobile" {...reveal}>
        <motion.div className="mobile-showcase" variants={fadeUp}>
          <div className="phone-orbit orbit-one" /><div className="phone-orbit orbit-two" />
          <div className="phone-frame">
            <div className="phone-speaker" />
            <div className="phone-screen">
              <div className="phone-status"><span>9:41</span><span>● ●</span></div>
              <div className="phone-app-head"><div className="phone-app-logo">Q</div><FontAwesomeIcon icon={faBell} /></div>
              <p>Bonjour Mariam 👋</p><h3>Mes QCM</h3>
              <div className="phone-progress"><span><FontAwesomeIcon icon={faRocket} /></span><div><small>Progression</small><strong>3 QCM terminés</strong><i><b /></i></div></div>
              <div className="phone-quiz-card"><span className="phone-card-icon purple"><FontAwesomeIcon icon={faDiagramProject} /></span><div><strong>Diagnostic digital</strong><small>12 questions · 15 min</small></div><FontAwesomeIcon icon={faArrowRight} /></div>
              <div className="phone-quiz-card"><span className="phone-card-icon green"><FontAwesomeIcon icon={faGraduationCap} /></span><div><strong>Culture générale</strong><small>20 questions · Disponible</small></div><FontAwesomeIcon icon={faArrowRight} /></div>
              <div className="phone-nav"><FontAwesomeIcon icon={faRocket} /><FontAwesomeIcon icon={faClipboardQuestion} /><FontAwesomeIcon icon={faChartLine} /></div>
            </div>
          </div>
          <div className="coming-soon-pill"><FontAwesomeIcon icon={faMobileScreenButton} /> Disponible bientôt</div>
        </motion.div>
        <motion.div className="mobile-copy" variants={fadeUp}>
          <span className="section-kicker"><FontAwesomeIcon icon={faMobileScreenButton} /> Application mobile</span>
          <h2>QCM Pro vous accompagnera bientôt partout.</h2>
          <p>Une expérience mobile pensée pour retrouver ses QCM, recevoir les alertes et consulter ses résultats depuis son téléphone.</p>
          <ul>
            <li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Une interface rapide</strong><small>Accès direct aux évaluations à venir.</small></span></li>
            <li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Des notifications utiles</strong><small>Ne manquez plus l’ouverture d’un QCM.</small></span></li>
            <li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Les résultats dans la poche</strong><small>Suivez votre progression où que vous soyez.</small></span></li>
          </ul>
          <div className="mobile-waitlist-note">En développement · Lancement prochainement</div>
        </motion.div>
      </motion.section>

      <motion.section className="landing-pricing" id="tarifs" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Des tarifs sans surprise</span><h2>Trois formules, selon votre façon de travailler</h2><p>Les apprenants utilisent toujours la plateforme gratuitement.</p></motion.div>
        <div className="pricing-grid pricing-grid-three">
          {plans.map((plan) => (
            <motion.article className={`pricing-card ${plan.id === 'essential' ? 'featured' : ''}`} key={plan.id} variants={fadeUp} whileHover={{ y: -7 }}>
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
              <div className={`pricing-icon ${plan.id}`}><FontAwesomeIcon icon={plan.icon} /></div>
              <div><h3>{plan.name}</h3><p className="pricing-description">{plan.description}</p></div>
              <div className="pricing-price"><span className="pricing-amount">{plan.price === '0' ? 'Gratuit' : plan.price}</span>{plan.price !== '0' && <span className="pricing-unit">F CFA / mois</span>}</div>
              <ul className="pricing-features">
                {plan.features.map((feature) => <li key={feature}><FontAwesomeIcon icon={faCircleCheck} /> {feature}</li>)}
                {plan.excluded.map((feature) => <li className="excluded" key={feature}><FontAwesomeIcon icon={faXmark} /> {feature}</li>)}
              </ul>
              <Link className={plan.id === 'essential' ? 'primary-btn large' : 'secondary-btn large'} to="/register-admin">{plan.cta} <FontAwesomeIcon icon={faArrowRight} /></Link>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="landing-faq" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Questions fréquentes</span><h2>Tout ce qu’il faut savoir</h2></motion.div>
        <div className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <motion.article className={`faq-item ${isOpen ? 'open' : ''}`} key={item.q} variants={fadeUp}>
                <button type="button" className="faq-question" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : index)}><span>{item.q}</span><FontAwesomeIcon icon={faChevronDown} className="faq-chevron" /></button>
                <div className="faq-answer"><div className="faq-answer-inner"><p>{item.a}</p></div></div>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      <motion.section className="landing-final" initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.6, ease }}>
        <span>Votre prochain QCM peut être prêt aujourd’hui.</span><h2>Commencez gratuitement, évoluez quand vous en avez besoin.</h2><p>Aucune carte bancaire n’est demandée pour ouvrir votre espace formateur.</p>
        <Link className="primary-btn large" to="/register-admin">Créer mon espace gratuit <FontAwesomeIcon icon={faArrowRight} /></Link>
      </motion.section>

      <footer className="landing-footer">
        <div className="brand landing-brand"><img src="/logo.png" className="brand-logo" alt="QCM Pro" /></div>
        <small>© {new Date().getFullYear()} QCM Pro — Évaluez mieux, accompagnez davantage.</small>
        <div><a href="#fonctionnalites">Fonctionnalités</a><a href="#tarifs">Tarifs</a><Link to="/login">Connexion</Link></div>
      </footer>

      <motion.a className="whatsapp-fab" href={waLink} target="_blank" rel="noopener noreferrer" aria-label="Contacter QCM Pro sur WhatsApp" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring' }} whileHover={{ scale: 1.1 }}><WhatsAppIcon /></motion.a>
    </div>
  );
}
