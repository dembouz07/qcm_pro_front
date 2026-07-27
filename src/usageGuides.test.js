import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN_GUIDE_IDS, defaultGuideFor, USAGE_GUIDES } from './config/usageGuides.js';

test('les guides couvrent tous les rôles et toutes les formules formateur', () => {
  assert.deepEqual(ADMIN_GUIDE_IDS, ['free', 'essential', 'premium']);
  assert.deepEqual(
    Object.keys(USAGE_GUIDES).sort(),
    ['enterprise', 'essential', 'free', 'premium', 'student', 'superadmin'],
  );

  for (const guide of Object.values(USAGE_GUIDES)) {
    assert.ok(guide.features.length >= 4);
    assert.ok(guide.steps.length >= 4);
    assert.ok(guide.howtos.length >= 2);
    assert.ok(guide.actionPath.startsWith('/'));
  }
});

test('le guide affiché par défaut suit le rôle et la formule active', () => {
  assert.equal(defaultGuideFor({ role: 'student' }), 'student');
  assert.equal(defaultGuideFor({ role: 'enterprise' }), 'enterprise');
  assert.equal(defaultGuideFor({ role: 'superadmin' }), 'superadmin');
  assert.equal(defaultGuideFor({ role: 'admin', current_plan: 'free' }), 'free');
  assert.equal(defaultGuideFor({ role: 'admin', current_plan: 'essential' }), 'essential');
  assert.equal(defaultGuideFor({ role: 'admin', current_plan: 'premium' }), 'premium');
  assert.equal(defaultGuideFor({ role: 'admin', current_plan: 'unknown' }), 'free');
});
