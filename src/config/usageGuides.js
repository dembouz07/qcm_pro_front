import {
  faBolt,
  faBookOpen,
  faBuilding,
  faCalendarCheck,
  faChartColumn,
  faCircleCheck,
  faCircleInfo,
  faClipboardCheck,
  faComments,
  faCrown,
  faFileImport,
  faFileLines,
  faGift,
  faGraduationCap,
  faListCheck,
  faPenToSquare,
  faPlay,
  faShareNodes,
  faShieldHalved,
  faUserPlus,
  faUsers,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';

export const ADMIN_GUIDE_IDS = ['free', 'essential', 'premium'];

export const USAGE_GUIDES = {
  student: {
    label: 'Apprenant',
    icon: faGraduationCap,
    color: '#2563eb',
    soft: '#eff6ff',
    intro: 'Retrouvez les QCM de votre classe, passez-les au bon moment et suivez vos résultats.',
    features: [
      'QCM ouverts et programmés par le formateur',
      'Compte à rebours avant l’ouverture',
      'Notes, moyenne et meilleure performance',
      'Correction détaillée lorsque le formateur l’autorise',
    ],
    steps: [
      ['Rejoindre la classe', 'Utilisez le code transmis par votre formateur lors de votre inscription.'],
      ['Repérer un QCM ouvert', 'Dans Mes QCM, le statut « Ouvert » indique les tests disponibles.'],
      ['Répondre puis envoyer', 'Avancez question par question et vérifiez votre progression avant l’envoi.'],
      ['Consulter le résultat', 'Ouvrez Notes pour retrouver votre score et, si disponible, la correction.'],
    ],
    howtos: [
      {
        title: 'Passer un QCM',
        icon: faPlay,
        items: ['Ouvrez Mes QCM.', 'Sélectionnez un test portant le statut « Ouvert ».', 'Répondez aux questions puis validez l’envoi.'],
      },
      {
        title: 'Lire une correction',
        icon: faBookOpen,
        items: ['Ouvrez Notes.', 'Sélectionnez un résultat dont la correction est disponible.', 'Comparez votre réponse, la bonne réponse et l’explication.'],
      },
      {
        title: 'Comprendre les statuts',
        icon: faCircleInfo,
        items: ['À venir : le QCM est programmé.', 'Ouvert : vous pouvez commencer.', 'Terminé ou fermé : aucune nouvelle tentative n’est possible.'],
      },
    ],
    tip: 'Actualisez Mes QCM avant une session pour récupérer les dernières ouvertures.',
    action: 'Voir mes QCM',
    actionPath: '/student',
  },
  free: {
    label: 'Gratuite',
    icon: faGift,
    color: '#059669',
    soft: '#ecfdf5',
    intro: 'Le socle pour organiser une classe, publier des QCM et suivre les notes.',
    features: [
      'Gestion des classes et des codes d’inscription',
      'Création manuelle de QCM',
      'Import CSV, JSON, Word ou PDF',
      'QCM progressifs publics',
      'Suivi des notes et corrections',
    ],
    steps: [
      ['Créer une classe', 'Nommez la classe puis générez son code d’inscription.'],
      ['Partager le code', 'Les apprenants l’utilisent pour rejoindre automatiquement la classe.'],
      ['Créer le contenu', 'Choisissez la saisie manuelle, l’import ou le QCM progressif.'],
      ['Programmer le QCM', 'Définissez les dates, la correction et la classe concernée.'],
      ['Suivre les notes', 'Consultez les résultats reçus depuis Notes.'],
    ],
    howtos: [
      {
        title: 'Préparer une classe',
        icon: faUsers,
        items: ['Ouvrez Classes et saisissez un nom.', 'Laissez le code vide pour le générer.', 'Copiez le code et transmettez-le aux apprenants.'],
      },
      {
        title: 'Créer un QCM manuel',
        icon: faPenToSquare,
        items: ['Ouvrez Créer un QCM.', 'Choisissez QCM manuel.', 'Renseignez les questions et marquez chaque bonne réponse.'],
      },
      {
        title: 'Importer un document',
        icon: faFileImport,
        items: ['Choisissez Importer un fichier.', 'Sélectionnez un format compatible.', 'Contrôlez les questions détectées avant publication.'],
      },
      {
        title: 'Partager et clôturer',
        icon: faShareNodes,
        items: ['Ouvrez le détail du QCM.', 'Copiez ou partagez le lien public.', 'Fermez, rouvrez ou archivez selon le besoin.'],
      },
    ],
    tip: 'Commencez par une classe et un QCM court pour valider le parcours avec vos apprenants.',
    action: 'Créer un QCM',
    actionPath: '/admin/quizzes/create',
  },
  essential: {
    label: 'Essentielle',
    icon: faBolt,
    color: '#5b5cf6',
    soft: '#eef0ff',
    intro: 'Accélérez la création grâce à l’analyse automatique d’un texte collé.',
    features: [
      'Toutes les fonctions de la formule Gratuite',
      'Création assistée depuis un texte',
      'Détection des questions et des réponses',
      'Révision manuelle avant publication',
    ],
    steps: [
      ['Préparer la classe', 'Créez la classe et partagez son code aux participants.'],
      ['Copier le contenu source', 'Préparez les questions et réponses dans un texte structuré.'],
      ['Lancer la création assistée', 'Collez le texte pour détecter automatiquement le QCM.'],
      ['Relire la détection', 'Corrigez les intitulés et marquez les bonnes réponses.'],
      ['Publier et analyser', 'Programmez le test puis suivez les notes de la classe.'],
    ],
    howtos: [
      {
        title: 'Utiliser la création assistée',
        icon: faWandMagicSparkles,
        items: ['Ouvrez Créer un QCM.', 'Choisissez Création assistée et collez votre texte.', 'Lancez l’analyse puis vérifiez chaque question.'],
      },
      {
        title: 'Améliorer la détection',
        icon: faFileLines,
        items: ['Séparez clairement chaque question.', 'Placez une réponse par ligne.', 'Indiquez explicitement la bonne réponse.'],
      },
      {
        title: 'Finaliser le QCM',
        icon: faCircleCheck,
        items: ['Corrigez les formulations ambiguës.', 'Ajoutez une explication utile.', 'Choisissez la classe et les dates.'],
      },
    ],
    tip: 'La création assistée fait gagner du temps, mais une relecture reste indispensable.',
    action: 'Créer avec un texte',
    actionPath: '/admin/quizzes/smart',
  },
  premium: {
    label: 'Formateur',
    icon: faCrown,
    color: '#172033',
    soft: '#f1f5f9',
    intro: 'Pilotez l’évaluation de bout en bout avec les sondages et l’analyse des difficultés.',
    features: [
      'Toutes les fonctions des formules précédentes',
      'Sondages anonymes et lien public',
      'Synthèse des réponses aux sondages',
      'Pourcentage de mauvaises réponses par question',
      'Analyse des non-réponses',
    ],
    steps: [
      ['Structurer les groupes', 'Créez les classes et partagez leurs codes d’accès.'],
      ['Choisir le bon format', 'Utilisez un QCM, un diagnostic progressif ou un sondage.'],
      ['Diffuser le contenu', 'Programmez le QCM ou partagez son lien public.'],
      ['Lire les résultats', 'Repérez les scores et les questions difficiles.'],
      ['Ajuster la suite', 'Adaptez le prochain contenu aux observations.'],
    ],
    howtos: [
      {
        title: 'Créer un sondage anonyme',
        icon: faComments,
        items: ['Ouvrez Sondages.', 'Ajoutez des questions à choix ou à réponse libre.', 'Activez le sondage puis partagez son lien.'],
      },
      {
        title: 'Analyser les questions ratées',
        icon: faChartColumn,
        items: ['Ouvrez un QCM ayant des soumissions.', 'Consultez Analyse des réponses.', 'Comparez erreurs et non-réponses.'],
      },
      {
        title: 'Exploiter les résultats',
        icon: faListCheck,
        items: ['Utilisez Notes pour la vue par apprenant.', 'Ouvrez le QCM pour la vue par question.', 'Réutilisez les difficultés dans la prochaine évaluation.'],
      },
    ],
    tip: 'Croisez les notes individuelles et l’analyse par question pour mieux cibler vos actions.',
    action: 'Créer un contenu',
    actionPath: '/admin/quizzes/create',
  },
  enterprise: {
    label: 'Entreprise',
    icon: faBuilding,
    color: '#0e83ad',
    soft: '#f0f9ff',
    intro: 'Conduisez les diagnostics Mindset et mesurez la progression de chaque collaborateur.',
    features: [
      'Fiches collaborateurs centralisées',
      'Diagnostic initial T0 sur quatre piliers',
      'Plan d’action et besoins d’accompagnement',
      'Diagnostic de suivi T+6',
      'Comparaison automatique de la progression',
    ],
    steps: [
      ['Créer la fiche', 'Ajoutez le collaborateur, sa fonction et ses informations professionnelles.'],
      ['Réaliser le diagnostic T0', 'Évaluez les 20 critères et consignez les observations.'],
      ['Définir le plan d’action', 'Fixez les engagements et la prochaine date.'],
      ['Effectuer le suivi T+6', 'Créez un diagnostic de suivi pour le même collaborateur.'],
      ['Comparer la progression', 'Consultez les écarts globaux et par pilier.'],
    ],
    howtos: [
      {
        title: 'Ajouter un collaborateur',
        icon: faUserPlus,
        items: ['Ouvrez Collaborateurs.', 'Choisissez Nouveau collaborateur.', 'Complétez puis enregistrez la fiche.'],
      },
      {
        title: 'Mener un diagnostic',
        icon: faClipboardCheck,
        items: ['Ouvrez Diagnostics.', 'Sélectionnez le collaborateur et Initial T0.', 'Notez les 20 critères et ajoutez les faits observés.'],
      },
      {
        title: 'Organiser le suivi',
        icon: faCalendarCheck,
        items: ['Renseignez les actions et la prochaine date.', 'À l’échéance, créez un Suivi T+6.', 'Ouvrez Suivi de progression pour comparer.'],
      },
    ],
    tip: 'Appuyez chaque note sur un fait observable pour rendre la comparaison T0 / T+6 exploitable.',
    action: 'Ajouter un collaborateur',
    actionPath: '/entreprise/collaborateurs/nouveau',
  },
  superadmin: {
    label: 'Super-administration',
    icon: faShieldHalved,
    color: '#b42318',
    soft: '#fff1f0',
    intro: 'Supervisez les comptes, les accès et les revenus de la plateforme.',
    features: [
      'Vue globale de l’activité',
      'Gestion des utilisateurs et des blocages',
      'Suivi des abonnements',
      'Consultation des revenus',
    ],
    steps: [
      ['Contrôler le tableau de bord', 'Surveillez les volumes et l’activité globale.'],
      ['Gérer les utilisateurs', 'Recherchez un compte et vérifiez son rôle.'],
      ['Traiter un accès', 'Bloquez ou réactivez un utilisateur selon la situation.'],
      ['Suivre les revenus', 'Consultez les paiements et les abonnements.'],
    ],
    howtos: [
      {
        title: 'Gérer un utilisateur',
        icon: faUsers,
        items: ['Ouvrez Utilisateurs.', 'Recherchez le compte concerné.', 'Vérifiez son rôle avant toute modification.'],
      },
      {
        title: 'Contrôler les abonnements',
        icon: faChartColumn,
        items: ['Ouvrez Revenus.', 'Consultez les montants et les formules.', 'Rapprochez ces données de l’activité globale.'],
      },
    ],
    tip: 'Vérifiez toujours l’adresse e-mail et le rôle avant de modifier l’accès d’un compte.',
    action: 'Gérer les utilisateurs',
    actionPath: '/superadmin/users',
  },
};

export function defaultGuideFor(user) {
  if (user?.role === 'admin') {
    return ADMIN_GUIDE_IDS.includes(user.current_plan) ? user.current_plan : 'free';
  }
  if (user?.role === 'enterprise') return 'enterprise';
  if (user?.role === 'superadmin') return 'superadmin';
  return 'student';
}
