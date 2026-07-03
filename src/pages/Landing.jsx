import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap,
  faRocket,
  faClock,
  faChartLine,
  faShieldHalved,
  faDiagramProject,
  faFileImport,
  faArrowRight,
  faRightToBracket,
  faUserPlus,
  faCircleCheck,
  faUserShield,
  faUser,
  faPenToSquare,
  faShareNodes,
  faRankingStar,
  faGift
} from '@fortawesome/free-solid-svg-icons';

// 👉 Remplace par ton vrai numéro WhatsApp (format international, sans +, sans espaces)
const WHATSAPP_NUMBER = '221774006235';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
    <path d="M16.04 4C9.95 4 5 8.95 5 15.04c0 2.13.6 4.13 1.65 5.84L5 28l7.3-1.6a11 11 0 0 0 3.74.65h.01C22.13 27.05 27 22.1 27 16.01 27 9.92 22.13 4 16.04 4zm6.45 15.6c-.27.76-1.57 1.46-2.18 1.51-.58.05-1.12.26-3.78-.79-3.18-1.25-5.2-4.5-5.36-4.71-.16-.21-1.29-1.71-1.29-3.27 0-1.55.81-2.31 1.1-2.63.27-.3.59-.37.79-.37.2 0 .39 0 .56.01.18.01.43-.07.67.51.27.66.92 2.28 1 2.45.08.16.13.36.02.57-.1.21-.16.34-.32.53-.16.18-.34.41-.48.55-.16.16-.33.34-.14.66.19.32.84 1.39 1.81 2.25 1.25 1.11 2.3 1.46 2.62 1.62.32.16.51.13.7-.08.19-.21.81-.94 1.02-1.27.21-.32.43-.27.72-.16.29.11 1.86.88 2.18 1.04.32.16.53.24.61.37.08.14.08.78-.19 1.54z"/>
  </svg>
);

const features = [
  { icon: faClock, title: 'QCM programmés', desc: "Définissez l'heure d'ouverture et de fermeture. Les élèves accèdent au test au bon moment." },
  { icon: faDiagramProject, title: 'Diagnostics progressifs', desc: 'Questionnaires par stades avec passage conditionnel selon le score obtenu.' },
  { icon: faFileImport, title: 'Import facile', desc: 'Créez des QCM à partir de fichiers CSV, JSON, Word ou PDF en quelques secondes.' },
  { icon: faChartLine, title: 'Suivi des notes', desc: 'Notes calculées automatiquement, filtrables par classe et par QCM.' },
  { icon: faShieldHalved, title: 'Anti-triche', desc: 'Une seule tentative par participant, fin du test si sortie ou copie.' },
  { icon: faRocket, title: 'Liens partageables', desc: 'Partagez un lien public pour faire passer un test sans création de compte.' }
];

const steps = [
  { icon: faPenToSquare, title: '1. Créez votre QCM', desc: 'Manuellement, par import de fichier, ou en diagnostic progressif.' },
  { icon: faShareNodes, title: '2. Partagez', desc: 'Donnez le code de classe à vos élèves ou envoyez un simple lien.' },
  { icon: faRankingStar, title: '3. Suivez les notes', desc: 'Résultats automatiques, exportables en Excel ou PDF.' }
];

const faqs = [
  { q: "Comment mes élèves accèdent-ils aux QCM ?", a: "Soit ils créent un compte gratuit avec le code de votre classe, soit vous leur envoyez un lien public (sans compte)." },
  { q: "Quels moyens de paiement sont acceptés ?", a: "Wave, Orange Money et carte bancaire, via PayTech — paiement 100% sécurisé." },
  { q: "Puis-je essayer avant de payer ?", a: "Oui ! Votre 1er mois est offert à l'inscription formateur. Vous payez seulement pour continuer ensuite." },
  { q: "Y a-t-il un système anti-triche ?", a: "Oui : une seule tentative par participant, et le test se termine si l'élève quitte la page ou tente de copier." },
  { q: "Comment sont calculées les notes ?", a: "Automatiquement (note sur 20 et pourcentage), avec export Excel/PDF et filtres par classe et par QCM." }
];

