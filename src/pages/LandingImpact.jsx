import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faArrowTrendUp, faBrain, faBuilding, faCalendarCheck, faChartColumn,
  faChartLine, faChevronDown, faCircleCheck, faClipboardQuestion, faDownload, faFileLines,
  faFlask, faGraduationCap, faLaptop, faPeopleGroup, faRightToBracket, faShieldHalved,
  faUserTie, faWifi,
} from '@fortawesome/free-solid-svg-icons';
import { PublicFooter, PublicMobileMenu, bookingUrl, trackPublicIntent, whatsappUrl } from '../components/PublicChrome.jsx';
import { formatCfa, PRICE_CATALOG } from '../config/offers.js';

const commercialLaunchEnabled = import.meta.env.VITE_COMMERCIAL_LAUNCH_ENABLED === 'true';

const professionalTracks = [
  {
    id: 'knowledge', label: 'QCM en ligne et évaluation des acquis', icon: faClipboardQuestion,
    title: 'Créez vos QCM, évaluez et restituez par cohorte.',
    description: 'QCM manuels, importés ou progressifs, liens publics sans compte, corrections, statistiques et rapports formateur.',
    to: '/qcm-en-ligne', cta: 'Découvrir le logiciel de QCM en ligne',
    points: ['QCM de positionnement ou évaluation finale', 'Classes, cohortes et diffusion publique', 'Résultats individuels et rapports'],
  },
  {
    id: 'soft-skills', label: 'Développement des soft skills', icon: faBrain,
    title: 'Structurez les entretiens et observez la progression.',
    description: 'Diagnostic Mindset en quatre piliers, verbatims, plan d’action et comparaison entre le T0 et le suivi à six mois.',
    to: '/developpement-soft-skills', cta: 'Découvrir le parcours soft skills',
    points: ['20 critères comportementaux', 'Actions et besoins d’accompagnement', 'Comparaison T0–T+6 par pilier'],
  },
];

const targetAudiences = [
  { icon: faBuilding, title: 'Centres de formation', text: 'Plusieurs cohortes, des rapports homogènes et un cadre commercial adapté à l’équipe.' },
  { icon: faUserTie, title: 'Consultants RH', text: 'Une méthode documentée pour conduire les entretiens et restituer la progression.' },
  { icon: faPeopleGroup, title: 'Organismes d’employabilité', text: 'Des évaluations accessibles sur téléphone et des résultats lisibles par parcours.' },
];

const evidenceCards = [
  { icon: faClipboardQuestion, label: 'Sans compte', title: 'QCM public de démonstration', text: 'Passez cinq questions et recevez la correction immédiatement.', to: '/demo-qcm', cta: 'Tester maintenant' },
  { icon: faFileLines, label: 'Données fictives', title: 'Exemple de rapport formateur', text: 'Complétion, moyenne, distribution et questions à retravailler.', href: '/rapports/exemple-rapport-formateur.html', cta: 'Voir le rapport' },
  { icon: faArrowTrendUp, label: 'Données synthétiques', title: 'Rapport de progression T0–T+6', text: 'Maquette cible avec écarts par pilier, actions suivies et limites d’interprétation.', href: '/rapports/exemple-rapport-t0-t6.html', cta: 'Voir la maquette' },
  { icon: faFlask, label: 'Version 1.0', title: 'Méthodologie Mindset Techco', text: 'Piliers, échelle, protocole, garde-fous et limites explicités.', to: '/ressources#methode', cta: 'Lire la méthode' },
];

