import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowTrendUp,
  faBrain,
  faCalendarCheck,
  faChartColumn,
  faCircleCheck,
  faClipboardCheck,
  faFileArrowDown,
  faLayerGroup,
  faPeopleGroup,
  faShareNodes,
} from '@fortawesome/free-solid-svg-icons';
import { PublicFooter, PublicHeader, bookingUrl, trackPublicIntent } from '../components/PublicChrome.jsx';

const commercialLaunchEnabled = import.meta.env.VITE_COMMERCIAL_LAUNCH_ENABLED === 'true';

const solutions = {
  knowledge: {
    eyebrow: 'Évaluation des acquis',
    icon: faClipboardCheck,
    title: 'Créez une évaluation et restituez ses résultats clairement.',
    lead: 'Pour les formateurs, centres de formation et organismes d’employabilité qui veulent créer, diffuser et analyser des évaluations par cohorte.',
    primary: { label: 'Tester le QCM public', to: '/demo-qcm' },
    secondary: { label: 'Créer mon espace formateur', to: '/register-admin' },
    steps: [
      { icon: faClipboardCheck, title: 'Diagnostiquer', text: 'Posez un niveau initial avec un QCM manuel, importé ou progressif.' },
      { icon: faShareNodes, title: 'Évaluer', text: 'Partagez par classe, code ou lien public, y compris sans compte participant.' },
      { icon: faChartColumn, title: 'Restituer', text: 'Analysez les notes, les questions difficiles et exportez un rapport exploitable.' },
    ],
    outcomes: ['Cohortes et classes distinctes', 'Corrections et résultats individuels', 'Exports Excel et rapport imprimable', 'Sondages anonymes et analyse des questions ratées'],
    proofTitle: 'Voyez le rendu avant de vous inscrire.',
    proofText: 'Le QCM public montre le parcours participant. Le rapport est une maquette cible entièrement synthétique, à valider pendant les pilotes avant d’en automatiser l’export.',
    proofLinks: [
      { label: 'Ouvrir le QCM de démonstration', to: '/demo-qcm' },
      { label: 'Voir le rapport formateur', to: '/ressources#rapport-formateur' },
    ],
  },
  softSkills: {
    eyebrow: 'Développement des soft skills',
    icon: faBrain,
    title: 'Suivez l’évolution du Mindset, du T0 au point à six mois.',
    lead: 'Pour les consultants RH, responsables formation et employabilité qui ont besoin d’un cadre documenté pour accompagner les compétences humaines.',
    primary: { label: 'Consulter la méthodologie', to: '/ressources#methode' },
    secondary: null,
    steps: [
      { icon: faBrain, title: 'Établir le T0', text: 'Conduisez un entretien structuré sur quatre piliers et conservez les verbatims utiles.' },
      { icon: faCalendarCheck, title: 'Accompagner', text: 'Formalisez jusqu’à trois actions, les appuis nécessaires et la date du prochain suivi.' },
      { icon: faArrowTrendUp, title: 'Comparer à T+6', text: 'Visualisez les écarts globaux et par pilier sans réduire la personne à un score.' },
    ],
    outcomes: ['20 critères répartis sur 4 piliers', 'Échelle comportementale de 1 à 5', 'Plan d’action et besoins d’appui', 'Comparaison T0–T+6 documentée'],
    proofTitle: 'Une méthode visible, un usage RH encadré.',
    proofText: 'La grille sert de support d’entretien et de progression. Le rapport est une maquette cible ; aucune décision RH ne doit être fondée uniquement sur le score obtenu.',
    proofLinks: [
      { label: 'Lire la méthode Mindset Techco', to: '/ressources#methode' },
      { label: 'Voir le rapport T0–T+6', to: '/ressources#rapport-t0-t6' },
    ],
  },
};

function SolutionPage({ type }) {
  const solution = solutions[type];
  return (
    <div className={`public-page solution-public-page ${type}`}>
      <PublicHeader />
      <main>
        <section className="solution-public-hero">
          <div>
            <span className="eyebrow"><FontAwesomeIcon icon={solution.icon} /> {solution.eyebrow}</span>
            <h1>{solution.title}</h1>
            <p>{solution.lead}</p>
            <div className="landing-cta">
              <Link className="primary-btn large" to={solution.primary.to}>{solution.primary.label} <FontAwesomeIcon icon={faArrowRight} /></Link>
              {solution.secondary && commercialLaunchEnabled
                ? <Link className="secondary-btn large" to={solution.secondary.to}>{solution.secondary.label}</Link>
                : <a className="secondary-btn large" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent(solution.secondary ? 'pilot_interest_clicked' : 'demo_booking_clicked', 'solution')}>{solution.secondary ? 'Candidater au pilote' : 'Réserver une démonstration'}</a>}
            </div>
          </div>
          <div className="solution-impact-card">
            <span><FontAwesomeIcon icon={type === 'knowledge' ? faLayerGroup : faPeopleGroup} /></span>
            <small>Parcours mesurable</small>
            <strong>{type === 'knowledge' ? 'Diagnostic ou évaluation → rapport' : 'T0 → plan d’action → T+6'}</strong>
            <ul>{solution.outcomes.slice(0, 3).map((outcome) => <li key={outcome}><FontAwesomeIcon icon={faCircleCheck} /> {outcome}</li>)}</ul>
          </div>
        </section>

        <section className="solution-process-section">
          <div className="section-heading"><span>Le parcours</span><h2>Trois étapes, un résultat exploitable.</h2></div>
          <div className="steps-grid">
            {solution.steps.map((step, index) => (
              <article className="step-card" key={step.title}><span className="step-number">0{index + 1}</span><div className="step-icon"><FontAwesomeIcon icon={step.icon} /></div><h3>{step.title}</h3><p>{step.text}</p></article>
            ))}
          </div>
        </section>

        <section className="solution-capabilities">
          <div><span className="eyebrow">Ce que vous obtenez</span><h2>Un suivi lisible par participant et par groupe.</h2><p>Les résultats restent reliés à l’objectif pédagogique ou d’accompagnement, avec les éléments nécessaires pour les expliquer.</p></div>
          <ul>{solution.outcomes.map((outcome) => <li key={outcome}><FontAwesomeIcon icon={faCircleCheck} /> {outcome}</li>)}</ul>
        </section>

        <section className="solution-proof-callout">
          <span><FontAwesomeIcon icon={faFileArrowDown} /></span>
          <div><small>Preuve publique</small><h2>{solution.proofTitle}</h2><p>{solution.proofText}</p></div>
          <div>{solution.proofLinks.map((link) => <Link className="secondary-btn" to={link.to} key={link.label}>{link.label} <FontAwesomeIcon icon={faArrowRight} /></Link>)}</div>
        </section>

        <section className="landing-final solution-final-cta">
          <span>Démonstration personnalisée</span><h2>Cadrez votre première cohorte ou votre pilote.</h2><p>Nous partons de votre public, de vos objectifs et du rapport attendu.</p>
          <a className="primary-btn large" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('demo_booking_clicked', 'solution')}><FontAwesomeIcon icon={faCalendarCheck} /> Réserver une démonstration</a>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

export function KnowledgeAssessment() {
  return <SolutionPage type="knowledge" />;
}

export function SoftSkillsDevelopment() {
  return <SolutionPage type="softSkills" />;
}
