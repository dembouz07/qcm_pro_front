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
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';

const features = [
  { icon: faClock, title: 'QCM programmés', desc: "Définissez l'heure d'ouverture et de fermeture. Les élèves accèdent au test au bon moment." },
  { icon: faDiagramProject, title: 'Diagnostics progressifs', desc: 'Questionnaires par stades avec passage conditionnel selon le score obtenu.' },
  { icon: faFileImport, title: 'Import facile', desc: 'Créez des QCM à partir de fichiers CSV, JSON, Word ou PDF en quelques secondes.' },
  { icon: faChartLine, title: 'Suivi des notes', desc: 'Notes calculées automatiquement, filtrables par classe et par QCM.' },
  { icon: faShieldHalved, title: 'Anti-triche', desc: 'Une seule tentative par participant, soumission verrouillée après envoi.' },
  { icon: faRocket, title: 'Liens partageables', desc: 'Partagez un lien public pour faire passer un test sans création de compte.' }
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand landing-brand">
          <span className="brand-icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
          <span>QCM Pro</span>
        </div>
        <div className="landing-nav-actions">
          <Link className="secondary-btn" to="/login"><FontAwesomeIcon icon={faRightToBracket} /> Connexion</Link>
          <Link className="primary-btn" to="/register"><FontAwesomeIcon icon={faUserPlus} /> Inscription</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-badge"><FontAwesomeIcon icon={faRocket} /> Plateforme d'évaluation en ligne</span>
          <h1>Créez, partagez et évaluez vos QCM en toute simplicité</h1>
          <p>
            QCM Pro permet aux formateurs de créer des questionnaires, de les programmer pour leurs classes
            et de suivre les résultats en temps réel. Les apprenants passent leurs tests en ligne, où qu'ils soient.
          </p>
          <div className="landing-cta">
            <Link className="primary-btn large" to="/register">
              Commencer gratuitement <FontAwesomeIcon icon={faArrowRight} />
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

      <section className="landing-final">
        <h2>Prêt à lancer votre premier QCM ?</h2>
        <p>Rejoignez QCM Pro et commencez à évaluer vos apprenants dès aujourd'hui.</p>
        <Link className="primary-btn large" to="/register">
          Créer un compte <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="brand landing-brand">
          <span className="brand-icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
          <span>QCM Pro</span>
        </div>
        <small>© {new Date().getFullYear()} QCM Pro — Plateforme d'évaluation en ligne</small>
      </footer>
    </div>
  );
}
