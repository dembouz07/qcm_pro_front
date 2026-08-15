import { beforeEach, describe, expect, it } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SeoManager from './SeoManager.jsx';

const MANAGED_SELECTORS = [
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'link[rel="canonical"]',
  '#seo-structured-data',
];

beforeEach(() => {
  document.title = '';
  document.head.querySelectorAll(MANAGED_SELECTORS.join(',')).forEach((element) => element.remove());
});
describe('SeoManager', () => {
  it('publie les métadonnées et le JSON-LD propres à une page publique', async () => {
    render(<MemoryRouter initialEntries={['/qcm-en-ligne']}><SeoManager /></MemoryRouter>);

    await waitFor(() => expect(document.title).toContain('Logiciel de QCM en ligne'));
    expect(document.head.querySelector('meta[name="robots"]')?.content).toContain('index, follow');
    expect(document.head.querySelector('link[rel="canonical"]')?.href).toMatch(/\/qcm-en-ligne$/);
    expect(document.head.querySelector('meta[property="og:title"]')?.content).toBe(document.title);

    const structuredData = JSON.parse(document.querySelector('#seo-structured-data').textContent);
    expect(structuredData['@graph'].some((item) => item['@type'] === 'FAQPage')).toBe(true);
  });

  it('retire la canonical et pose noindex sur une route privée', async () => {
    render(<MemoryRouter initialEntries={['/admin']}><SeoManager /></MemoryRouter>);

    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')?.content).toContain('noindex'));
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('#seo-structured-data')).toBeNull();
  });
});
