import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCircleInfo, faDatabase, faScaleBalanced, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { PublicFooter, PublicHeader, bookingUrl, trackPublicIntent } from '../components/PublicChrome.jsx';
import { useScrollToHash } from '../utils/useScrollToHash.js';
import { formatCfa, PRICE_CATALOG } from '../config/offers.js';

const updatedAt = '6 août 2026';
const legalName = import.meta.env.VITE_LEGAL_NAME || 'Check Performance — identité juridique à compléter';
const legalAddress = import.meta.env.VITE_LEGAL_ADDRESS || 'Adresse du siège à compléter avant commercialisation';
const legalRegistration = import.meta.env.VITE_LEGAL_REGISTRATION || 'NINEA / RCCM à compléter avant commercialisation';
const privacyEmail = import.meta.env.VITE_PRIVACY_EMAIL || '';
const dataHostingDetails = import.meta.env.VITE_DATA_HOSTING_DETAILS || 'Entités contractantes, adresses et régions d’hébergement à confirmer avant commercialisation.';
const transferGuarantees = import.meta.env.VITE_TRANSFER_GUARANTEES || 'Transferts éventuels et garanties contractuelles à confirmer avant commercialisation.';
const retentionProcess = import.meta.env.VITE_RETENTION_PROCESS || '';
const hostingReady = Boolean(import.meta.env.VITE_DATA_HOSTING_DETAILS && import.meta.env.VITE_TRANSFER_GUARANTEES);
const retentionReady = Boolean(retentionProcess);
const legalReady = Boolean(import.meta.env.VITE_LEGAL_NAME && import.meta.env.VITE_LEGAL_ADDRESS && import.meta.env.VITE_LEGAL_REGISTRATION && import.meta.env.VITE_LEGAL_PUBLISHER && privacyEmail && hostingReady && retentionReady);

function RightsContact() {
  return (
    <div className="legal-contact-box" id="exercer-vos-droits">
      <h2>Exercer vos droits</h2>
      <p>L’export est disponible depuis « Mon compte ». Pour une rectification, une opposition ou une suppression, écrivez au responsable de traitement afin que la demande soit vérifiée et suivie.</p>
      {privacyEmail
        ? <a className="primary-btn" href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
        : <p className="legal-missing"><FontAwesomeIcon icon={faCircleInfo} /> L’adresse de confidentialité doit être configurée avant l’ouverture commerciale. En phase pilote, utilisez le canal convenu avec votre organisation.</p>}
    </div>
  );
}

