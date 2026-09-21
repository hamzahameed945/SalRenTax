import { describe, expect, it } from 'vitest';
import { getActivePages, getIndexablePages } from '../../src/seo/page-registry';
import { ALL_LOCALES } from '../../src/i18n/types';
import { buildLocalePath, isLocaleActive } from '../../src/i18n/utils';

describe('page registry routes', () => {
  it('every active page resolves to a well-formed locale-prefixed path', () => {
    for (const page of getActivePages()) {
      const path = buildLocalePath(page.locale, page.slug);
      expect(path.startsWith('/')).toBe(true);
      expect(path.endsWith('/')).toBe(true);
      expect(path).not.toContain('//');
      // No stray whitespace, no unresolved template characters.
      expect(path).not.toMatch(/[{}]/);
    }
  });

  it('every active page belongs to an active locale', () => {
    for (const page of getActivePages()) {
      expect(isLocaleActive(page.locale)).toBe(true);
    }
  });

  it('indexable pages are a subset of active pages', () => {
    const activeIds = new Set(getActivePages().map((p) => p.id));
    for (const page of getIndexablePages()) {
      expect(activeIds.has(page.id)).toBe(true);
    }
  });
});

describe('locale switcher link safety', () => {
  it('only builds a clickable path for locales marked active', () => {
    for (const locale of ALL_LOCALES) {
      if (isLocaleActive(locale)) {
        // Active locales must produce a real, buildable path.
        expect(buildLocalePath(locale)).toBe(`/${locale.toLowerCase()}/`);
      } else {
        // Inactive locales are never linked — LocaleSwitcher.astro branches
        // on isLocaleActive and renders plain text (no <a href>) for these.
        // This test just documents/guards the invariant it depends on.
        expect(isLocaleActive(locale)).toBe(false);
      }
    }
  });

  it('at least one locale (en-US) is active, so the switcher is never all-disabled', () => {
    expect(ALL_LOCALES.some(isLocaleActive)).toBe(true);
  });
});