export default function Landing() {
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour, je souhaite des informations sur QCM Pro.")}`;

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand landing-brand">
          <span className="brand-icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
          <span>QCM Pro</span>
        </div>
        <div className="landing-nav-actions">
          <a className="auth-topbar-link" href="#tarifs">Tarifs</a>
          <Link className="auth-topbar-link" to="/register-admin">Espace formateur</Link>
          <Link className="secondary-btn" to="/login"><FontAwesomeIcon icon={faRightToBracket} /> Connexion</Link>
          <Link className="primary-btn" to="/register"><FontAwesomeIcon icon={faUserPlus} /> Inscription</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-badge"><FontAwesomeIcon icon={faGift} /> 1er mois offert pour les formateurs</span>
          <h1>Créez, partagez et évaluez vos QCM en toute simplicité</h1>
          <p>
            QCM Pro permet aux formateurs de créer des questionnaires, de les programmer pour leurs classes
            et de suivre les résultats en temps réel. Les apprenants passent leurs tests en ligne, où qu'ils soient.
          </p>
          <div className="landing-cta">
            <Link className="primary-btn large" to="/register-admin">
              Essayer gratuitement <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <Link className="secondary-btn large" to="/login">
              J'ai déjà un compte
            </Link>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="floating-card card-1">
            <FontAwesomeIcon icon={faChartLine} />
            <div><strong>18/20</strong><small>Note moyenne</small></div>
          </div>
          <div className="floating-card card-2">
            <FontAwesomeIcon icon={faClock} />
            <div><strong>Ouvre dans 5 min</strong><small>QCM programmé</small></div>
          </div>
          <div className="floating-card card-3">
            <FontAwesomeIcon icon={faGraduationCap} />
            <div><strong>Stade 3</strong><small>Diagnostic équipe</small></div>
          </div>
          <div className="hero-glow" />
        </div>
      </section>

      <section className="landing-steps">
        <h2>Comment ça marche ?</h2>
        <div className="steps-grid">
          {steps.map((s) => (
            <div className="step-card" key={s.title}>
              <div className="step-icon"><FontAwesomeIcon icon={s.icon} /></div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-features">
        <h2>Tout ce qu'il faut pour évaluer efficacement</h2>
        <div className="landing-feature-grid">
          {features.map((f) => (
            <div className="landing-feature" key={f.title}>
              <div className="landing-feature-icon"><FontAwesomeIcon icon={f.icon} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-pricing" id="tarifs">
        <h2>Tarifs simples</h2>
        <p className="landing-pricing-sub">Les élèves utilisent QCM Pro gratuitement. Les formateurs profitent d'un 1er mois offert.</p>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-icon student"><FontAwesomeIcon icon={faUser} /></div>
            <h3>Élève</h3>
            <div className="pricing-price"><span className="pricing-amount">Gratuit</span></div>
            <ul className="pricing-features">
              <li><FontAwesomeIcon icon={faCircleCheck} /> Rejoindre une classe avec un code</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> Passer les QCM programmés</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> Consulter ses notes</li>
            </ul>
            <Link className="secondary-btn large" to="/register">
              <FontAwesomeIcon icon={faUserPlus} /> Inscription élève
            </Link>
          </div>

          <div className="pricing-card featured">
            <div className="pricing-badge">1er mois offert</div>
            <div className="pricing-icon admin"><FontAwesomeIcon icon={faUserShield} /></div>
            <h3>Formateur</h3>
            <div className="pricing-price">
              <span className="pricing-amount">1000</span>
              <span className="pricing-unit">FCFA / mois</span>
            </div>
            <p className="pricing-perday">Soit environ <strong>33 FCFA / jour</strong></p>
            <ul className="pricing-features">
              <li><FontAwesomeIcon icon={faCircleCheck} /> Classes et élèves illimités</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> QCM manuel, import (CSV/Word/PDF), progressif</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> Liens publics et suivi des notes</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> Export Excel / PDF des résultats</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> Paiement Wave / Orange Money / carte</li>
            </ul>
            <Link className="primary-btn large" to="/register-admin">
              <FontAwesomeIcon icon={faGift} /> Commencer (1er mois offert)
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-faq">
        <h2>Questions fréquentes</h2>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <details className="faq-item" key={i}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <h2>Prêt à lancer votre premier QCM ?</h2>
        <p>Inscrivez-vous comme formateur — le 1er mois est offert, sans engagement.</p>
        <Link className="primary-btn large" to="/register-admin">
          Devenir formateur <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="brand landing-brand">
          <span className="brand-icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
          <span>QCM Pro</span>
        </div>
        <small>© {new Date().getFullYear()} QCM Pro — Plateforme d'évaluation en ligne</small>
      </footer>

      <a className="whatsapp-fab" href={waLink} target="_blank" rel="noopener noreferrer" aria-label="Contacter sur WhatsApp">
        <WhatsAppIcon />
      </a>
    </div>
  );
}
