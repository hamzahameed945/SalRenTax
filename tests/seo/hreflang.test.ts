import { describe, expect, it } from 'vitest';
import { buildHreflangLinks } from '../../src/lib/seo/hreflang';

describe('buildHreflangLinks', () => {
  it('returns an empty array when the page has no equivalence group', () => {
    expect(buildHreflangLinks(undefined)).toEqual([]);
  });

  it('returns an empty array for an unknown group', () => {
    expect(buildHreflangLinks('nonexistent-group')).toEqual([]);
  });

  it('self-references the only active locale for the paycheck-calculator group', () => {
    const links = buildHreflangLinks('paycheck-calculator');
    // Only en-US is active, so we expect exactly one locale entry + x-default,
    // both pointing at the same URL. No en-GB/pt-BR/etc. entries should appear
    // even though the spec's target locale list includes them.
    const localeEntries = links.filter((l) => l.hreflang !== 'x-default');
    expect(localeEntries).toHaveLength(1);
    expect(localeEntries[0].hreflang).toBe('en-us');
    const xDefault = links.find((l) => l.hreflang === 'x-default');
    expect(xDefault?.href).toBe(localeEntries[0].href);
  });

  it('never includes a planned/coming-soon locale', () => {
    const links = buildHreflangLinks('paycheck-calculator');
    const tags = links.map((l) => l.hreflang);
    expect(tags).not.toContain('en-gb');
    expect(tags).not.toContain('pt-br');
    expect(tags).not.toContain('de-de');
  });

  it('excludes a group whose only member is a planned (not active) page', () => {
    // hourly-wage-calculator is registered as "planned" in the page registry,
    // so it must never produce a hreflang link.
    expect(buildHreflangLinks('hourly-wage-calculator')).toEqual([]);
  });
});
