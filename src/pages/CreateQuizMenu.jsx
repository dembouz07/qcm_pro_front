import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlus, faFileImport, faDiagramProject, faArrowRight, faPenToSquare, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../AuthContext.jsx';

const options = [
  {
    to: '/admin/quizzes/smart',
    icon: faWandMagicSparkles,
    title: 'Coller un QCM (texte)',
    desc: "Collez un QCM généré par IA ou copié d'ailleurs : les questions sont analysées, puis affichées pour validation avant l'enregistrement.",
    cta: 'Coller et vérifier',
    featured: true,
    feature: 'quiz_smart',
  },
  {
    to: '/admin/quizzes/new',
    icon: faPenToSquare,
    title: 'QCM manuel',
    desc: "Saisissez vos questions et réponses une par une, directement dans l'éditeur.",
    cta: 'Saisir les questions'
  },
  {
    to: '/admin/quizzes/import',
    icon: faFileImport,
    title: 'Importer un fichier',
    desc: 'Créez un QCM à partir d’un fichier CSV, JSON, Word ou PDF structuré.',
    cta: 'Importer un fichier'
  },
  {
    to: '/admin/quizzes/progressive',
    icon: faDiagramProject,
    title: 'QCM progressif',
    desc: 'Diagnostic par stades (Oui/Non) avec passage au stade suivant selon le score.',
    cta: 'Créer un diagnostic'
  }
];

export default function CreateQuizMenu() {
  const { user } = useAuth();
  const visibleOptions = options.filter((option) => (
    !option.feature || user?.is_super_admin || (user?.plan_features || []).includes(option.feature)
  ));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow"><FontAwesomeIcon icon={faCirclePlus} /> Création</span>
          <h1>Créer un QCM</h1>
          <p>Choisissez la méthode de création qui vous convient.</p>
        </div>
      </div>

      <section className="create-options">
        {visibleOptions.map((opt) => (
          <Link className={`create-card ${opt.featured ? 'featured' : ''}`} to={opt.to} key={opt.to}>
            <div className="create-card-icon"><FontAwesomeIcon icon={opt.icon} /></div>
            <h2>{opt.title}</h2>
            <p>{opt.desc}</p>
            <span className="create-card-cta">{opt.cta} <FontAwesomeIcon icon={faArrowRight} /></span>
          </Link>
        ))}
      </section>
    </div>
  );
}
