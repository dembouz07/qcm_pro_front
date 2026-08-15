import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  absoluteUrl,
  buildStructuredData,
  getSeoRoute,
  normalizeSiteUrl,
} from '../config/seo.js';

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}
function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function remove(selector) {
  document.head.querySelector(selector)?.remove();
}

function configuredSiteUrl() {
  const fromEnvironment = import.meta.env.VITE_SITE_URL?.trim();
  return normalizeSiteUrl(fromEnvironment || window.location.origin);
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getSeoRoute(pathname);
    const siteUrl = configuredSiteUrl();
    const canonical = seo.indexable ? absoluteUrl(siteUrl, seo.path) : null;
    const socialImage = absoluteUrl(siteUrl, DEFAULT_SOCIAL_IMAGE);

    document.documentElement.lang = 'fr';
    document.title = seo.title;
    upsertMeta('meta[name="description"]', { name: 'description', content: seo.description });
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: seo.indexable
        ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'noindex, nofollow, noarchive',
    });

    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'fr_FR' });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: socialImage });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImage });

    if (canonical) {
      upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });
      upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    } else {
      remove('link[rel="canonical"]');
      remove('meta[property="og:url"]');
    }

    const verification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
    if (verification) {
      upsertMeta('meta[name="google-site-verification"]', {
        name: 'google-site-verification',
        content: verification,
      });
    }

    const structuredData = buildStructuredData(seo, siteUrl);
    let script = document.head.querySelector('#seo-structured-data');
    if (structuredData) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'seo-structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData).replace(/</g, '\\u003c');
    } else {
      script?.remove();
    }
  }, [pathname]);

  return null;
}