const commercialPlans = [
  { id: 'trainer', name: 'Formateur', price: formatCfa(PRICE_CATALOG.trainer.monthly), unit: 'F CFA / mois', detail: `ou ${formatCfa(PRICE_CATALOG.trainer.annual)} F CFA / an`, badge: '1er mois offert', features: ['Toutes les fonctions QCM', 'Sans carte pendant l’essai', 'Paiement non reconduit automatiquement'], ...(commercialLaunchEnabled ? { to: '/register-admin', cta: 'Démarrer sans carte' } : { href: bookingUrl, cta: 'Candidater au pilote', interestEvent: 'pilot_interest_clicked' }) },
  { id: 'center', name: 'Centre de formation', price: `${formatCfa(PRICE_CATALOG.center.monthlyMin)}–${formatCfa(PRICE_CATALOG.center.monthlyMax)}`, unit: 'F CFA / mois', detail: 'selon formateurs, cohortes et reporting', features: ['Comptes formateurs séparés au lancement', 'Consolidation livrée manuellement', 'Devis et démonstration préalables'], href: bookingUrl, cta: 'Réserver une démonstration', interestEvent: 'demo_booking_clicked' },
  { id: 'enterprise', name: 'Entreprise Essentiel', price: formatCfa(PRICE_CATALOG.enterprise.monthly), unit: 'F CFA / mois', detail: `jusqu’à ${PRICE_CATALOG.enterprise.employeeLimit} collaborateurs`, features: ['Diagnostic Mindset', 'Entretiens T0 et suivi', 'Plans d’action et progression'], ...(commercialLaunchEnabled ? { to: '/register-enterprise', cta: 'Créer l’espace entreprise' } : { href: bookingUrl, cta: 'Candidater au pilote', interestEvent: 'pilot_interest_clicked' }) },
  { id: 'team', name: 'Entreprise Équipe', price: formatCfa(PRICE_CATALOG.enterpriseTeam.monthly), unit: 'F CFA / mois', detail: `jusqu’à ${PRICE_CATALOG.enterpriseTeam.employeeLimit} collaborateurs`, features: ['Tout Essentiel', 'Capacité équipe étendue', 'Pilote payant déductible du contrat annuel'], href: bookingUrl, cta: 'Cadrer un pilote', interestEvent: 'pilot_interest_clicked' },
];

const faqs = [
  { q: 'Le premier mois Formateur est-il vraiment gratuit ?', a: 'Oui. L’inscription active les fonctions Formateur pendant un mois, sans carte bancaire. Aucun débit automatique n’est déclenché à la fin.' },
  { q: 'Comment renouveler ou résilier ?', a: 'Le tunnel actuel fonctionne par périodes payées à l’avance et sans reconduction automatique. Pour arrêter, il suffit de ne pas renouveler. Un contrat sur devis précise ses propres délais.' },
  { q: 'Un centre peut-il choisir une offre en ligne ?', a: 'L’offre Centre est cadrée après une démonstration, car le tarif dépend du nombre de formateurs, de cohortes et du niveau de consolidation attendu.' },
  { q: 'Comment fonctionne le pilote entreprise ?', a: 'Le pilote est payant, limité dans le temps et défini par devis. Son montant, hors prestations non récurrentes, est déduit du contrat annuel signé dans les 30 jours suivant sa fin.' },
  { q: 'Les participants doivent-ils créer un compte ?', a: 'Non pour un QCM partagé par lien public. L’organisateur peut toutefois demander un nom ou un référentiel afin de restituer les résultats.' },
  { q: 'Le score Mindset peut-il décider d’un recrutement ou d’une promotion ?', a: 'Non. Il sert de support d’entretien et ne doit jamais fonder seul une décision RH, une sanction, une promotion ou un recrutement.' },
  { q: 'Une application mobile native est-elle prévue ?', a: 'La priorité est l’application web responsive, conçue pour le téléphone et les connexions moyennes. L’installation PWA doit encore être validée sur les appareils cibles ; le natif attendra la preuve de rétention.' },
];

const WhatsAppIcon = () => <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M16.04 4C9.95 4 5 8.95 5 15.04c0 2.13.6 4.13 1.65 5.84L5 28l7.3-1.6a11 11 0 0 0 3.74.65h.01C22.13 27.05 27 22.1 27 16.01 27 9.92 22.13 4 16.04 4zm6.45 15.6c-.27.76-1.57 1.46-2.18 1.51-.58.05-1.12.26-3.78-.79-3.18-1.25-5.2-4.5-5.36-4.71-.16-.21-1.29-1.71-1.29-3.27 0-1.55.81-2.31 1.1-2.63.27-.3.59-.37.79-.37.2 0 .39 0 .56.01.18.01.43-.07.67.51.27.66.92 2.28 1 2.45.08.16.13.36.02.57-.1.21-.16.34-.32.53-.16.18-.34.41-.48.55-.16.16-.33.34-.14.66.19.32.84 1.39 1.81 2.25 1.25 1.11 2.3 1.46 2.62 1.62.32.16.51.13.7-.08.19-.21.81-.94 1.02-1.27.21-.32.43-.27.72-.16.29.11 1.86.88 2.18 1.04.32.16.53.24.61.37.08.14.08.78-.19 1.54z" /></svg>;

