# Phase 1A Status

Last updated during this session's verification pass.

## What was already built (prior session)

- Astro 7 static project, TypeScript strict, Preact, Tailwind CSS v4, Vitest, pnpm
- Locale type system (`LocaleCode`, `LocaleConfig`, `PageDefinition`) with
  `en-US` active and the other 7 roadmap locales typed but inactive
- Data-driven page registry (`src/seo/page-registry.ts`)
- Pure calculation engine layer: `calculateProgressiveTax` (shared) +
  `usPaycheckEngine` (US-specific adapter)
- 2026 US federal tax bracket + standard deduction data (IRS) and FICA
  data (SSA), each with source metadata
- Full `en-US` i18n dictionary
- BaseLayout, Header, Footer, Breadcrumbs, LocaleSwitcher, ad-slot
  placeholders
- 5 pages: global home, en-US home, salary category, paycheck calculator,
  404
- FAQ + disclaimers on the calculator page
- 20 unit tests (progressive tax math, paycheck engine, locale utils)

## What this session verified, fixed, and added

### Verification

- Ran `pnpm install` — already up to date.
- Ran `pnpm test` — passed.
- Ran `pnpm exec astro check` — **initially failed to run** because the
  auto-installed `typescript` was v7 (native-compiler preview), which
  `astro check` doesn't yet support. Fixed by pinning `typescript@^5.9`
  as an explicit devDependency. After that fix, `astro check` ran and
  found 3 real type errors (see below).
- Ran `pnpm build` — passed throughout (esbuild's type stripping doesn't
  catch what `astro check`'s full type-checker does, which is exactly why
  both commands matter).
- Set up `pnpm lint` (ESLint flat config with `eslint-plugin-astro` +
  `@typescript-eslint`, plus Prettier) — this repo had no lint command
  configured before this session. Ran clean on first pass.

### Real issues found and fixed

1. **`astro check` TypeScript errors (3, now 0):** `JsonLd.astro`'s
   `Props.entries` was typed as `Record<string, unknown>[]`, which the
   specific `JsonLdWebSite`/`JsonLdWebPage`/`JsonLdFaqPage` interfaces
   (each with typed, non-index-signature fields) don't structurally
   satisfy. Fixed by widening the prop type to `object[]` — JSON-LD
   objects are only ever passed to `JSON.stringify`, so there's no need
   for the narrower `Record` type. Re-ran `astro check`: 0 errors.
2. **`astro check` hint:** `CalculatorFAQ.astro` had an unused `i` index
   parameter in a `.map()` — removed. `JsonLd.astro`'s inline `<script>`
   triggered Astro's "will be treated as `is:inline`" hint — added the
   `is:inline` directive explicitly. Both fixed: 0 hints.
3. **`astro exec astro check` hanging:** the bare `pnpm exec astro check`
   command (before `@astrojs/check`/`typescript` were explicit
   devDependencies) hung past the 300s tool timeout, apparently waiting
   on an interactive install prompt. Fixed by installing
   `@astrojs/check` and `typescript` explicitly instead of relying on
   Astro's auto-install-on-demand path.

### Features added this session

- **Locale/page status model:** extended `PageStatus` and added
  `LocaleStatus` to include `coming-soon` and `disabled` (previously only
  `active | draft | planned`), and replaced the hand-maintained
  `ACTIVE_LOCALES` array with a `LOCALE_STATUS: Record<LocaleCode, LocaleStatus>`
  map that `isLocaleActive`/`ACTIVE_LOCALES` now derive from. The locale
  switcher now shows each inactive locale's actual status
  ("coming soon") instead of a generic disabled state.
- **Sitemap:** added `@astrojs/sitemap`, configured with a `PUBLIC_SITE_URL`
  env var (`src/lib/seo/site.ts`, falls back to `https://example.com` — a
  deliberate placeholder, never a guessed real domain) and a filter that
  excludes `/404`. Confirmed via build output: `dist/sitemap-0.xml`
  contains exactly the 4 active, indexable pages
  (`/`, `/en-us/`, `/en-us/salary/`, `/en-us/salary/paycheck-calculator/`)
  and nothing else.
- **JSON-LD:** added `src/lib/seo/structuredData.ts` (`WebSite`,
  `WebPage`, `BreadcrumbList`, `FAQPage` builders) and a `JsonLd.astro`
  renderer. `WebSite`+`WebPage` render on every page via `BaseLayout`;
  `BreadcrumbList` renders from the exact same crumbs `Breadcrumbs.astro`
  displays; `FAQPage` on the paycheck page is built from the exact same
  `faqItems` array rendered visibly by `CalculatorFAQ` — never a superset
  added only for SEO.
- **Hreflang:** added `src/lib/seo/hreflang.ts`, which only emits
  `<link rel="alternate" hreflang>` for pages sharing a registry
  `equivalentPageGroup` that are both active and indexable. With only
  en-US active, this currently emits a self-referencing `en-us` +
  `x-default` pair and nothing else.
- **Tests:** added 19 new tests (`resolveSiteUrl`, JSON-LD builders,
  hreflang safety — explicitly asserting no `en-gb`/`pt-br`/`de-de` link
  is ever produced — and a route/link audit verifying every active page
  resolves to a well-formed path under an active locale).

## Exact command results (this session, final run)

```
$ pnpm install
Already up to date. Done in 116ms using pnpm v12.4.2

$ pnpm test
 Test Files  7 passed (7)
      Tests  39 passed (39)

$ pnpm exec astro check
Result (57 files):
- 0 errors
- 0 warnings
- 0 hints

$ pnpm build
generating static routes
  ├─ /404.html
  ├─ /en-us/salary/paycheck-calculator/index.html
  ├─ /en-us/salary/index.html
  ├─ /en-us/index.html
  ├─ /index.html
[@astrojs/sitemap] sitemap-index.xml created at dist
5 page(s) built in ~3s
build Complete!

$ pnpm lint
$ eslint .
(clean — no output, exit 0)
```

**Vitest: PASS — 39/39 tests**
**Astro check: PASS — 0 errors, 0 warnings, 0 hints**
**Build: PASS — 5 pages generated, sitemap generated**
**Lint: PASS — clean**

## Remaining work (explicitly not done — not claimed as complete)

- Manual/tool-driven accessibility audit beyond the structural basics
  already in place (skip link, labeled form fields, `aria-live` on the
  result region, `aria-invalid`/`aria-describedby` on the validated
  field, keyboard-operable native `<details>` FAQ, visible focus via
  Tailwind defaults). No axe-core or Lighthouse run was performed this
  session.
- No automated broken-link crawler was run against the built `dist/`
  output; the route/link audit in this session is a unit-test-level
  check against the page registry and locale-switcher logic, not a live
  HTTP crawl.
- No catch-all route (`[...slug].astro`) — explicit page files are used
  instead, which is fine at 4 pages but should be revisited once page
  count grows.
- No CI configuration (GitHub Actions, etc.) wiring these commands
  together automatically.
- No other locale has any data, content, or pages.
- No rent, tax-category, or labor calculators exist yet — only the US
  paycheck calculator.
