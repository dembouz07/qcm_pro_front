import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonthsToDateValue } from './enterprise.js';

test('le prochain suivi est proposé six mois après le T0', () => {
  assert.equal(addMonthsToDateValue('2026-01-25', 6), '2026-07-25');
});

test('le calcul de suivi respecte la fin du mois cible', () => {
  assert.equal(addMonthsToDateValue('2026-08-31', 6), '2027-02-28');
});
