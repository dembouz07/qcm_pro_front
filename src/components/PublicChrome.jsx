import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBars, faCalendarCheck, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import api from '../api.js';

export const WHATSAPP_NUMBER = '221774006235';

export function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
export const bookingUrl = whatsappUrl(
  'Bonjour, je souhaite réserver une démonstration de Check Performance pour mon organisation.',
);

const PUBLIC_VISITOR_KEY = 'check_performance_public_visitor';

function publicVisitorId() {
  try {
    let visitorId = sessionStorage.getItem(PUBLIC_VISITOR_KEY);
    if (!visitorId && globalThis.crypto?.randomUUID) {
      visitorId = globalThis.crypto.randomUUID();
      sessionStorage.setItem(PUBLIC_VISITOR_KEY, visitorId);
    }
    return visitorId || null;
  } catch {
    return null;
  }
}

export function trackPublicIntent(event = 'demo_booking_clicked', source = 'public') {
  const visitorId = publicVisitorId();
  void api.post('/public/events', {
    event,
    source,
    ...(visitorId ? { visitor_id: visitorId } : {}),
  }).catch(() => {});
}

export function PublicMobileMenu({ landing = false }) {
  return (
    <details className="public-mobile-menu">
      <summary><FontAwesomeIcon icon={faBars} /> <span>Menu</span></summary>
      <div>
        {landing ? (
          <>
            <Link to="/qcm-en-ligne">QCM en ligne</Link>
            <Link to="/evaluation-des-acquis">Évaluation des acquis</Link>
            <Link to="/developpement-soft-skills">Soft skills</Link>
            <a href="#preuves">Exemples</a>
            <a href="#tarifs">Tarifs</a>
          </>
        ) : (
          <>
            <Link to="/qcm-en-ligne">QCM en ligne</Link>
            <Link to="/evaluation-des-acquis">Évaluation des acquis</Link>
            <Link to="/developpement-soft-skills">Soft skills</Link>
            <Link to="/ressources">Exemples & méthode</Link>
          </>
        )}
      </div>
    </details>
  );
}

export function PublicHeader() {
  return (
    <header className="landing-nav public-page-nav">
      <Link className="brand landing-brand" to="/" aria-label="Accueil Check Performance">
        <picture className="brand-picture">
          <source media="(max-width: 980px)" srcSet="/cp.svg?v=2" />
          <img src="/cp.svg?v=2" className="brand-logo" alt="Check Performance" />
        </picture>
      </Link>
      <nav className="landing-nav-links" aria-label="Navigation publique">
        <Link to="/qcm-en-ligne">QCM en ligne</Link>
        <Link to="/evaluation-des-acquis">Évaluation des acquis</Link>
        <Link to="/developpement-soft-skills">Soft skills</Link>
        <Link to="/ressources">Preuves & méthode</Link>
      </nav>
      <PublicMobileMenu />
      <div className="landing-nav-actions">
        <Link className="secondary-btn" to="/login"><FontAwesomeIcon icon={faRightToBracket} /> Connexion</Link>
        <a className="primary-btn" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('demo_booking_clicked', 'header')}>
          <FontAwesomeIcon icon={faCalendarCheck} /> Réserver une démo
        </a>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="landing-footer public-footer">
      <div className="brand landing-brand"><img src="/cp.svg?v=2" className="brand-logo" alt="Check Performance" /></div>
      <small>© {new Date().getFullYear()} Check Performance — Mesurer les acquis et documenter la progression.</small>
      <div>
        <Link to="/qcm-en-ligne">QCM en ligne</Link>
        <Link to="/evaluation-des-acquis">Évaluation des acquis</Link>
        <Link to="/developpement-soft-skills">Soft skills</Link>
        <Link to="/ressources">Ressources</Link>
        <Link to="/confidentialite">Confidentialité</Link>
        <Link to="/cgu">CGU</Link>
        <Link to="/cgv">CGV</Link>
        <Link to="/mentions-legales">Mentions légales</Link>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('demo_booking_clicked', 'footer')}>Démonstration <FontAwesomeIcon icon={faArrowRight} /></a>
      </div>
    </footer>
  );
}
