import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBell,
  faBrain,
  faBuilding,
  faChartColumn,
  faChartLine,
  faChevronDown,
  faCircleCheck,
  faClipboardQuestion,
  faDiagramProject,
  faFileImport,
  faGift,
  faGraduationCap,
  faMobileScreenButton,
  faPenToSquare,
  faRankingStar,
  faRightToBracket,
  faRocket,
  faShareNodes,
  faUsers,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { PUBLIC_OFFERS } from '../config/offers.js';

const WHATSAPP_NUMBER = '221774006235';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
    <path d="M16.04 4C9.95 4 5 8.95 5 15.04c0 2.13.6 4.13 1.65 5.84L5 28l7.3-1.6a11 11 0 0 0 3.74.65h.01C22.13 27.05 27 22.1 27 16.01 27 9.92 22.13 4 16.04 4zm6.45 15.6c-.27.76-1.57 1.46-2.18 1.51-.58.05-1.12.26-3.78-.79-3.18-1.25-5.2-4.5-5.36-4.71-.16-.21-1.29-1.71-1.29-3.27 0-1.55.81-2.31 1.1-2.63.27-.3.59-.37.79-.37.2 0 .39 0 .56.01.18.01.43-.07.67.51.27.66.92 2.28 1 2.45.08.16.13.36.02.57-.1.21-.16.34-.32.53-.16.18-.34.41-.48.55-.16.16-.33.34-.14.66.19.32.84 1.39 1.81 2.25 1.25 1.11 2.3 1.46 2.62 1.62.32.16.51.13.7-.08.19-.21.81-.94 1.02-1.27.21-.32.43-.27.72-.16.29.11 1.86.88 2.18 1.04.32.16.53.24.61.37.08.14.08.78-.19 1.54z" />
  </svg>
);

const audienceDetails = {
  student: {
    kicker: 'Pour apprendre',
    title: 'Un accès simple pour répondre et progresser.',
    summary: 'L’élève rejoint sa classe, passe ses QCM et retrouve ses résultats dans un espace clair.',
    scope: 'Toujours gratuit',
  },
  trainer: {
    kicker: 'Pour transmettre',
    title: 'Toute la puissance QCM, sans option cachée.',
    summary: 'Le formateur crée, diffuse, corrige et analyse ses évaluations depuis un seul tableau de bord.',
    scope: 'Toutes les fonctionnalités QCM',
  },
  enterprise: {
    kicker: 'Pour accompagner',
    title: 'Un parcours exclusivement dédié aux soft skills.',
    summary: 'L’entreprise mesure le Mindset, structure les entretiens et suit la progression de ses collaborateurs.',
    scope: 'Soft skills uniquement',
  },
};

const productTracks = [
  {
    id: 'trainer',
    label: 'Espace Formateur',
    icon: faClipboardQuestion,
    title: 'Créez et pilotez vos QCM de bout en bout.',
    description: 'Toutes les fonctionnalités pédagogiques sont incluses dans un forfait unique.',
    to: '/register-admin',
    cta: 'Découvrir l’espace Formateur',
    points: [
      { icon: faWandMagicSparkles, title: '4 modes de création', desc: 'Manuel, import, progressif ou création assistée depuis un texte.' },
      { icon: faShareNodes, title: 'Diffusion flexible', desc: 'Classes, codes d’accès, liens publics et programmation précise.' },
      { icon: faChartLine, title: 'Analyses complètes', desc: 'Notes, statistiques, sondages et exports immédiatement exploitables.' },
    ],
  },
  {
    id: 'enterprise',
    label: 'Espace Entreprise',
    icon: faBrain,
    title: 'Développez les soft skills avec un suivi structuré.',
    description: 'Des menus distincts du forfait Formateur, centrés sur les collaborateurs et le Mindset.',
    to: '/register-enterprise',
    cta: 'Découvrir l’espace Entreprise',
    points: [
      { icon: faUsers, title: 'Collaborateurs centralisés', desc: 'Créez les profils et gardez une vision claire de chaque parcours.' },
      { icon: faBrain, title: 'Diagnostic en 4 piliers', desc: 'Confiance, exécution, innovation et création de valeur.' },
      { icon: faDiagramProject, title: 'Progression T0 à T+6', desc: 'Comparez les entretiens, formalisez les actions et mesurez l’évolution.' },
    ],
  },
];

