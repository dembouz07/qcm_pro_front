import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import {
  DEFAULT_PUBLIC_SITE_URL,
  DEFAULT_SOCIAL_IMAGE,
  INDEXABLE_PATHS,
  SITE_NAME,
  absoluteUrl,
  buildStructuredData,
  getSeoRoute,
  normalizeSiteUrl,
} from '../src/config/seo.js';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDirectory = resolve(projectRoot, 'dist');
const baseHtmlPath = resolve(distDirectory, 'index.html');
const env = loadEnv('production', projectRoot, '');

function withHttps(value) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

const siteUrl = normalizeSiteUrl(
  process.env.VITE_SITE_URL
  || env.VITE_SITE_URL
  || withHttps(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  || process.env.RENDER_EXTERNAL_URL
  || DEFAULT_PUBLIC_SITE_URL,
);

const verification = String(
  process.env.VITE_GOOGLE_SITE_VERIFICATION || env.VITE_GOOGLE_SITE_VERIFICATION || '',
).trim();

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function replaceRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Prérendu SEO impossible : ${label} introuvable dans index.html.`);
  return html.replace(pattern, replacement);
}

function renderStaticContent(seo) {
  const highlights = seo.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const links = seo.links.map(({ label, to }) => `<a href="${escapeHtml(to)}">${escapeHtml(label)}</a>`).join('');
  const faq = seo.faqs?.length
    ? `<section aria-labelledby="static-faq-title"><h2 id="static-faq-title">Questions fréquentes</h2>${seo.faqs.map(({ question, answer }) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join('')}</section>`
    : '';

  return `<main class="seo-static-fallback" data-prerendered-route="${escapeHtml(seo.path)}">
    <small>${escapeHtml(SITE_NAME)} · contenu public</small>
    <h1>${escapeHtml(seo.h1)}</h1>
    <p>${escapeHtml(seo.lead)}</p>
    <ul>${highlights}</ul>
    <nav aria-label="Pages principales">${links}</nav>
    ${faq}
  </main>`;
}

function renderPage(baseHtml, seo) {
  const canonical = absoluteUrl(siteUrl, seo.path);
  const socialImage = absoluteUrl(siteUrl, DEFAULT_SOCIAL_IMAGE);
  const structuredData = JSON.stringify(buildStructuredData(seo, siteUrl)).replaceAll('<', '\\u003c');
  let html = baseHtml;

  html = replaceRequired(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`, 'title');
  html = replaceRequired(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/i, `<meta name="description" content="${escapeHtml(seo.description)}" />`, 'meta description');
  html = replaceRequired(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`, 'canonical');
  html = replaceRequired(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`, 'og:title');
  html = replaceRequired(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`, 'og:description');
  html = replaceRequired(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`, 'og:url');
  html = replaceRequired(html, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/i, `<meta property="og:image" content="${escapeHtml(socialImage)}" />`, 'og:image');
  html = replaceRequired(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`, 'twitter:title');
  html = replaceRequired(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`, 'twitter:description');
  html = replaceRequired(html, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:image" content="${escapeHtml(socialImage)}" />`, 'twitter:image');
  html = replaceRequired(html, /<script\s+id="seo-structured-data"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, `<script id="seo-structured-data" type="application/ld+json">${structuredData}</script>`, 'JSON-LD');
  html = replaceRequired(html, /<!-- seo-static-start -->[\s\S]*?<!-- seo-static-end -->/i, `<!-- seo-static-start -->${renderStaticContent(seo)}<!-- seo-static-end -->`, 'contenu statique');

  if (verification) {
    html = html.replace('</head>', `    <meta name="google-site-verification" content="${escapeHtml(verification)}" />\n  </head>`);
  }

  return html;
}

function renderNotFoundPage(baseHtml) {
  const title = `Page introuvable | ${SITE_NAME}`;
  const description = 'Cette page est introuvable. Retrouvez les solutions QCM et soft skills de Check Performance.';
  let html = baseHtml;

  html = replaceRequired(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`, 'title 404');
  html = replaceRequired(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/i, `<meta name="description" content="${escapeHtml(description)}" />`, 'meta description 404');
  html = replaceRequired(html, /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/i, '<meta name="robots" content="noindex, nofollow, noarchive" />', 'meta robots 404');
  html = replaceRequired(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`, 'og:title 404');
  html = replaceRequired(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`, 'og:description 404');
  html = replaceRequired(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`, 'twitter:title 404');
  html = replaceRequired(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`, 'twitter:description 404');
  html = html.replace(/\s*<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/i, '');
  html = html.replace(/\s*<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/i, '');
  html = html.replace(/\s*<script\s+id="seo-structured-data"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, '');
  html = replaceRequired(
    html,
    /<!-- seo-static-start -->[\s\S]*?<!-- seo-static-end -->/i,
    `<!-- seo-static-start --><main class="seo-static-fallback"><small>Erreur 404</small><h1>Cette page est introuvable.</h1><p>${escapeHtml(description)}</p><nav aria-label="Retour"><a href="/">Retour à l’accueil</a><a href="/qcm-en-ligne">Découvrir les QCM en ligne</a></nav></main><!-- seo-static-end -->`,
    'contenu statique 404',
  );

  return html;
}

function pageFile(pathname) {
  return pathname === '/' ? 'index.html' : `${pathname.slice(1).replaceAll('/', '-')}.html`;
}

function renderSitemap() {
  const urls = INDEXABLE_PATHS.map((pathname) => {
    const seo = getSeoRoute(pathname);
    return `  <url>\n    <loc>${escapeHtml(absoluteUrl(siteUrl, pathname))}</loc>\n    <changefreq>${seo.changefreq}</changefreq>\n    <priority>${seo.priority}</priority>\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${absoluteUrl(siteUrl, '/sitemap.xml')}
`;
}

await mkdir(distDirectory, { recursive: true });
const baseHtml = await readFile(baseHtmlPath, 'utf8');

for (const pathname of INDEXABLE_PATHS) {
  const seo = getSeoRoute(pathname);
  const output = renderPage(baseHtml, seo);
  await writeFile(resolve(distDirectory, pageFile(pathname)), output, 'utf8');
}

await writeFile(resolve(distDirectory, '404.html'), renderNotFoundPage(baseHtml), 'utf8');
await writeFile(resolve(distDirectory, 'sitemap.xml'), renderSitemap(), 'utf8');
await writeFile(resolve(distDirectory, 'robots.txt'), renderRobots(), 'utf8');

console.log(`SEO : ${INDEXABLE_PATHS.length} pages prérendues pour ${siteUrl}`);
