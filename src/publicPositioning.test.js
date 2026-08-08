import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const landing = readFileSync(new URL('./pages/LandingImpact.jsx', import.meta.url), 'utf8');
const resources = readFileSync(new URL('./pages/Resources.jsx', import.meta.url), 'utf8');
const legal = readFileSync(new URL('./pages/LegalPage.jsx', import.meta.url), 'utf8');
const offers = readFileSync(new URL('./config/offers.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const publicChrome = readFileSync(new URL('./components/PublicChrome.jsx', import.meta.url), 'utf8');
const authTopbar = readFileSync(new URL('./components/AuthTopbar.jsx', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');

test('la page publique expose la promesse, les cibles et les prix décidés', () => {
  assert.match(landing, /Mesurez et prouvez l’impact de vos formations/);
  assert.match(landing, /Centres de formation/);
  assert.match(landing, /Consultants RH/);
  assert.match(offers, /annual:\s*50000/);
  assert.match(offers, /monthly:\s*75000/);
});

test('les preuves fictives et les limites RH restent explicites', () => {
  assert.match(resources, /données entièrement synthétiques/i);
  assert.match(resources, /ne démontre pas, à elle seule, un lien causal/i);
  assert.match(resources, /Aucune décision de recrutement/);
  assert.match(legal, /ne peut fonder seul aucune décision RH/i);
});

test('la phase pilote ferme le libre-service et mesure des intentions dédupliquées', () => {
  assert.match(app, /path="\/register-admin" element=\{<RegisterAdmin \/>\}/);
  assert.match(app, /path="\/register-enterprise" element=\{<RegisterEnterprise \/>\}/);
  assert.match(authTopbar, /to="\/register-admin"/);
  assert.match(authTopbar, /to="\/register-enterprise"/);
  assert.match(landing, /inscriptions et paiements en libre-service restent fermés/i);
  assert.match(viteConfig, /Ouverture commerciale bloquée/);
  assert.match(publicChrome, /sessionStorage\.setItem\(PUBLIC_VISITOR_KEY/);
  assert.match(landing, /contact_clicked/);
});
