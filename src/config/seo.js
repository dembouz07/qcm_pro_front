export const SITE_NAME = 'Check Performance';
export const DEFAULT_PUBLIC_SITE_URL = 'https://qcm-nine.vercel.app';
export const DEFAULT_SOCIAL_IMAGE = '/cp.png';

const commonLinks = [
  { label: 'QCM en ligne', to: '/qcm-en-ligne' },
  { label: 'Évaluation des acquis', to: '/evaluation-des-acquis' },
  { label: 'Développement des soft skills', to: '/developpement-soft-skills' },
  { label: 'Guides et exemples', to: '/ressources' },
];

export const SEO_ROUTES = {
  '/': {
    title: 'Check Performance | QCM en ligne et suivi des soft skills',
    description: 'Créez des QCM en ligne, évaluez les acquis et documentez la progression des soft skills avec des résultats lisibles par participant et par cohorte.',
    h1: 'Évaluez les acquis et documentez la progression avec Check Performance.',
    lead: 'Une plateforme web pour créer des QCM en ligne, analyser les résultats de formation et suivre le développement des compétences comportementales.',
    highlights: [
      'QCM de positionnement, évaluations finales et corrections',
      'Résultats individuels, statistiques de cohorte et rapports',
      'Entretiens soft skills structurés du T0 au suivi à six mois',
    ],
    links: commonLinks,
    changefreq: 'weekly',
    priority: '1.0',
    schemaType: 'WebSite',
  },
  '/qcm-en-ligne': {
    title: 'Logiciel de QCM en ligne pour formateurs | Check Performance',
    description: 'Créez, diffusez et analysez vos QCM en ligne : import, partage sans compte, corrections, statistiques et rapports pour formateurs et centres.',
    h1: 'Créez, diffusez et analysez vos QCM en ligne.',
    lead: 'Check Performance réunit la création de questions, la diffusion aux participants et l’analyse des résultats dans un même outil de QCM en ligne.',
    highlights: [
      'Création manuelle, import de questions et QCM progressifs',
      'Partage par classe, code ou lien public sans compte',
      'Corrections, questions difficiles, exports et rapport formateur',
    ],
    links: [
      { label: 'Tester un QCM sans compte', to: '/demo-qcm' },
      { label: 'Mesurer les acquis en formation', to: '/evaluation-des-acquis' },
      { label: 'Voir un exemple de rapport', to: '/ressources#rapport-formateur' },
    ],
    faqs: [
      { question: 'Comment créer un QCM en ligne avec Check Performance ?', answer: 'Le formateur peut saisir ses questions, importer un questionnaire structuré ou préparer un QCM progressif, puis vérifier le contenu avant diffusion.' },
      { question: 'Les participants doivent-ils créer un compte ?', answer: 'Non. Un QCM peut être partagé par lien public et passé sans compte participant. Un espace identifié reste possible lorsqu’un suivi individuel est nécessaire.' },
      { question: 'Quels résultats sont disponibles après un QCM ?', answer: 'Le formateur peut consulter les notes, les corrections, la distribution des résultats et les questions qui ont posé le plus de difficultés.' },
      { question: 'Le logiciel convient-il à un centre de formation ?', answer: 'Oui. Les classes et cohortes permettent de séparer les groupes, de suivre les participants et de restituer les résultats dans un cadre homogène.' },
    ],
    changefreq: 'weekly',
    priority: '0.9',
    schemaType: 'Service',
    serviceType: 'Création et analyse de QCM en ligne',
  },
  '/evaluation-des-acquis': {
    title: 'Évaluation des acquis en formation | Check Performance',
    description: 'Mesurez les acquis avant, pendant et après une formation avec des QCM de positionnement, évaluations finales et rapports par cohorte.',
    h1: 'Mesurez les acquis avant, pendant et après la formation.',
    lead: 'Structurez un diagnostic initial, une évaluation formative ou un bilan final, puis restituez les résultats de façon compréhensible.',
    highlights: [
      'Positionnement initial et objectifs pédagogiques explicites',
      'Évaluations formatives ou finales reliées à une cohorte',
      'Résultats documentés sans confondre score et impact causal',
    ],
    links: [
      { label: 'Découvrir le logiciel de QCM en ligne', to: '/qcm-en-ligne' },
      { label: 'Tester le parcours participant', to: '/demo-qcm' },
      { label: 'Consulter les exemples de rapports', to: '/ressources' },
    ],
    faqs: [
      { question: 'Quand réaliser une évaluation des acquis ?', answer: 'Elle peut être menée avant la formation pour établir un niveau initial, pendant le parcours pour ajuster l’accompagnement, puis à la fin pour vérifier les apprentissages visés.' },
      { question: 'Quelle différence entre positionnement et évaluation finale ?', answer: 'Le positionnement décrit le point de départ. L’évaluation finale vérifie les acquis au regard des objectifs pédagogiques annoncés.' },
      { question: 'Un score prouve-t-il à lui seul l’impact de la formation ?', answer: 'Non. Il documente un résultat observé. Attribuer une progression à la formation demande un protocole complémentaire et la prise en compte du contexte.' },
    ],
    changefreq: 'monthly',
    priority: '0.8',
    schemaType: 'Service',
    serviceType: 'Évaluation des acquis en formation',
  },
  '/developpement-soft-skills': {
    title: 'Évaluation des soft skills en entreprise | Check Performance',
    description: 'Évaluez les soft skills avec une grille d’entretien structurée, un plan d’action et un suivi T0–T+6 des compétences comportementales.',
    h1: 'Évaluez les soft skills et documentez leur progression.',
    lead: 'Un cadre d’entretien pour observer des comportements, convenir d’actions et comparer une situation initiale avec un suivi à six mois.',
    highlights: [
      '20 critères comportementaux répartis sur quatre piliers',
      'Exemples concrets, verbatims et besoins d’accompagnement',
      'Plan d’action puis comparaison documentée entre T0 et T+6',
    ],
    links: [
      { label: 'Lire la méthodologie', to: '/ressources#methode' },
      { label: 'Voir le rapport T0–T+6', to: '/ressources#rapport-t0-t6' },
      { label: 'Découvrir les évaluations de connaissances', to: '/evaluation-des-acquis' },
    ],
    faqs: [
      { question: 'Quelles soft skills sont observées ?', answer: 'La grille actuelle documente vingt critères regroupés autour de la confiance, de l’exécution, de l’innovation et de la création de valeur.' },
      { question: 'Comment mesurer la progression des soft skills ?', answer: 'Les mêmes critères sont discutés dans des conditions comparables au diagnostic initial puis au suivi, avec des exemples observables et les actions réellement menées.' },
      { question: 'S’agit-il d’un test psychométrique ?', answer: 'Non. Il s’agit d’une grille d’entretien structurée. Elle ne mesure ni la valeur d’une personne ni son potentiel absolu et ne doit pas être présentée comme un test psychométrique validé.' },
      { question: 'Le score peut-il décider d’un recrutement ou d’une promotion ?', answer: 'Non. Aucune décision de recrutement, de promotion, de sanction ou de rupture ne doit être fondée uniquement sur ce score.' },
    ],
    changefreq: 'monthly',
    priority: '0.9',
    schemaType: 'Service',
    serviceType: 'Évaluation et suivi des soft skills',
  },
  '/ressources': {
    title: 'Guides QCM et soft skills | Check Performance',
    description: 'Testez le QCM en ligne, consultez des exemples de rapports et découvrez la méthode utilisée pour documenter la progression des soft skills.',
    h1: 'Guides, exemples et méthode Check Performance.',
    lead: 'Des ressources publiques pour vérifier le parcours QCM, comprendre les rapports et examiner la méthode soft skills avec ses limites.',
    highlights: [
      'QCM public de démonstration accessible sans compte',
      'Exemple synthétique de rapport formateur',
      'Méthodologie soft skills, échelle et garde-fous détaillés',
    ],
    links: commonLinks,
    changefreq: 'monthly',
    priority: '0.7',
    schemaType: 'CollectionPage',
  },
  '/demo-qcm': {
    title: 'QCM en ligne gratuit : testez la démo | Check Performance',
    description: 'Testez gratuitement un QCM en ligne sans créer de compte : cinq questions, correction immédiate et aperçu du parcours participant.',
    h1: 'Testez un QCM en ligne sans créer de compte.',
    lead: 'Répondez à cinq questions de démonstration et consultez immédiatement la correction, comme un participant invité par son formateur.',
    highlights: [
      'Aucune inscription pour la démonstration',
      'Correction et explications immédiates',
      'Parcours responsive utilisable sur téléphone',
    ],
    links: [
      { label: 'Créer et diffuser des QCM en ligne', to: '/qcm-en-ligne' },
      { label: 'Découvrir l’évaluation des acquis', to: '/evaluation-des-acquis' },
      { label: 'Voir un exemple de rapport', to: '/ressources#rapport-formateur' },
    ],
    changefreq: 'monthly',
    priority: '0.8',
    schemaType: 'WebApplication',
  },
};

