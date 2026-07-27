import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_OFFERS } from './config/offers.js';

test('les trois offres publiques gardent leurs audiences, tarifs et parcours', () => {
  assert.deepEqual(
    PUBLIC_OFFERS.map(({ id, name, price, to }) => ({ id, name, price, to })),
    [
      { id: 'student', name: 'Élève', price: 0, to: '/register' },
      { id: 'trainer', name: 'Formateur', price: 5000, to: '/register-admin' },
      { id: 'enterprise', name: 'Entreprise', price: 25000, to: '/register-enterprise' },
    ],
  );
});

test('les offres Formateur et Entreprise restent fonctionnellement séparées', () => {
  const trainer = PUBLIC_OFFERS.find((offer) => offer.id === 'trainer');
  const enterprise = PUBLIC_OFFERS.find((offer) => offer.id === 'enterprise');

  assert.ok(trainer.features.some((feature) => feature.includes('QCM')));
  assert.ok(trainer.features.some((feature) => feature.includes('Sondages')));
  assert.ok(enterprise.features.some((feature) => feature.includes('Mindset')));
  assert.ok(enterprise.features.some((feature) => feature.includes('T0')));
  assert.ok(enterprise.features.every((feature) => !feature.includes('QCM')));
});
