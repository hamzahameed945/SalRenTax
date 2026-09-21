import { describe, expect, it } from 'vitest';
import { buildHreflangLinks } from '../../src/lib/seo/hreflang';

describe('buildHreflangLinks', () => {
  it('returns an empty array when the page has no equivalence group', () => {
    expect(buildHreflangLinks(undefined)).toEqual([]);
  });

  it('returns an empty array for an unknown group', () => {
    expect(buildHreflangLinks('nonexistent-group')).toEqual([]);
  });

  it('includes the active English paycheck equivalents', () => {
    const links = buildHreflangLinks('paycheck-calculator');
    const localeEntries = links.filter((l) => l.hreflang !== 'x-default');
    expect(localeEntries.map((l) => l.hreflang).sort()).toEqual(['en-gb','en-ie','en-us']);
    const xDefault = links.find((l) => l.hreflang === 'x-default');
    expect(xDefault?.href).toBe(localeEntries[0].href);
  });

  it('does not include unrelated locales in the paycheck group', () => {
    const tags = buildHreflangLinks('paycheck-calculator').map((l) => l.hreflang);
    expect(tags).not.toContain('pt-br');
    expect(tags).not.toContain('de-de');
  });

});
