# Decisions

A short log of the important architectural decisions behind SalRenTax and
why they were made. Update this file when a decision changes.

## Locale-first, not translation-first routing

URLs are `/`, `/{locale}/`, `/{locale}/{category}/`, `/{locale}/{slug}/`,
where `{locale}` is a full locale code like `en-us` (lowercased in URLs,
canonical `LocaleCode` is `en-US`). Two countries sharing a language
(e.g. `en-US`/`en-GB`) never share tax logic, currency, or content — each
locale has its own `LocaleConfig`, translation dictionary, and (where
applicable) country-specific calculation engine.

## The page registry is the single source of truth for generated pages

`src/seo/page-registry.ts` lists every page the platform _could_ have,
each with a `status` of `active | draft | planned | coming-soon | disabled`.
Only `active` entries are built, linked internally, sitemapped, or
eligible for hreflang. This is enforced by the registry's own helper
functions (`getActivePages`, `getIndexablePages`, `findEquivalentPages`)
rather than by convention — page files query the registry instead of
hard-coding their own lists of calculators/pages.

**Consequence:** the number of live pages is never hard-coded anywhere.
It's whatever `getActivePages().length` returns, verified against actual
build output (`pnpm build`'s "N page(s) built" line and the generated
`dist/` tree) rather than asserted in prose.

## en-US is the first (and currently only) active locale

Chosen as the architecture-proof locale because it has the most available
official data and the most search volume for a first pass. All 7 other
target locales (`en-GB`, `en-IE`, `pt-BR`, `es-ES`, `es-MX`, `de-DE`,
`nl-NL`) are typed in `LOCALE_STATUS` with status `coming-soon` so the
roadmap is visible in code, but:

- No page files exist for them.
- No `LocaleConfig` or translation dictionary exists for them —
  `getLocaleConfig`/`getDictionary` throw rather than silently falling
  back to en-US data or English text.
- The locale switcher renders them as plain (non-clickable) text with a
  "coming soon" label, never as a link.

## Country-specific calculation engines, not one universal formula

`src/calculators/core/` holds only country-agnostic math (e.g.
`calculateProgressiveTax`, which knows nothing about the US, brackets
being "federal," or any country's rules). `src/calculators/salary/engines/usPaycheck.ts`
is the US-specific adapter that supplies US bracket data, US FICA rules,
and US-specific inputs (filing status, pay frequency) to that shared math.
A future UK engine would be a new, separate adapter file — never a branch
inside the US engine.

## No fabricated tax/labor data, ever

Every financial data file must cite a primary source (`DataSource` object

- `SOURCE`/`YEAR`/`VERIFY` code comments) or the calculator using it stays
  disabled. See [DATA-SOURCES.md](DATA-SOURCES.md) for the current citations
  and for what's deliberately left unimplemented (e.g. head-of-household
  filing status) because it wasn't independently verified this session.

## No fake hreflang

`src/lib/seo/hreflang.ts` only emits `<link rel="alternate" hreflang>`
tags for pages that share a registry `equivalentPageGroup` _and_ are both
active and indexable. With only en-US active, this currently produces a
self-referencing `en-us` + `x-default` link and nothing else — verified by
`tests/seo/hreflang.test.ts`, which explicitly asserts that no
`en-gb`/`pt-br`/`de-de`/etc. link is ever produced today.

## No hard-coded page count

Nowhere in the app, tests, or docs is "N pages" asserted as a magic
number. Counts are always derived from `getActivePages()` /
`getIndexablePages()` at build/runtime, or read off actual `pnpm build`
output when reporting status.

## Static-first architecture

`output: 'static'` in `astro.config.mjs`. No server-side calculator
computation, no database, no auth, no CMS, no background jobs — all
calculators run client-side in the browser (Preact islands hydrate a pure
TypeScript engine). This keeps the platform deployable to any static host
(Cloudflare Pages, Netlify, Vercel static, etc.) with no backend to
operate.

## Privacy-first approach

Calculator inputs (salary, filing status, etc.) never leave the browser —
there is no API call, no server-side computation, and no analytics wired
in beyond placeholder ad slots (which are inert `<div>`s with no third-party
script, not real ad code). No login, no accounts, no stored user data.

## Sitemap uses an explicit, documented placeholder domain

`PUBLIC_SITE_URL` drives both the sitemap's `site` URL and canonical/
Open Graph/JSON-LD URLs (`src/lib/seo/site.ts`). If unset, it resolves to
`https://example.com` rather than a guessed real domain, so a
misconfigured build can never silently claim a production URL that was
never actually supplied. See README.md for how to set it.
