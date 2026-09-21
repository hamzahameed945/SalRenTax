# Decisions

A short log of the important architectural decisions behind PayRenTax and why they were made.

## Locale-first, not translation-first routing

URLs are `/`, `/{locale}/`, `/{locale}/{category}/`, `/{locale}/{slug}/`, where `{locale}` is a lowercased locale code such as `en-us`; the canonical locale type is `en-US`. Countries that share a language keep separate tax logic, currency, terminology and content.

## The page registry is the single source of truth

`src/seo/page-registry.ts` lists the page inventory with statuses `active | draft | planned | coming-soon | disabled`. Only active pages are eligible for publishing, internal linking, sitemap inclusion and hreflang.

The repository does not hard-code a production page count. Route presence is checked against the registry and the real build output is the final authority.

## Active locale policy

The initial eight locales are currently marked active in `LOCALE_STATUS`: `en-US`, `en-GB`, `en-IE`, `pt-BR`, `es-ES`, `es-MX`, `de-DE`, and `nl-NL`. Each active locale has a `LocaleConfig` and dictionary. A new specialized calculator remains planned until its source data and UI are actually implemented.

## Country-specific calculation engines

`src/calculators/core/` contains country-agnostic math only. Country-specific payroll/tax rules live under `src/calculators/*/engines/`. A calculator must not silently branch into another country's legal/tax rules.

## No fabricated financial data

Financial data files require a primary source and a verification note. See [DATA-SOURCES.md](DATA-SOURCES.md). When a reliable table is not yet available, the keyword stays `planned` rather than publishing a fabricated result.

## No fake hreflang

`src/lib/seo/hreflang.ts` only emits alternate links when active/indexable pages explicitly share the same `equivalentPageGroup`. Separate country tax/salary concepts use separate groups, so similar slugs across countries are not automatically treated as translations of one another.

## Static-first deployment

`astro.config.mjs` uses `output: 'static'`. The browser runs calculator logic through Preact islands and pure TypeScript engines. This keeps the project deployable as static assets; Cloudflare Workers Assets via Wrangler serves the generated `dist/` directory.

## Package reproducibility

The repository pins Node and pnpm versions (`.nvmrc`, `.node-version`, and `packageManager`) and commits `pnpm-lock.yaml`. Production/CI installation must use `pnpm install --frozen-lockfile`.

## Privacy-first calculator inputs

Calculator inputs stay in the browser. There is no server-side calculator API, database, authentication system or stored salary input.