export default function LandingImpact() {
  const [openFaq, setOpenFaq] = useState(null);
  const ease = [0.22, 1, 0.36, 1];
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } };
  const reveal = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.14 }, variants: stagger };

  return (
    <div className="landing landing-v2 impact-landing">
      <motion.header className="landing-nav" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, ease }}>
        <Link className="brand landing-brand" to="/" aria-label="Accueil Check Performance"><picture className="brand-picture"><source media="(max-width: 980px)" srcSet="/cp.svg?v=2" /><img src="/cp.svg?v=2" className="brand-logo" alt="Check Performance" /></picture></Link>
        <nav className="landing-nav-links" aria-label="Navigation de présentation"><Link to="/qcm-en-ligne">QCM en ligne</Link><Link to="/developpement-soft-skills">Soft skills</Link><a href="#tarifs">Tarifs</a></nav>
        <PublicMobileMenu landing />
        <div className="landing-nav-actions"><Link className="secondary-btn" to="/login"><FontAwesomeIcon icon={faRightToBracket} /> Connexion</Link><a className="primary-btn" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('demo_booking_clicked', 'landing')}><FontAwesomeIcon icon={faCalendarCheck} /> Réserver une démo</a></div>
      </motion.header>

      <section className="landing-hero">
        <motion.div className="landing-hero-text" initial="hidden" animate="show" variants={stagger}>
          <motion.span className="landing-badge" variants={fadeUp}><FontAwesomeIcon icon={faChartLine} /> Phase pilote · mesure d’impact T0 à T+6</motion.span>
          <motion.h1 variants={fadeUp}>Évaluez les acquis et documentez la progression. <span>Du QCM en ligne au suivi des soft skills.</span></motion.h1>
          <motion.p variants={fadeUp}>Check Performance aide les centres de formation, consultants RH et organismes d’employabilité à créer des QCM en ligne, analyser les résultats et suivre les compétences comportementales.</motion.p>
          <motion.div className="landing-cta" variants={fadeUp}><a className="primary-btn large" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('demo_booking_clicked', 'landing')}>Réserver une démonstration <FontAwesomeIcon icon={faArrowRight} /></a><Link className="secondary-btn large" to="/demo-qcm">Tester le QCM sans compte</Link></motion.div>
          <motion.div className="hero-proof" variants={fadeUp}><span><FontAwesomeIcon icon={faCircleCheck} /> Web responsive · PWA en validation</span><span><FontAwesomeIcon icon={faCircleCheck} /> Maquettes de rapports visibles</span><span><FontAwesomeIcon icon={faCircleCheck} /> Décision humaine obligatoire</span></motion.div>
          <motion.small className="hero-causality-note" variants={fadeUp}>« Prouver » signifie ici documenter des résultats et une progression observée. L’attribution causale à une formation exige un protocole d’évaluation complémentaire.</motion.small>
        </motion.div>

        <motion.div className="landing-hero-visual dashboard-preview" initial={{ opacity: 0, x: 30, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.22, duration: 0.7, ease }}>
          <div className="preview-window"><div className="preview-window-bar"><span /><span /><span /><small>Aperçu illustratif · données fictives</small></div><div className="preview-layout"><aside><div className="preview-logo">CP</div><i className="active" /><i /><i /><i /></aside><div className="preview-content"><div className="preview-heading"><div><small>Cohorte Alpha</small><strong>Parcours de mesure</strong></div><span>Suivi actif</span></div><div className="preview-kpis"><div><FontAwesomeIcon icon={faGraduationCap} /><span><strong>T0</strong><small>Diagnostic</small></span></div><div><FontAwesomeIcon icon={faClipboardQuestion} /><span><strong>Acquis</strong><small>Évaluation</small></span></div><div><FontAwesomeIcon icon={faArrowTrendUp} /><span><strong>T+6</strong><small>Progression</small></span></div></div><div className="preview-chart"><div><strong>Évolution documentée</strong><small>4 indicateurs</small></div><div className="preview-bars">{[35, 48, 44, 62, 58, 76, 82].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div></div></div></div>
          <motion.div className="floating-card hero-score" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}><FontAwesomeIcon icon={faFileLines} /><div><strong>Rapport prêt</strong><small>Résultats consolidés</small></div></motion.div>
          <motion.div className="floating-card hero-live" animate={{ y: [0, 9, 0] }} transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}><span className="live-dot" /><div><strong>Suivi T+6</strong><small>Écart par pilier</small></div></motion.div><div className="hero-glow" />
        </motion.div>
      </section>

      <section className="landing-trust-strip" aria-label="Parcours de mesure"><span><FontAwesomeIcon icon={faChartColumn} /> Diagnostic initial</span><span><FontAwesomeIcon icon={faClipboardQuestion} /> Évaluation des acquis</span><span><FontAwesomeIcon icon={faFileLines} /> Rapport formateur</span><span><FontAwesomeIcon icon={faArrowTrendUp} /> Suivi à six mois</span></section>

      <motion.section className="landing-solutions" id="solutions" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Deux usages, deux pages dédiées</span><h2>Choisissez ce que vous voulez mesurer.</h2><p>Les évaluations pédagogiques et le suivi des soft skills restent séparés pour garder des méthodes, des écrans et des interprétations clairs.</p></motion.div>
        <div className="product-track-grid commercial-track-grid">{professionalTracks.map((track) => <motion.article className={`product-track ${track.id}`} key={track.id} variants={fadeUp}><div className="product-track-intro"><span className="product-track-icon"><FontAwesomeIcon icon={track.icon} /></span><small>{track.label}</small><h3>{track.title}</h3><p>{track.description}</p><Link className="product-track-link" to={track.to}>{track.cta} <FontAwesomeIcon icon={faArrowRight} /></Link></div><div className="product-track-points">{track.points.map((point) => <div className="product-track-point" key={point}><span><FontAwesomeIcon icon={faCircleCheck} /></span><div><strong>{point}</strong></div></div>)}</div></motion.article>)}</div>
        <div className="target-audience-grid">{targetAudiences.map((audience) => <article key={audience.title}><span><FontAwesomeIcon icon={audience.icon} /></span><div><h3>{audience.title}</h3><p>{audience.text}</p></div></article>)}</div>
      </motion.section>

      <motion.section className="evidence-section" id="preuves" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Des exemples avant la promesse</span><h2>Testez, ouvrez, téléchargez.</h2><p>Aucun chiffre client n’est inventé : les rapports publics sont des maquettes synthétiques et les témoignages seront publiés uniquement avec accord.</p></motion.div>
        <div className="evidence-grid">{evidenceCards.map((card) => <motion.article className="evidence-card" key={card.title} variants={fadeUp}><span className="evidence-icon"><FontAwesomeIcon icon={card.icon} /></span><small>{card.label}</small><h3>{card.title}</h3><p>{card.text}</p>{card.to ? <Link to={card.to}>{card.cta} <FontAwesomeIcon icon={faArrowRight} /></Link> : <a href={card.href} target="_blank" rel="noopener noreferrer">{card.cta} <FontAwesomeIcon icon={faDownload} /></a>}</motion.article>)}</div>
      </motion.section>

      <motion.section className="landing-mobile web-first-section" {...reveal}>
        <motion.div className="web-first-visual" variants={fadeUp}><div className="web-device desktop"><span /><span /><span /><div><FontAwesomeIcon icon={faChartLine} /><b>Check Performance</b><i /></div></div><div className="web-device phone"><div><FontAwesomeIcon icon={faClipboardQuestion} /><b>Évaluation</b><i /><i /><i /></div></div><span className="pwa-pill"><FontAwesomeIcon icon={faLaptop} /> PWA en validation</span></motion.div>
        <motion.div className="mobile-copy" variants={fadeUp}><span className="section-kicker"><FontAwesomeIcon icon={faWifi} /> Priorité web responsive / PWA</span><h2>Une expérience conçue pour le téléphone et les connexions moyennes.</h2><p>Pas de détour par une boutique d’applications : le participant ouvre son lien, répond et consulte sa correction dans le navigateur. L’installation PWA reste à valider sur les appareils et réseaux cibles.</p><ul><li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Chargement découpé</strong><small>Les écrans sont chargés à la demande ; le cache PWA concerne le shell et les fichiers statiques, jamais les résultats sensibles.</small></span></li><li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Responsive dès maintenant</strong><small>Parcours formateur et participant utilisables sur écran étroit.</small></span></li><li><FontAwesomeIcon icon={faCircleCheck} /><span><strong>Natif mis en attente</strong><small>La priorité reste l’activation, la complétion et la rétention web.</small></span></li></ul></motion.div>
      </motion.section>

      <motion.section className="landing-pricing" id="tarifs" {...reveal}>
        <motion.div className="section-heading" variants={fadeUp}><span>Un tunnel commercial explicite</span><h2>Prix, limites et renouvellement visibles.</h2><p>{commercialLaunchEnabled ? 'La participation reste gratuite. Les contrats Centre et les pilotes Entreprise commencent par une démonstration cadrée.' : 'Phase pilote : les prix cibles sont publics, mais les inscriptions et paiements en libre-service restent fermés. L’accès est accordé après cadrage.'}</p></motion.div>
        <div className="pricing-grid pricing-grid-four">{commercialPlans.map((plan) => <motion.article className={`pricing-card ${plan.id === 'trainer' ? 'featured' : ''}`} key={plan.id} variants={fadeUp} whileHover={{ y: -7 }}>{plan.badge && <div className="pricing-badge">{plan.badge}</div>}<div className={`pricing-icon ${plan.id}`}><FontAwesomeIcon icon={plan.id === 'trainer' ? faGraduationCap : plan.id === 'center' ? faBuilding : faPeopleGroup} /></div><div><h3>{plan.name}</h3><p className="pricing-description">{plan.detail}</p></div><div className="pricing-price"><span className="pricing-amount">{plan.price}</span><span className="pricing-unit">{plan.unit}</span></div><ul className="pricing-features">{plan.features.map((feature) => <li key={feature}><FontAwesomeIcon icon={faCircleCheck} /> {feature}</li>)}</ul>{plan.to ? <Link className={plan.id === 'trainer' ? 'primary-btn large' : 'secondary-btn large'} to={plan.to}>{plan.cta} <FontAwesomeIcon icon={faArrowRight} /></Link> : <a className="secondary-btn large" href={plan.href} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent(plan.interestEvent, 'pricing')}>{plan.cta} <FontAwesomeIcon icon={faArrowRight} /></a>}</motion.article>)}</div>
        <p className="pricing-clarity-note"><FontAwesomeIcon icon={faShieldHalved} /> Aucun paiement récurrent automatique dans le tunnel actuel. Les conditions particulières d’un devis priment pour les offres accompagnées.</p>
      </motion.section>

      <motion.section className="landing-faq" {...reveal}><motion.div className="section-heading" variants={fadeUp}><span>Questions fréquentes</span><h2>Avant de vous engager.</h2></motion.div><div className="faq-list">{faqs.map((item, index) => { const isOpen = openFaq === index; return <motion.article className={`faq-item ${isOpen ? 'open' : ''}`} key={item.q} variants={fadeUp}><button type="button" className="faq-question" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : index)}><span>{item.q}</span><FontAwesomeIcon icon={faChevronDown} className="faq-chevron" /></button><div className="faq-answer"><div className="faq-answer-inner"><p>{item.a}</p></div></div></motion.article>; })}</div></motion.section>

      <motion.section className="landing-final" initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.6, ease }}><span>Votre premier pilote</span><h2>Partons d’une cohorte, d’un objectif et du rapport attendu.</h2><p>Le bouton ouvre WhatsApp ; le créneau et le périmètre sont ensuite confirmés avec vous.</p><div className="landing-final-actions"><a className="primary-btn large" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('demo_booking_clicked', 'landing')}><FontAwesomeIcon icon={faCalendarCheck} /> Réserver une démonstration</a><Link className="secondary-btn large" to="/ressources">Voir les exemples</Link></div></motion.section>

      <PublicFooter />
      <motion.a className="whatsapp-fab" href={whatsappUrl('Bonjour, je souhaite des informations sur Check Performance.')} target="_blank" rel="noopener noreferrer" aria-label="Contacter Check Performance sur WhatsApp" onClick={() => trackPublicIntent('contact_clicked', 'landing')} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring' }} whileHover={{ scale: 1.1 }}><WhatsAppIcon /></motion.a>
    </div>
  );
}
