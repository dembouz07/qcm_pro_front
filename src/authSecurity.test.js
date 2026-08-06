import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const authSource = readFileSync(new URL('./AuthContext.jsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('./api.js', import.meta.url), 'utf8');
const publicQuizSource = readFileSync(new URL('./pages/PublicQuiz.jsx', import.meta.url), 'utf8');
const publicResultsSource = readFileSync(new URL('./pages/MyResults.jsx', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const vercelSource = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');
const renderSource = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
const vercelConfig = JSON.parse(vercelSource);

test('le navigateur ne persiste plus de jeton Bearer', () => {
  assert.equal(authSource.includes("localStorage.setItem('qcm_token'"), false);
  assert.equal(authSource.includes("localStorage.getItem('qcm_token'"), false);
  assert.equal(apiSource.includes('headers.Authorization'), false);
  assert.equal(apiSource.includes('Bearer ${token}'), false);
});

test('axios utilise les cookies et la protection XSRF Sanctum', () => {
  assert.match(apiSource, /withCredentials:\s*true/);
  assert.match(apiSource, /withXSRFToken:\s*true/);
  assert.match(authSource, /api\.get\('\/auth\/me'\)/);
  assert.match(apiSource, /status\s*===\s*419/);
  assert.match(apiSource, /__csrfRetried/);
});

test('la CSP autorise les API actuelle et cible sans wildcard', () => {
  for (const deploymentSource of [vercelSource, renderSource]) {
    assert.match(deploymentSource, /connect-src 'self'/);
    assert.match(deploymentSource, /https:\/\/qcm-pro-back-main-ipg9zr\.laravel\.cloud/);
    assert.match(deploymentSource, /https:\/\/api\.checkperformance\.sn/);
    assert.equal(deploymentSource.includes("connect-src *"), false);
  }

  assert.match(indexSource, /<meta name="mobile-web-app-capable" content="yes" \/>/);
});

test('Vercel rend Sanctum first-party via des routes non mises en cache', () => {
  assert.match(apiSource, /window\.location\.hostname\.endsWith\('\.vercel\.app'\)/);
  assert.match(apiSource, /usesVercelSameOriginProxy \? '\/api' : configuredApiURL/);

  assert.deepEqual(vercelConfig.rewrites.slice(0, 2), [
    {
      source: '/api/:path*',
      destination: 'https://qcm-pro-back-main-ipg9zr.laravel.cloud/api/:path*',
    },
    {
      source: '/sanctum/:path*',
      destination: 'https://qcm-pro-back-main-ipg9zr.laravel.cloud/sanctum/:path*',
    },
  ]);

  for (const source of ['/api/:path*', '/sanctum/:path*']) {
    const routeHeaders = vercelConfig.headers.find((entry) => entry.source === source)?.headers || [];
    assert.deepEqual(routeHeaders, [{ key: 'Cache-Control', value: 'private, no-store' }]);
  }
});

test('les résultats publics utilisent un secret temporaire sans query string ni stockage persistant', () => {
  assert.equal(publicQuizSource.includes('localStorage.setItem(storageKey'), false);
  assert.match(publicQuizSource, /sessionStorage\.setItem\(storageKey/);
  assert.match(publicQuizSource, /#access=/);
  assert.equal(publicQuizSource.includes('?attempt='), false);
  assert.match(publicResultsSource, /access_token:\s*normalizedCode/);
  assert.equal(publicResultsSource.includes("{ nom, prenom, referentiel }"), false);
});
