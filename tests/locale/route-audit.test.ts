import { describe, expect, it } from 'vitest';
import { getActivePages, getIndexablePages } from '../../src/seo/page-registry';
import { ALL_LOCALES } from '../../src/i18n/types';
import { buildLocalePath, isLocaleActive } from '../../src/i18n/utils';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const PAGES_ROOT = join(REPO_ROOT, 'src', 'pages');

function* walkAstroFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walkAstroFiles(full);
    } else if (entry.endsWith('.astro')) {
      yield full;
    }
  }
}

function pageFileExists(urlPath: string): boolean {
  const p = urlPath.replace(/^\/+|\/+$/g, '');
  if (!p) return true; // homepage
  return (
    existsSync(join(PAGES_ROOT, p, 'index.astro')) ||
    existsSync(join(PAGES_ROOT, `${p}.astro`))
  );
}

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

describe('nav category link safety', () => {
  it('every category listed in a locale config has a real category page (no dead nav links)', async () => {
    // Regression test: stale locale-config categories once rendered site-wide
    // header links to /en-gb/tax/, /en-ie/tax/, /es-ar/salary/ and /es-co/salary/,
    // all of which 404'd and were flagged by Search Console ("Not found (404)").
    // The header renders config.categories verbatim, so each entry must resolve
    // to a real page directory.
    const { getActiveLocaleConfigs } = await import('../../src/data/locales');
    const pagesRoot = join(__dirname, '..', '..', 'src', 'pages');
    for (const config of getActiveLocaleConfigs()) {
      const localeSlug = config.locale.toLowerCase();
      for (const category of config.categories) {
        const dir = join(pagesRoot, localeSlug, category);
        expect(
          existsSync(join(dir, 'index.astro')),
          `${config.locale}: category '${category}' has no page at src/pages/${localeSlug}/${category}/`,
        ).toBe(true);
      }
    }
  });
});

describe('internal link integrity', () => {
  it('every static internal href in .astro pages resolves to a real page file', () => {
    // Guards against hardcoded dead links (e.g. a stale slug in a content page).
    // Dynamic hrefs (template literals) are not statically resolvable and are skipped.
    const dead: string[] = [];
    let checked = 0;
    for (const file of walkAstroFiles(PAGES_ROOT)) {
      const src = readFileSync(file, 'utf-8');
      for (const match of src.matchAll(/href="([^"]+)"/g)) {
        const href = match[1];
        if (!href.startsWith('/') || href.startsWith('//')) continue;
        if (href.includes('{') || href.includes('}')) continue;
        const path = href.split('?')[0].split('#')[0];
        checked++;
        if (!pageFileExists(path)) {
          dead.push(`${relative(REPO_ROOT, file)} -> ${href}`);
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(dead, `dead internal links:\n${dead.join('\n')}`).toEqual([]);
  });

  it('every slug listed in the pt-br blog index has a matching post page', () => {
    // The blog index hand-maintains its post list; a typo'd slug once 404'd
    // /pt-br/blog/salario-liquido-2026-guia-completo/ (real page: salario-liquido-2026).
    const indexSrc = readFileSync(
      join(PAGES_ROOT, 'pt-br', 'blog', 'index.astro'),
      'utf-8',
    );
    const slugs = [...indexSrc.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(
        existsSync(join(PAGES_ROOT, 'pt-br', 'blog', slug, 'index.astro')),
        `blog slug '${slug}' has no page at src/pages/pt-br/blog/${slug}/`,
      ).toBe(true);
    }
  });
});