const faqs = [
  { q: 'L’offre Élève est-elle payante ?', a: 'Non. Les élèves rejoignent gratuitement leur classe avec le code transmis par leur formateur.' },
  { q: 'Que comprend le forfait Formateur ?', a: 'Le forfait Formateur à 5 000 F CFA par mois donne accès à toutes les fonctionnalités Check Performance, sans restriction.' },
  { q: 'À quoi sert le forfait Entreprise ?', a: 'Il est dédié aux soft skills : gestion des collaborateurs, entretiens Mindset, comparaison T0/T+6 mois et plans d’action.' },
  { q: 'Les espaces Formateur et Entreprise ont-ils les mêmes menus ?', a: 'Non. Le Formateur dispose de tous les outils QCM, tandis que l’Entreprise possède des menus distincts consacrés aux collaborateurs, aux diagnostics Mindset et au suivi des soft skills.' },
  { q: 'Comment les apprenants accèdent-ils aux QCM ?', a: 'Ils peuvent rejoindre une classe avec un code ou ouvrir directement un lien public, selon votre méthode de diffusion.' },
  { q: 'Quels moyens de paiement sont acceptés ?', a: 'Les paiements passent par PayTech et peuvent être effectués avec Wave, Orange Money ou une carte bancaire.' },
  { q: 'L’application mobile est-elle déjà téléchargeable ?', a: 'Elle est en préparation. La version mobile sera annoncée prochainement sur Check Performance.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour, je souhaite des informations sur Check Performance.')}`;
  const ease = [0.22, 1, 0.36, 1];
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } };
  const reveal = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.16 }, variants: stagger };

  return (
    <div className="landing landing-v2">
      <motion.header className="landing-nav" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, ease }}>
        <Link className="brand landing-brand" to="/" aria-label="Accueil Check Performance">
          <img src="/cp.png?v=2" className="brand-logo" alt="Check Performance" />
        </Link>
        <nav className="landing-nav-links" aria-label="Navigation de présentation">
          <a href="#solutions">Solutions</a>
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#tarifs">Tarifs</a>
        </nav>
        <div className="landing-nav-actions">
          <Link className="secondary-btn" to="/login"><FontAwesomeIcon icon={faRightToBracket} /> Connexion</Link>
          <a className="primary-btn" href="#tarifs">Choisir mon espace</a>
        </div>
      </motion.header>

      <section className="landing-hero">
        <motion.div className="landing-hero-text" initial="hidden" animate="show" variants={stagger}>
          <motion.span className="landing-badge" variants={fadeUp}><FontAwesomeIcon icon={faGift} /> Trois espaces, une plateforme</motion.span>
          <motion.h1 variants={fadeUp}>Évaluez les connaissances. <span>Développez les compétences humaines.</span></motion.h1>
          <motion.p variants={fadeUp}>Check Performance réunit un espace gratuit pour les élèves, tous les outils QCM pour les formateurs et un parcours Mindset distinct pour les entreprises.</motion.p>
          <motion.div className="landing-cta" variants={fadeUp}>
            <a className="primary-btn large" href="#solutions">Découvrir mon espace <FontAwesomeIcon icon={faArrowRight} /></a>
            <a className="secondary-btn large" href="#tarifs">Comparer les forfaits</a>
          </motion.div>
          <motion.div className="hero-proof" variants={fadeUp}>
            <span><FontAwesomeIcon icon={faCircleCheck} /> Élèves gratuits</span>
            <span><FontAwesomeIcon icon={faCircleCheck} /> Formateurs tout inclus</span>
            <span><FontAwesomeIcon icon={faCircleCheck} /> Entreprises 100 % soft skills</span>
          </motion.div>
        </motion.div>

        <motion.div className="landing-hero-visual dashboard-preview" initial={{ opacity: 0, x: 30, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.22, duration: 0.7, ease }}>
          <div className="preview-window">
            <div className="preview-window-bar"><span /><span /><span /><small>app.checkperformance</small></div>
            <div className="preview-layout">
              <aside><div className="preview-logo">Q</div><i className="active" /><i /><i /><i /></aside>
              <div className="preview-content">
                <div className="preview-heading"><div><small>Bonjour Aïcha</small><strong>Votre vue d’ensemble</strong></div><span>3 espaces</span></div>
                <div className="preview-kpis">
                  <div><FontAwesomeIcon icon={faGraduationCap} /><span><strong>186</strong><small>Participants</small></span></div>
                  <div><FontAwesomeIcon icon={faFileImport} /><span><strong>24</strong><small>Évaluations</small></span></div>
                  <div><FontAwesomeIcon icon={faBuilding} /><span><strong>74</strong><small>Collaborateurs</small></span></div>
                </div>
                <div className="preview-chart">
                  <div><strong>Progression globale</strong><small>6 derniers mois</small></div>
                  <div className="preview-bars">{[42, 65, 48, 78, 60, 91, 74].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
                </div>
              </div>
            </div>
          </div>
          <motion.div className="floating-card hero-score" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}>
            <FontAwesomeIcon icon={faBrain} /><div><strong>4 piliers</strong><small>Mindset Techco</small></div>
          </motion.div>
          <motion.div className="floating-card hero-live" animate={{ y: [0, 9, 0] }} transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}>
            <span className="live-dot" /><div><strong>Suivi T+6</strong><small>Progression consolidée</small></div>
          </motion.div>
          <div className="hero-glow" />
        </motion.div>
      </section>

      <section className="landing-trust-strip" aria-label="Points forts">
        <span><FontAwesomeIcon icon={faGraduationCap} /> Élèves gratuits</span>
        <span><FontAwesomeIcon icon={faWandMagicSparkles} /> QCM tout inclus</span>
        <span><FontAwesomeIcon icon={faBrain} /> Diagnostic Mindset</span>
        <span><FontAwesomeIcon icon={faChartColumn} /> Suivi T0 → T+6</span>
      </section>

      <motion.section className="landing-solutions" id="solutions" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>À chacun son espace</span><h2>Un parcours clair pour chaque objectif</h2><p>Chaque profil retrouve uniquement les outils dont il a besoin, avec une navigation et des actions adaptées.</p></motion.div>
        <div className="solution-grid">
          {PUBLIC_OFFERS.map((offer) => {
            const details = audienceDetails[offer.id];
            return (
              <motion.article className={`solution-card ${offer.id}`} key={offer.id} variants={fadeUp} whileHover={{ y: -7 }}>
                <div className="solution-card-head">
                  <span className="solution-icon"><FontAwesomeIcon icon={offer.icon} /></span>
                  <span className="solution-scope">{details.scope}</span>
                </div>
                <small>{details.kicker}</small>
                <h3>{offer.name}</h3>
                <h4>{details.title}</h4>
                <p>{details.summary}</p>
                <ul>
                  {offer.features.map((feature) => <li key={feature}><FontAwesomeIcon icon={faCircleCheck} /> {feature}</li>)}
                </ul>
                <Link to={offer.to}>{offer.cta} <FontAwesomeIcon icon={faArrowRight} /></Link>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      <motion.section className="landing-steps" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Simple dès le premier jour</span><h2>Du besoin à la progression en trois temps</h2></motion.div>
        <div className="steps-grid">
          {[
            { n: '01', icon: faPenToSquare, title: 'Choisissez', desc: 'Ouvrez l’espace Élève, Formateur ou Entreprise adapté à votre objectif.' },
            { n: '02', icon: faRocket, title: 'Lancez', desc: 'Rejoignez un QCM, créez une évaluation ou démarrez un diagnostic Mindset.' },
            { n: '03', icon: faRankingStar, title: 'Progressez', desc: 'Retrouvez les résultats, les indicateurs et les actions utiles au bon endroit.' },
          ].map((step) => (
            <motion.article className="step-card" key={step.n} variants={fadeUp}>
              <span className="step-number">{step.n}</span><div className="step-icon"><FontAwesomeIcon icon={step.icon} /></div><h3>{step.title}</h3><p>{step.desc}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="landing-features" id="fonctionnalites" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Deux usages professionnels distincts</span><h2>Le bon outil, dans le bon espace</h2><p>Les fonctionnalités QCM restent réservées aux formateurs. Les entreprises disposent d’un environnement séparé, entièrement consacré aux soft skills.</p></motion.div>
        <div className="product-track-grid">
          {productTracks.map((track) => (
            <motion.article className={`product-track ${track.id}`} key={track.id} variants={fadeUp}>
              <div className="product-track-intro">
                <span className="product-track-icon"><FontAwesomeIcon icon={track.icon} /></span>
                <small>{track.label}</small>
                <h3>{track.title}</h3>
                <p>{track.description}</p>
                <Link className="product-track-link" to={track.to}>{track.cta} <FontAwesomeIcon icon={faArrowRight} /></Link>
              </div>
              <div className="product-track-points">
                {track.points.map((point) => (
                  <div className="product-track-point" key={point.title}>
                    <span><FontAwesomeIcon icon={point.icon} /></span>
                    <div><strong>{point.title}</strong><p>{point.desc}</p></div>
                  </div>
                ))}
              </div>
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
          <span className="section-kicker"><FontAwesomeIcon icon={faMobileScreenButton} /> Pour les élèves et formateurs</span>
          <h2>L’expérience QCM vous accompagnera bientôt partout.</h2>
          <p>Une application mobile pensée pour rejoindre ses évaluations, recevoir les alertes et consulter ses résultats depuis son téléphone.</p>
          <ul>
            <li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Une interface rapide</strong><small>Accès direct aux évaluations à venir.</small></span></li>
            <li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Des notifications utiles</strong><small>Ne manquez plus l’ouverture d’un QCM.</small></span></li>
            <li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Les résultats dans la poche</strong><small>Suivez votre progression où que vous soyez.</small></span></li>
          </ul>
          <div className="mobile-waitlist-note">En développement · Lancement prochainement</div>
        </motion.div>
      </motion.section>

      <motion.section className="landing-pricing" id="tarifs" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Des tarifs sans surprise</span><h2>Un forfait adapté à chaque public</h2><p>Élève gratuit, Formateur tout inclus, Entreprise dédiée aux soft skills : les usages ne sont jamais mélangés.</p></motion.div>
        <div className="pricing-grid pricing-grid-three">
          {PUBLIC_OFFERS.map((plan) => (
            <motion.article className={`pricing-card ${plan.id === 'trainer' ? 'featured' : ''}`} key={plan.id} variants={fadeUp} whileHover={{ y: -7 }}>
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
              <div className={`pricing-icon ${plan.id}`}><FontAwesomeIcon icon={plan.icon} /></div>
              <span className={`pricing-audience ${plan.id}`}>{audienceDetails[plan.id].kicker}</span>
              <div><h3>{plan.name}</h3><p className="pricing-description">{plan.description}</p></div>
              <div className="pricing-price"><span className="pricing-amount">{plan.price === 0 ? 'Gratuit' : plan.price.toLocaleString('fr-FR')}</span>{plan.price !== 0 && <span className="pricing-unit">F CFA / mois</span>}</div>
              <div className={`pricing-scope ${plan.id}`}><FontAwesomeIcon icon={faCircleCheck} /> {audienceDetails[plan.id].scope}</div>
              <ul className="pricing-features">
                {plan.features.map((feature) => <li key={feature}><FontAwesomeIcon icon={faCircleCheck} /> {feature}</li>)}
                {plan.excluded.map((feature) => <li className="excluded" key={feature}><FontAwesomeIcon icon={faXmark} /> {feature}</li>)}
              </ul>
              <Link className={plan.id === 'trainer' ? 'primary-btn large' : 'secondary-btn large'} to={plan.to}>{plan.cta} <FontAwesomeIcon icon={faArrowRight} /></Link>
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
        <span>Trois publics, trois parcours clairs.</span><h2>Choisissez l’espace qui correspond à votre objectif.</h2><p>Apprendre gratuitement, créer des QCM sans limite fonctionnelle ou développer les soft skills de vos équipes.</p>
        <div className="landing-final-actions">
          <Link className="primary-btn large" to="/register-admin">Espace Formateur <FontAwesomeIcon icon={faArrowRight} /></Link>
          <Link className="secondary-btn large" to="/register-enterprise">Espace Entreprise <FontAwesomeIcon icon={faArrowRight} /></Link>
        </div>
        <Link className="landing-final-student" to="/register">Je suis élève — créer mon compte gratuit</Link>
      </motion.section>

      <footer className="landing-footer">
        <div className="brand landing-brand"><img src="/cp.png?v=2" className="brand-logo" alt="Check Performance" /></div>
        <small>© {new Date().getFullYear()} Check Performance — Apprendre, évaluer et développer les soft skills.</small>
        <div><a href="#solutions">Solutions</a><a href="#tarifs">Tarifs</a><Link to="/login">Connexion</Link></div>
      </footer>

      <motion.a className="whatsapp-fab" href={waLink} target="_blank" rel="noopener noreferrer" aria-label="Contacter Check Performance sur WhatsApp" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring' }} whileHover={{ scale: 1.1 }}><WhatsAppIcon /></motion.a>
    </div>
  );
}
