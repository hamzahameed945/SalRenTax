/**
 * Structured data builders. Every function here returns a plain object
 * that must be JSON.stringify'd by the caller — no HTML/script tags are
 * built here, so there's no way to leave a <script> tag half-escaped.
 *
 * Rule: FAQPage JSON-LD must only be emitted when the exact same
 * questions/answers are visibly rendered on the page (Section 7 / Step 7).
 * Callers are responsible for passing the same data used for rendering.
 */

export interface JsonLdWebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
}

export function buildWebSiteJsonLd(name: string, url: string): JsonLdWebSite {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name, url };
}

export interface JsonLdWebPage {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  inLanguage: string;
}

export function buildWebPageJsonLd(params: {
  name: string;
  description: string;
  url: string;
  inLanguage: string;
}): JsonLdWebPage {
  return { '@context': 'https://schema.org', '@type': 'WebPage', ...params };
}

export interface JsonLdBreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface JsonLdBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: JsonLdBreadcrumbItem[];
}

/** crumbs must be in display order, starting with Home. */
export function buildBreadcrumbJsonLd(
  crumbs: { label: string; url: string }[],
): JsonLdBreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: crumb.url,
    })),
  };
}

export interface JsonLdFaqAnswer {
  '@type': 'Answer';
  text: string;
}

export interface JsonLdFaqQuestion {
  '@type': 'Question';
  name: string;
  acceptedAnswer: JsonLdFaqAnswer;
}

export interface JsonLdFaqPage {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: JsonLdFaqQuestion[];
}

/**
 * items must be the exact same question/answer pairs rendered visibly on
 * the page — never a superset added only for SEO.
 */
export function buildFaqJsonLd(
  items: { question: string; answer: string }[],
): JsonLdFaqPage | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export interface JsonLdOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
}

/**
 * Site-level entity node (GEO/AEO): gives search engines and AI assistants
 * one unambiguous organisation identity for the whole domain. Emitted once
 * per page from BaseLayout alongside the WebSite node.
 */
export function buildOrganizationJsonLd(params: {
  name: string;
  url: string;
  logo: string;
}): JsonLdOrganization {
  return { '@context': 'https://schema.org', '@type': 'Organization', ...params };
}