const documents = {
  privacy: {
    eyebrow: 'Protection des données',
    icon: faShieldHalved,
    title: 'Politique de confidentialité',
    intro: 'Cette politique explique les données traitées par Check Performance, pourquoi elles le sont, qui peut les consulter et combien de temps elles sont conservées.',
    content: (
      <>
        <section><h2>1. Responsable et rôles</h2><p>Le responsable de traitement est <strong>{legalName}</strong>, {legalAddress}. Pour un usage organisé par un centre de formation ou une entreprise, cette organisation détermine généralement les finalités de l’évaluation et Check Performance agit comme prestataire pour l’hébergement et l’outillage.</p></section>
        <section><h2>2. Données et finalités</h2><ul><li>Compte : nom, email, rôle, organisation et éléments de sécurité, pour fournir et sécuriser l’accès.</li><li>Évaluations : réponses, résultats, dates et classe/cohorte, pour corriger, suivre et produire les rapports demandés.</li><li>Soft skills : identité professionnelle, poste, scores, observations, actions et besoins d’appui, pour conduire les entretiens T0 et de suivi.</li><li>Paiements : référence, formule, montant et statut. Les données de carte ne sont pas stockées par Check Performance.</li><li>Journaux techniques : adresse IP, navigateur et événements de sécurité, pour prévenir les abus et diagnostiquer les incidents.</li></ul></section>
        <section className="audience-notices" id="informations-par-public"><h2>3. Information selon votre situation</h2><div><article><h3>Élèves et apprenants</h3><p>Votre formateur voit les réponses, résultats et informations de classe nécessaires au suivi. Un QCM public peut être passé sans compte, mais peut demander une identité ou un référentiel : utilisez les informations convenues avec l’organisateur.</p></article><article><h3>Parents et responsables légaux</h3><p>Lorsqu’un apprenant est mineur, l’établissement ou l’organisateur doit l’informer dans un langage adapté et organiser, lorsque nécessaire, l’intervention du responsable légal. Check Performance ne collecte pas volontairement l’âge.</p></article><article><h3>Salariés et candidats</h3><p>Vous devez connaître l’objectif du diagnostic, les destinataires du rapport et la durée de conservation avant l’entretien. Un score Mindset est un support d’échange ; il ne peut fonder seul aucune décision RH.</p></article></div></section>
        <section><h2>4. Destinataires et accès</h2><p>Les données sont accessibles aux personnes autorisées de votre organisation, aux administrateurs strictement nécessaires au support et aux prestataires techniques encadrés. Elles ne sont ni vendues ni utilisées pour de la publicité ciblée.</p></section>
        <section><h2>5. Durées de conservation</h2><div className="retention-table"><span><strong>Comptes actifs</strong><small>Pendant le contrat, puis 12 mois après fermeture pour permettre la restitution.</small></span><span><strong>Réponses et résultats QCM</strong><small>24 mois après la fin de la cohorte, sauf durée plus courte fixée par l’organisation.</small></span><span><strong>Entretiens Mindset</strong><small>24 mois après le dernier suivi, sauf demande légitime ou règle interne plus courte.</small></span><span><strong>Prospects et demandes de démo</strong><small>12 mois après le dernier échange.</small></span><span><strong>Journaux de sécurité</strong><small>12 mois maximum, sauf incident nécessitant une conservation probatoire.</small></span><span><strong>Facturation</strong><small>Durée imposée par les obligations comptables et fiscales applicables.</small></span></div><p>À l’échéance, les données sont supprimées ou rendues anonymes. Une suspension de suppression peut s’appliquer en cas de litige ou d’obligation légale.</p>{retentionProcess && <p><strong>Procédure opérationnelle :</strong> {retentionProcess}</p>}</section>
        <section><h2>6. Hébergement et transferts</h2><p><strong>Hébergement :</strong> {dataHostingDetails}</p><p><strong>Transferts et garanties :</strong> {transferGuarantees}</p></section>
        <section><h2>7. Sécurité</h2><p>Les échanges de production doivent utiliser HTTPS. L’authentification web est conçue pour utiliser un cookie de session sécurisé et HttpOnly sur des sous-domaines de la même marque, avec protection CSRF, politique CSP et limitation des tentatives.</p></section>
        <section><h2>Mesures d’usage pseudonymisées</h2><p>Les événements nécessaires au test produit de 90 jours excluent les noms, emails, réponses et observations. Ils sont conservés au maximum 12 mois. Les codes secrets permettant de rouvrir un résultat public expirent après 30 jours.</p></section>
        <RightsContact />
        <section><h2>8. Autorité de contrôle</h2><p>Vous pouvez également vous informer ou déposer une réclamation auprès de la <a href="https://www.cdp.sn/" target="_blank" rel="noopener noreferrer">Commission de Protection des Données Personnelles du Sénégal (CDP)</a>.</p></section>
      </>
    ),
  },
  terms: {
    eyebrow: 'Règles d’utilisation', icon: faScaleBalanced, title: 'Conditions générales d’utilisation',
    intro: 'Les présentes CGU encadrent l’accès à la plateforme par les formateurs, organisations, apprenants et participants.',
    content: (<><section><h2>1. Objet</h2><p>Check Performance fournit des outils de création d’évaluations, de participation, de restitution et de suivi des soft skills. Chaque utilisateur respecte le rôle et les droits qui lui sont attribués.</p></section><section><h2>2. Compte et sécurité</h2><p>Vous fournissez des informations exactes, gardez vos accès confidentiels et signalez toute utilisation suspecte. L’accès peut être suspendu en cas d’abus, de fraude ou d’atteinte à la sécurité.</p></section><section><h2>3. Contenus et responsabilités</h2><p>Le formateur ou l’organisation reste responsable des questions, critères, périodes de disponibilité, destinataires et décisions prises à partir des résultats. Il doit disposer des droits nécessaires sur les contenus importés.</p></section><section><h2>4. Usage des scores</h2><p>Les scores soutiennent une évaluation pédagogique ou un entretien. Ils ne constituent ni un diagnostic médical, ni une certification réglementée, ni une décision automatisée. Toute décision importante doit être revue par une personne compétente sur la base d’éléments complémentaires.</p></section><section><h2>5. Disponibilité</h2><p>Le service vise une disponibilité continue, hors maintenance, incident ou force majeure. Les données critiques doivent être exportées selon les besoins de l’organisation.</p></section><section><h2>6. Résiliation</h2><p>Les abonnements en libre-service sont payés pour une période définie et ne sont pas renouvelés automatiquement tant qu’aucun mandat récurrent n’est proposé. À l’échéance, les fonctionnalités payantes cessent ; les modalités d’export et de suppression restent disponibles selon la politique de confidentialité.</p></section></>),
  },
  sales: {
    eyebrow: 'Conditions commerciales', icon: faDatabase, title: 'Conditions générales de vente',
    intro: 'Ces conditions décrivent les offres en libre-service et les contrats accompagnés. Un devis signé prévaut lorsqu’il fixe des modalités spécifiques.',
    content: (<><section><h2>1. Offres et prix</h2><ul><li>Formateur : {formatCfa(PRICE_CATALOG.trainer.monthly)} F CFA par mois ou {formatCfa(PRICE_CATALOG.trainer.annual)} F CFA par an.</li><li>Centre de formation : de {formatCfa(PRICE_CATALOG.center.monthlyMin)} à {formatCfa(PRICE_CATALOG.center.monthlyMax)} F CFA par mois selon le nombre de formateurs, cohortes et besoins de consolidation, sur devis.</li><li>Entreprise Essentiel : {formatCfa(PRICE_CATALOG.enterprise.monthly)} F CFA par mois, jusqu’à {PRICE_CATALOG.enterprise.employeeLimit} collaborateurs.</li><li>Entreprise Équipe : {formatCfa(PRICE_CATALOG.enterpriseTeam.monthly)} F CFA par mois, jusqu’à {PRICE_CATALOG.enterpriseTeam.employeeLimit} collaborateurs.</li></ul><p>Les prix et limites applicables figurent sur le récapitulatif présenté avant paiement ou sur le devis.</p></section><section><h2>2. Essai formateur</h2><p>Le premier mois Formateur est offert sans carte bancaire. À son terme, aucune somme n’est débitée automatiquement. Le client choisit et paie une nouvelle période s’il souhaite conserver les fonctions payantes.</p></section><section><h2>3. Paiement</h2><p>Le paiement peut être proposé via PayTech (Wave, Orange Money ou carte selon disponibilité). Une période payée commence à la confirmation du prestataire et n’est pas reconduite automatiquement dans le tunnel actuel.</p></section><section><h2>4. Pilote entreprise</h2><p>Le pilote est payant, cadré par devis et limité dans le temps. Son montant hors prestations non récurrentes est déduit du contrat annuel signé dans les 30 jours suivant sa fin.</p></section><section><h2>5. Résiliation et fin de période</h2><p>Comme il n’existe pas de débit récurrent dans le tunnel actuel, il suffit de ne pas renouveler. Pour un contrat sur devis, le délai de préavis et les modalités de sortie sont ceux du bon de commande.</p></section><section><h2>6. Données et réversibilité</h2><p>Le client peut demander l’export de ses données avant la fin du service. La suppression intervient selon la politique de confidentialité et les obligations légales de conservation.</p></section><section><h2>7. Droit applicable</h2><p>Le contrat est soumis au droit applicable au siège de l’éditeur, sous réserve des règles impératives. Une résolution amiable est recherchée avant toute procédure.</p></section></>),
  },
  notices: {
    eyebrow: 'Éditeur et hébergement', icon: faCircleInfo, title: 'Mentions légales',
    intro: 'Les informations ci-dessous doivent identifier sans ambiguïté l’éditeur, le responsable de publication et les prestataires d’hébergement.',
    content: (<><section><h2>Éditeur</h2><p><strong>{legalName}</strong><br />{legalAddress}<br />{legalRegistration}</p><p>Directeur ou directrice de publication : {import.meta.env.VITE_LEGAL_PUBLISHER || 'à compléter avant commercialisation'}.</p></section><section><h2>Contact</h2><p>{privacyEmail ? <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> : 'Adresse email professionnelle à configurer.'}</p></section><section><h2>Hébergement</h2><p>{dataHostingDetails}</p><p>{transferGuarantees}</p></section><section><h2>Propriété intellectuelle</h2><p>La marque, les interfaces et les contenus propres à Check Performance sont protégés. Les contenus d’évaluation importés restent sous la responsabilité et les droits de leur auteur ou organisation.</p></section><section><h2>Statut de cette page</h2><p className="legal-missing"><FontAwesomeIcon icon={faCircleInfo} /> Cette version de pré-lancement ne remplace pas la validation d’un conseil juridique. Les champs signalés doivent être complétés avant toute commercialisation publique.</p></section></>),
  },
};

