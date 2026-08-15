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
import { SEO_ROUTES } from '../config/seo.js';

const commercialLaunchEnabled = import.meta.env.VITE_COMMERCIAL_LAUNCH_ENABLED === 'true';

const solutions = {
  qcm: {
    path: '/qcm-en-ligne',
    eyebrow: 'Logiciel de QCM en ligne',
    icon: faClipboardCheck,
    title: 'Créez, diffusez et analysez vos QCM en ligne.',
    lead: 'Pour les formateurs et centres de formation qui veulent réunir la création des questions, le partage aux participants et l’analyse des résultats dans un même outil.',
    primary: { label: 'Tester le QCM sans compte', to: '/demo-qcm' },
    secondary: { label: 'Créer mon espace formateur', to: '/register-admin' },
    impact: 'Questions → diffusion → résultats',
    steps: [
      { icon: faClipboardCheck, title: 'Créer le QCM', text: 'Saisissez vos questions, importez un questionnaire structuré ou préparez un parcours progressif.' },
      { icon: faShareNodes, title: 'Partager en ligne', text: 'Diffusez le QCM par classe, code ou lien public, y compris sans compte participant.' },
      { icon: faChartColumn, title: 'Analyser les réponses', text: 'Consultez les notes, les corrections, la distribution et les questions les plus difficiles.' },
    ],
    outcomes: ['QCM manuels, importés ou progressifs', 'Liens publics et accès sans compte', 'Corrections et résultats individuels', 'Statistiques par question, classe et cohorte'],
    capabilitiesTitle: 'Un logiciel QCM pensé pour la formation.',
    capabilitiesText: 'Chaque questionnaire reste relié à un objectif, un groupe et une restitution. Le formateur garde la maîtrise des questions comme de l’interprétation des résultats.',
    useCases: [
      { title: 'QCM de positionnement', text: 'Situez le niveau de départ avant une formation et adaptez le parcours au groupe.' },
      { title: 'Évaluation formative', text: 'Vérifiez les acquis pendant le parcours et identifiez les notions à retravailler.' },
      { title: 'Évaluation finale', text: 'Contrôlez les apprentissages visés et préparez une restitution par participant ou cohorte.' },
    ],
    proofTitle: 'Essayez le parcours avant de choisir l’outil.',
    proofText: 'Le QCM public montre l’expérience réelle d’un participant. Le rapport formateur disponible dans les ressources est une maquette cible avec des données entièrement synthétiques.',
    proofLinks: [
      { label: 'Ouvrir le QCM de démonstration', to: '/demo-qcm' },
      { label: 'Voir le rapport formateur', to: '/ressources#rapport-formateur' },
    ],
    related: [
      { label: 'Comprendre l’évaluation des acquis', to: '/evaluation-des-acquis' },
      { label: 'Consulter les guides et exemples', to: '/ressources' },
    ],
  },
  knowledge: {
    path: '/evaluation-des-acquis',
    eyebrow: 'Évaluation des acquis',
    icon: faClipboardCheck,
    title: 'Mesurez les acquis avant, pendant et après la formation.',
    lead: 'Pour les organismes qui veulent relier un positionnement initial, des évaluations en cours de parcours et un bilan final à des objectifs pédagogiques explicites.',
    primary: { label: 'Tester le QCM public', to: '/demo-qcm' },
    secondary: { label: 'Créer mon espace formateur', to: '/register-admin' },
    impact: 'Positionnement → évaluation → restitution',
    steps: [
      { icon: faClipboardCheck, title: 'Positionner', text: 'Établissez un niveau initial en fonction des prérequis et des objectifs annoncés.' },
      { icon: faShareNodes, title: 'Observer les acquis', text: 'Évaluez pendant ou après le parcours avec des conditions de passation définies.' },
      { icon: faChartColumn, title: 'Restituer avec contexte', text: 'Reliez les scores aux objectifs, aux questions difficiles et au groupe concerné.' },
    ],
    outcomes: ['Diagnostic initial ou test de positionnement', 'Évaluation formative et bilan final', 'Cohortes et classes distinctes', 'Résultats individuels et synthèse du groupe'],
    capabilitiesTitle: 'Une mesure reliée aux objectifs de formation.',
    capabilitiesText: 'Un score décrit une performance dans des conditions données. La restitution conserve le contexte nécessaire et ne présente pas automatiquement ce résultat comme une preuve causale d’impact.',
    useCases: [
      { title: 'Avant la formation', text: 'Vérifiez les prérequis, décrivez le point de départ et préparez les ajustements utiles.' },
      { title: 'Pendant le parcours', text: 'Repérez les incompréhensions et guidez les reprises pédagogiques sans attendre le bilan final.' },
      { title: 'Après la formation', text: 'Documentez les acquis observés et restituez les résultats au participant comme au commanditaire.' },
    ],
    proofTitle: 'Vérifiez le parcours et la forme de restitution.',
    proofText: 'La démonstration permet de passer un QCM sans compte. Le rapport public illustre le format visé avec des données entièrement synthétiques.',
    proofLinks: [
      { label: 'Ouvrir le QCM de démonstration', to: '/demo-qcm' },
      { label: 'Voir le rapport formateur', to: '/ressources#rapport-formateur' },
    ],
    related: [
      { label: 'Découvrir le logiciel de QCM en ligne', to: '/qcm-en-ligne' },
      { label: 'Consulter les ressources', to: '/ressources' },
    ],
  },
  softSkills: {
    path: '/developpement-soft-skills',
    eyebrow: 'Développement des soft skills',
    icon: faBrain,
    title: 'Évaluez les soft skills et documentez leur progression.',
    lead: 'Pour les consultants RH, responsables formation et employabilité qui ont besoin d’un cadre documenté pour accompagner les compétences humaines.',
    primary: { label: 'Consulter la méthodologie', to: '/ressources#methode' },
    secondary: null,
    impact: 'T0 → plan d’action → suivi T+6',
    steps: [
      { icon: faBrain, title: 'Établir le T0', text: 'Conduisez un entretien structuré sur quatre piliers et conservez les verbatims utiles.' },
      { icon: faCalendarCheck, title: 'Accompagner', text: 'Formalisez jusqu’à trois actions, les appuis nécessaires et la date du prochain suivi.' },
      { icon: faArrowTrendUp, title: 'Comparer à T+6', text: 'Visualisez les écarts globaux et par pilier sans réduire la personne à un score.' },
    ],
    outcomes: ['20 critères répartis sur 4 piliers', 'Échelle comportementale de 1 à 5', 'Plan d’action et besoins d’appui', 'Comparaison T0–T+6 documentée'],
    capabilitiesTitle: 'Un suivi lisible des compétences comportementales.',
    capabilitiesText: 'Les observations, verbatims et actions restent associés au contexte de l’entretien. Le score soutient la discussion sans réduire une personne à un nombre.',
    useCases: [
      { title: 'Diagnostic accompagné', text: 'Structurez l’échange autour de comportements observables et conservez les exemples utiles.' },
      { title: 'Plan de développement', text: 'Définissez jusqu’à trois actions prioritaires, les appuis nécessaires et une date de suivi.' },
      { title: 'Entretien de progression', text: 'Reprenez les mêmes critères à T+6 et discutez les écarts dans des conditions comparables.' },
    ],
    proofTitle: 'Une méthode visible, un usage RH encadré.',
    proofText: 'La grille sert de support d’entretien et de progression. Le rapport est une maquette cible ; aucune décision RH ne doit être fondée uniquement sur le score obtenu.',
    proofLinks: [
      { label: 'Lire la méthode Mindset Techco', to: '/ressources#methode' },
      { label: 'Voir le rapport T0–T+6', to: '/ressources#rapport-t0-t6' },
    ],
    related: [
      { label: 'Lire les limites d’interprétation', to: '/ressources#methode' },
      { label: 'Découvrir l’évaluation des acquis', to: '/evaluation-des-acquis' },
    ],
  },
};

