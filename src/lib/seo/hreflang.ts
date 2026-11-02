import { getIndexablePages, findEquivalentPages } from '../../seo/page-registry';
import { buildLocalePath } from '../../i18n/utils';
import { buildCanonical } from './metadata';
import { ACTIVE_LOCALES } from '../../i18n/types';

export interface HreflangLink {
  hreflang: string;
  href: string;
}

/** Maps a LocaleCode like "en-US" to its IETF hreflang tag ("en-us"). Astro's own locale codes already match this format. */
function toHreflangTag(locale: string): string {
  return locale.toLowerCase();
}

/**
 * Builds hreflang alternate links for a page's equivalence group. Only
 * pages that are both (a) in the same equivalentPageGroup and (b) active +
 * indexable are included — planned/coming-soon/disabled locales never
 * appear here, so there is no fake cross-locale link. Each active member
 * may only be paired with another page when the registry explicitly declares
 * the same equivalentPageGroup.
 */
export function buildHreflangLinks(equivalentPageGroup: string | undefined): HreflangLink[] {
  if (!equivalentPageGroup) return [];
  const indexableIds = new Set(getIndexablePages().map((p) => p.id));
  const members = findEquivalentPages(equivalentPageGroup).filter((p) => indexableIds.has(p.id));
  if (members.length === 0) return [];

  const links: HreflangLink[] = members.map((page) => ({
    hreflang: toHreflangTag(page.locale),
    href: buildCanonical(buildLocalePath(page.locale, page.slug)),
  }));

  // x-default points at the first active member in registry order.
  links.push({ hreflang: 'x-default', href: links[0].href });

  return links;
}

/**
 * Hreflang alternates for locale homepages (canonical path like /en-us/).
 * Returns one alternate per active locale plus x-default pointing at the
 * language-selector root homepage. Returns an empty array for any other path.
 */
export function buildLocaleHomepageHreflangLinks(canonicalPathname: string): HreflangLink[] {
  if (!/^\/[a-z]{2}-[a-z]{2}\/$/.test(canonicalPathname)) return [];
  const links: HreflangLink[] = ACTIVE_LOCALES.map((loc) => ({
    hreflang: loc.toLowerCase(),
    href: buildCanonical(buildLocalePath(loc)),
  }));
  links.push({ hreflang: 'x-default', href: buildCanonical('/') });
  return links;
}
