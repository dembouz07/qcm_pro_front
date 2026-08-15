import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBrain,
  faCalendarCheck,
  faChartLine,
  faCircleCheck,
  faDownload,
  faFileLines,
  faFlask,
  faScaleBalanced,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { PublicFooter, PublicHeader, bookingUrl, trackPublicIntent, whatsappUrl } from '../components/PublicChrome.jsx';
import { useScrollToHash } from '../utils/useScrollToHash.js';

const pillars = [
  { name: 'Confiance', text: 'Autonomie, capacité à demander de l’aide, prise d’initiative et dialogue avec la hiérarchie.' },
  { name: 'Exécution', text: 'Priorisation, adaptation, livraison utile et capacité à arrêter une action sans valeur.' },
  { name: 'Innovation', text: 'Remise en question des habitudes, partage d’idées et ouverture à d’autres pratiques.' },
  { name: 'Création de valeur', text: 'Lien entre activité, utilité concrète, impact observable et besoins du bénéficiaire.' },
];

const scale = [
  ['1', 'Résistance / absence'],
  ['2', 'Prise de conscience naissante'],
  ['3', 'Conscient et ponctuel'],
  ['4', 'Ancré'],
  ['5', 'Exemplaire'],
];

export default function Resources() {
  useScrollToHash();
  const pilotUrl = whatsappUrl('Bonjour, je souhaite candidater à un pilote payant Check Performance pour mon organisation.');
  return (
    <div className="public-page resources-page">
      <PublicHeader />
      <main>
        <section className="public-page-hero compact">
          <span className="eyebrow"><FontAwesomeIcon icon={faFlask} /> Preuves & méthodologie</span>
          <h1>Guides, exemples et méthode Check Performance.</h1>
          <p>Testez le QCM en ligne, consultez des rapports illustratifs et comprenez exactement comment la grille soft skills est utilisée — limites comprises.</p>
          <div className="landing-cta">
            <Link className="primary-btn large" to="/demo-qcm">Tester le QCM sans compte <FontAwesomeIcon icon={faArrowRight} /></Link>
            <a className="secondary-btn large" href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('demo_booking_clicked', 'resources')}>Réserver une démonstration</a>
          </div>
        </section>

        <section className="resource-report-grid" aria-label="Exemples de rapports">
          <article className="resource-report-card" id="rapport-formateur">
            <span><FontAwesomeIcon icon={faFileLines} /></span>
            <small>Maquette cible · données entièrement synthétiques</small>
            <h2>Rapport formateur</h2>
            <p>Exemple téléchargeable du format de restitution visé : cohorte, complétion, moyenne, distribution et questions à retravailler.</p>
            <div>
              <a className="primary-btn" href="/rapports/exemple-rapport-formateur.html" target="_blank" rel="noopener noreferrer">Consulter</a>
              <a className="secondary-btn" href="/rapports/exemple-rapport-formateur.html" download><FontAwesomeIcon icon={faDownload} /> Télécharger (.html)</a>
            </div>
          </article>
          <article className="resource-report-card enterprise" id="rapport-t0-t6">
            <span><FontAwesomeIcon icon={faChartLine} /></span>
            <small>Maquette cible · aucune personne réelle</small>
            <h2>Rapport de progression T0–T+6</h2>
            <p>Exemple entièrement synthétique : scores par pilier, évolution observée, actions menées et points d’appui.</p>
            <div>
              <a className="primary-btn" href="/rapports/exemple-rapport-t0-t6.html" target="_blank" rel="noopener noreferrer">Consulter</a>
              <a className="secondary-btn" href="/rapports/exemple-rapport-t0-t6.html" download><FontAwesomeIcon icon={faDownload} /> Télécharger (.html)</a>
            </div>
          </article>
        </section>

        <section className="methodology-section" id="methode">
          <div className="section-heading"><span>Méthodologie Mindset Techco · version 1.0</span><h2>Un entretien structuré, pas un verdict automatisé.</h2><p>La grille aide l’évaluateur et le collaborateur à documenter des comportements, décider d’actions et observer une évolution dans des conditions comparables.</p></div>

          <div className="methodology-grid">
            <article className="methodology-overview">
              <span><FontAwesomeIcon icon={faBrain} /></span>
              <h3>4 piliers · 20 critères</h3>
              <p>Chaque pilier comprend cinq questions guidées. L’évaluateur attribue une note ancrée de 1 à 5 et conserve, lorsque cela est utile, un exemple concret ou un verbatim.</p>
              <div className="methodology-scale">{scale.map(([value, label]) => <span key={value}><b>{value}</b><small>{label}</small></span>)}</div>
            </article>
            <div className="methodology-pillars">
              {pillars.map((pillar, index) => <article key={pillar.name}><span>0{index + 1}</span><div><h3>{pillar.name}</h3><p>{pillar.text}</p></div></article>)}
            </div>
          </div>

          <div className="methodology-protocol">
            <article><small>Calcul</small><h3>Un score transparent</h3><p>Les 20 notes sont additionnées : total de 20 à 100. Chaque pilier regroupe cinq questions et produit un sous-total de 5 à 25.</p><ul><li>20–40 : Mindset émergent</li><li>41–60 : Mindset en construction</li><li>61–80 : Mindset ancré</li><li>81–100 : Mindset exemplaire</li></ul></article>
            <article><small>Conduite v1.0</small><h3>Des faits avant la note</h3><p>Avant l’entretien, préciser l’objectif, les destinataires et le contexte. Chaque note ou évolution importante doit être discutée à partir d’au moins un exemple récent et daté. La personne évaluée peut commenter ou signaler son désaccord.</p></article>
            <article><small>Comparabilité</small><h3>Mêmes conditions à T+6</h3><p>Conserver la version de grille, les dates et le contexte ; reprendre les mêmes critères autour de six mois et examiner les actions réellement menées. Si plusieurs évaluateurs interviennent, une calibration préalable et une revue des écarts sont nécessaires.</p></article>
          </div>

          <div className="methodology-timeline">
            <article><b>T0</b><div><h3>Diagnostic initial</h3><p>Même grille, contexte documenté et faits observables. Trois actions maximum sont définies avec les appuis nécessaires.</p></div></article>
            <span><FontAwesomeIcon icon={faArrowRight} /></span>
            <article><b>T+6</b><div><h3>Entretien de suivi</h3><p>La grille est reprise dans des conditions comparables. Les écarts sont discutés avec les actions réellement menées.</p></div></article>
          </div>

          <div className="methodology-limitations">
            <FontAwesomeIcon icon={faScaleBalanced} />
            <div><h3>Conditions d’interprétation</h3><ul>
              <li><FontAwesomeIcon icon={faCircleCheck} /> Le score synthétise un entretien ; il ne mesure ni la valeur d’une personne ni son potentiel absolu.</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> Une progression entre deux dates est observée. Elle ne démontre pas, à elle seule, un lien causal avec une formation.</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> La grille n’est pas présentée comme un test psychométrique validé ; l’évaluateur doit être formé et documenter ses observations.</li>
              <li><FontAwesomeIcon icon={faCircleCheck} /> Aucune décision de recrutement, promotion, sanction ou rupture ne peut être fondée uniquement sur ce score.</li>
            </ul></div>
          </div>
        </section>

        <section className="pilot-proof-section">
          <span><FontAwesomeIcon icon={faTriangleExclamation} /></span>
          <div><small>Témoignages</small><h2>Nous ne publions pas de citation sans pilote vérifiable.</h2><p>Les témoignages seront ajoutés avec l’accord du client, son contexte et des résultats contrôlables. En attendant, les maquettes ci-dessus sont explicitement synthétiques et ne sont pas présentées comme des exports déjà automatisés.</p></div>
          <a className="primary-btn" href={pilotUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('pilot_interest_clicked', 'pilot')}><FontAwesomeIcon icon={faCalendarCheck} /> Devenir organisation pilote</a>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
