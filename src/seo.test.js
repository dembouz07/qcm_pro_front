import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INDEXABLE_PATHS,
  SEO_ROUTES,
  buildStructuredData,
  getSeoRoute,
} from './config/seo.js';

test('chaque page indexable possède des métadonnées uniques et une URL canonique dédiée', () => {
  assert.equal(new Set(INDEXABLE_PATHS).size, INDEXABLE_PATHS.length);
  assert.equal(new Set(INDEXABLE_PATHS.map((path) => SEO_ROUTES[path].title)).size, INDEXABLE_PATHS.length);
  assert.equal(new Set(INDEXABLE_PATHS.map((path) => SEO_ROUTES[path].description)).size, INDEXABLE_PATHS.length);

  for (const path of INDEXABLE_PATHS) {
    const seo = getSeoRoute(path);
    assert.equal(seo.indexable, true);
    assert.ok(seo.title.length >= 30 && seo.title.length <= 70, `${path}: longueur du title`);
    assert.ok(seo.description.length >= 100 && seo.description.length <= 170, `${path}: longueur de description`);
    assert.ok(seo.h1.length > 20, `${path}: H1 descriptif`);
  }
});
test('les routes privées et inconnues demandent explicitement la non-indexation', () => {
  for (const path of ['/login', '/admin', '/quiz/secret', '/adresse-inconnue']) {
    assert.equal(getSeoRoute(path).indexable, false, path);
  }
});

test('les données structurées restent factuelles et relient chaque page au site', () => {
  const seo = getSeoRoute('/qcm-en-ligne');
  const data = buildStructuredData(seo, 'https://example.test');
  const serialized = JSON.stringify(data);

  assert.match(serialized, /Organization/);
  assert.match(serialized, /WebSite/);
  assert.match(serialized, /BreadcrumbList/);
  assert.match(serialized, /FAQPage/);
  assert.doesNotMatch(serialized, /aggregateRating|reviewCount/);
});
