import { faBuilding, faGraduationCap, faUserShield } from '@fortawesome/free-solid-svg-icons';

export const PRICE_CATALOG = Object.freeze({
  trainer: Object.freeze({ monthly: 5000, annual: 50000 }),
  center: Object.freeze({ monthlyMin: 25000, monthlyMax: 75000 }),
  enterprise: Object.freeze({ monthly: 25000, employeeLimit: 25 }),
  enterpriseTeam: Object.freeze({ monthly: 75000, employeeLimit: 100 }),
});

export function formatCfa(amount) {
  return Number(amount).toLocaleString('fr-FR').replaceAll('\u202f', ' ');
}

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
    price: PRICE_CATALOG.trainer.monthly,
    icon: faUserShield,
    description: 'Toutes les fonctionnalités Check Performance dans une offre unique.',
    features: ['Création, import, QCM progressifs et création assistée', 'Classes, partage, notes et exports', 'Sondages et analyses avancées inclus'],
    excluded: [],
    badge: 'Accès complet',
    cta: 'Créer mon espace formateur',
    to: '/register-admin',
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: PRICE_CATALOG.enterprise.monthly,
    icon: faBuilding,
    description: 'Un espace dédié au développement des soft skills.',
    features: ['Diagnostic Mindset Techco en 4 piliers', 'Entretiens T0 et suivi T+6 mois', 'Plans d’action et comparaison de progression'],
    excluded: [],
    cta: 'Créer mon espace entreprise',
    to: '/register-enterprise',
  },
];