function SolutionPage({ type }) {
  const solution = solutions[type];
  const faqs = SEO_ROUTES[solution.path]?.faqs || [];
  return (
    <div className={`public-page solution-public-page ${type}`}>
      <PublicHeader />
      <main>
        <nav className="public-breadcrumb" aria-label="Fil d’Ariane">
          <Link to="/">Accueil</Link><span aria-hidden="true">/</span><span aria-current="page">{solution.eyebrow}</span>
        </nav>
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
            <span><FontAwesomeIcon icon={type === 'softSkills' ? faPeopleGroup : faLayerGroup} /></span>
            <small>Parcours mesurable</small>
            <strong>{solution.impact}</strong>
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

        <section className="solution-use-cases" aria-labelledby={`${type}-use-cases-title`}>
          <div className="section-heading">
            <span>Cas d’usage</span>
            <h2 id={`${type}-use-cases-title`}>{type === 'softSkills' ? 'Du diagnostic au développement des soft skills.' : 'À chaque moment, une évaluation utile.'}</h2>
          </div>
          <div>{solution.useCases.map((useCase) => <article key={useCase.title}><h3>{useCase.title}</h3><p>{useCase.text}</p></article>)}</div>
        </section>

        <section className="solution-capabilities">
          <div><span className="eyebrow">Ce que vous obtenez</span><h2>{solution.capabilitiesTitle}</h2><p>{solution.capabilitiesText}</p></div>
          <ul>{solution.outcomes.map((outcome) => <li key={outcome}><FontAwesomeIcon icon={faCircleCheck} /> {outcome}</li>)}</ul>
        </section>

        <section className="solution-seo-faq" aria-labelledby={`${type}-faq-title`}>
          <div className="section-heading"><span>Questions fréquentes</span><h2 id={`${type}-faq-title`}>Ce qu’il faut savoir avant de commencer.</h2></div>
          <div className="solution-faq-list">
            {faqs.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </div>
          <nav className="solution-related-links" aria-label="Ressources associées">
            {solution.related.map((link) => <Link to={link.to} key={link.to}>{link.label} <FontAwesomeIcon icon={faArrowRight} /></Link>)}
          </nav>
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
export function QcmOnline() {
  return <SolutionPage type="qcm" />;
}

export function KnowledgeAssessment() {
  return <SolutionPage type="knowledge" />;
}

export function SoftSkillsDevelopment() {
  return <SolutionPage type="softSkills" />;
}
