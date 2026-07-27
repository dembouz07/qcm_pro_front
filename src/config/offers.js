import { faBuilding, faGraduationCap, faUserShield } from '@fortawesome/free-solid-svg-icons';

export const PUBLIC_OFFERS = [
  {
    id: 'student',
    name: 'Élève',
    price: 0,
    icon: faGraduationCap,
    description: 'Pour rejoindre une classe et progresser à son rythme.',
    features: ['Accès aux QCM de votre formateur', 'Résultats et corrections détaillées', 'Suivi de vos notes'],
    excluded: [],
    cta: 'Créer un compte élève',
    to: '/register',
  },
  {
    id: 'trainer',
    name: 'Formateur',
    price: 5000,
    icon: faUserShield,
    description: 'Toutes les fonctionnalités QCM Pro dans une offre unique.',
    features: ['Création, import, QCM progressifs et création assistée', 'Classes, partage, notes et exports', 'Sondages et analyses avancées inclus'],
    excluded: [],
    badge: 'Accès complet',
    cta: 'Créer mon espace formateur',
    to: '/register-admin',
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: 25000,
    icon: faBuilding,
    description: 'Un espace dédié au développement des soft skills.',
    features: ['Diagnostic Mindset Techco en 4 piliers', 'Entretiens T0 et suivi T+6 mois', 'Plans d’action et comparaison de progression'],
    excluded: [],
    cta: 'Créer mon espace entreprise',
    to: '/register-enterprise',
  },
];