const NOINDEX_EXACT_ROUTES = new Set([
  '/login', '/register', '/register-admin', '/register-enterprise', '/forgot-password',
  '/account', '/guide', '/mes-notes', '/confidentialite', '/cgu', '/cgv', '/mentions-legales',
]);

const NOINDEX_PREFIXES = ['/admin', '/entreprise', '/student', '/superadmin', '/quiz/', '/sondage/'];

export function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  return `/${pathname.split('?')[0].split('#')[0].split('/').filter(Boolean).join('/')}`;
}
export function getSeoRoute(pathname) {
  const path = normalizePathname(pathname);
  if (SEO_ROUTES[path]) return { ...SEO_ROUTES[path], path, indexable: true };

  const isPrivate = NOINDEX_EXACT_ROUTES.has(path)
    || NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));

  return {
    path,
    indexable: false,
    title: isPrivate ? `Espace sécurisé | ${SITE_NAME}` : `Page introuvable | ${SITE_NAME}`,
    description: isPrivate
      ? 'Espace sécurisé Check Performance réservé aux utilisateurs autorisés.'
      : 'Cette page est introuvable. Retrouvez les solutions QCM et soft skills de Check Performance.',
  };
}

export function normalizeSiteUrl(value = DEFAULT_PUBLIC_SITE_URL) {
  return String(value || DEFAULT_PUBLIC_SITE_URL).trim().replace(/\/+$/, '');
}

