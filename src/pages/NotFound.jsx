import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { PublicFooter, PublicHeader } from '../components/PublicChrome.jsx';

export default function NotFound() {
  return (
    <div className="public-page not-found-page">
      <PublicHeader />
      <main className="public-page-hero compact">
        <span className="eyebrow"><FontAwesomeIcon icon={faMagnifyingGlass} /> Erreur 404</span>
        <h1>Cette page est introuvable.</h1>
        <p>L’adresse a peut-être changé. Retrouvez les solutions de QCM en ligne, d’évaluation des acquis et de suivi des soft skills depuis l’accueil.</p>
        <div className="landing-cta">
          <Link className="primary-btn large" to="/"><FontAwesomeIcon icon={faArrowLeft} /> Retour à l’accueil</Link>
          <Link className="secondary-btn large" to="/qcm-en-ligne">Découvrir les QCM en ligne</Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