export default function LegalPage({ document }) {
  useScrollToHash();
  const page = documents[document];
  return (
    <div className="public-page legal-page">
      <PublicHeader />
      <main>
        {!retentionReady && <p className="legal-draft-banner">Les durées affichées sont des limites cibles : la procédure opérationnelle de suppression et d’anonymisation doit être validée et activée avant la commercialisation.</p>}
        <header className="legal-hero"><Link className="back-link" to="/"><FontAwesomeIcon icon={faArrowLeft} /> Retour à l’accueil</Link><span className="eyebrow"><FontAwesomeIcon icon={page.icon} /> {page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p><small>Dernière mise à jour : {updatedAt}</small>{!legalReady && <p className="legal-draft-banner"><FontAwesomeIcon icon={faCircleInfo} /> Brouillon de pré-lancement : ne pas publier avant de renseigner l’identité légale, le contact confidentialité et les informations définitives d’hébergement.</p>}</header>
        <div className="legal-layout"><aside><strong>Documents</strong><Link to="/confidentialite">Confidentialité</Link><Link to="/cgu">CGU</Link><Link to="/cgv">CGV</Link><Link to="/mentions-legales">Mentions légales</Link><a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackPublicIntent('contact_clicked', 'public')}>Nous contacter</a></aside><article className="legal-document">{page.content}</article></div>
      </main>
      <PublicFooter />
    </div>
  );
}