export function absoluteUrl(siteUrl, path = '/') {
  const base = normalizeSiteUrl(siteUrl);
  return path === '/' ? `${base}/` : `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildStructuredData(seo, siteUrl) {
  if (!seo?.indexable) return null;

  const base = normalizeSiteUrl(siteUrl);
  const canonical = absoluteUrl(base, seo.path);
  const organizationId = `${base}/#organization`;
  const websiteId = `${base}/#website`;
  const pageId = `${canonical}#webpage`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: SITE_NAME,
      url: `${base}/`,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(base, DEFAULT_SOCIAL_IMAGE),
      },
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: `${base}/`,
      name: SITE_NAME,
      inLanguage: 'fr',
      publisher: { '@id': organizationId },
    },
    {
      '@type': seo.schemaType === 'CollectionPage' ? 'CollectionPage' : 'WebPage',
      '@id': pageId,
      url: canonical,
      name: seo.title,
      description: seo.description,
      inLanguage: 'fr',
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
    },
  ];

  if (seo.path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: seo.h1, item: canonical },
      ],
    });
  }

  if (seo.schemaType === 'Service') {
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: seo.h1,
      serviceType: seo.serviceType,
      description: seo.description,
      url: canonical,
      provider: { '@id': organizationId },
    });
  }

  if (seo.schemaType === 'WebApplication') {
    graph.push({
      '@type': 'WebApplication',
      '@id': `${canonical}#application`,
      name: 'Démonstration QCM Check Performance',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Navigateur web',
      url: canonical,
      description: seo.description,
    });
  }

  if (seo.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: seo.faqs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export const INDEXABLE_PATHS = Object.keys(SEO_ROUTES);
