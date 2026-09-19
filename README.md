# SalRenTax

A multilingual salary, tax, rent and labor calculator platform built with Astro, TypeScript, Preact and Tailwind CSS. The site is static-first and deploys to Cloudflare using Wrangler Workers Assets.

## Locale coverage

The current release has active locale configuration and published routes for:

- `en-US`
- `en-GB`
- `en-IE`
- `pt-BR`
- `es-ES`
- `es-MX`
- `de-DE`
- `nl-NL`

Each locale has its own currency, formatting, content dictionary and country-specific calculator engines where applicable. No calculator silently reuses another country's tax rules.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Astro 7 (static output) |
| Language | TypeScript (strict mode) |
| Islands | Preact |
| Styling | Tailwind CSS v4 |
| Testing | Vitest |
| Linting | ESLint 9 + eslint-plugin-astro + TypeScript ESLint |
| Formatting | Prettier + prettier-plugin-astro |
| SEO | @astrojs/sitemap + custom metadata/JSON-LD/hreflang |
| Deployment | Wrangler 4 + Cloudflare Workers Assets |
| Package manager | pnpm 10.16.1 |

## Requirements

- Node.js `22.16.0` (see `.nvmrc` and `.node-version`)
- pnpm `10.16.1` (pinned by `packageManager` in `package.json`)

## Installation

```bash
corepack enable
corepack prepare pnpm@10.16.1 --activate
pnpm install --frozen-lockfile
```

Do not regenerate the lockfile with a different package-manager version in CI/CD.

## Verification commands

```bash
pnpm run check
pnpm test
pnpm run lint
pnpm run format
pnpm run build
```

For one command that verifies the production toolchain before deployment, run the commands above in this order.

## Environment

`PUBLIC_SITE_URL` controls the canonical URL, Open Graph URLs, JSON-LD URLs, sitemap and `robots.txt`.

Copy `.env.example` and set the production origin before building:

```bash
cp .env.example .env
# Example:
# PUBLIC_SITE_URL=https://your-domain.example
```

The fallback `https://example.com` is deliberately non-production so a forgotten setting cannot silently publish a fake production origin.

## Keyword coverage

The implementation and remaining keyword backlog are documented in [KEYWORD-COVERAGE.md](KEYWORD-COVERAGE.md). The current release adds dedicated pages for the high-intent salary/labor gaps that were explicitly identified in the supplied research, including US annual salary/paystub/Illinois, Germany hourly/part-time/minijob/Bayern/NRW, Spain dismissal, Mexico liquidation and gross/net salary, and Brazil net salary/vacation/overtime.

Germany TVöD/public-service salary tables remain `planned` until their source data is integrated; no thin or fabricated salary table is published just to capture a keyword. Tax/rent-only gaps from the research are deliberately left outside this salary-focused implementation.

## SEO and architecture fixes included

- `robots.txt` with the generated sitemap URL.
- Open Graph and Twitter image metadata with `public/og-default.png`.
- DE and NL have separate equivalent-page groups; unrelated country calculators are never linked by hreflang.
- The Spain/Mexico/Brazil labor pages use shared Preact calculator islands rather than duplicated inline JavaScript.
- US state paycheck pages select state engines instead of silently using federal-only logic.
- `DATA-SOURCES.md` documents current source coverage.
- Stray dump/nested duplicate files have been removed.

## Cloudflare deployment

The project uses Astro static output plus Wrangler Workers Assets. You do **not** need `@astrojs/cloudflare` for this architecture.

### Wrangler deploy

```bash
corepack enable
corepack prepare pnpm@10.16.1 --activate
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run lint
pnpm run format
pnpm run build
pnpm run deploy
```

`pnpm run deploy` runs `pnpm run build` and then `wrangler deploy`. `wrangler.jsonc` points Cloudflare at the generated `dist/` assets.

### Cloudflare Git build

Use:

- Node.js: `22.16.0`
- pnpm: `10.16.1`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm run build`
- Output directory: `dist`
- Environment variable: `PUBLIC_SITE_URL=https://your-production-domain.example`

The committed `pnpm-lock.yaml`, `.nvmrc`, `.node-version` and `packageManager` pin the versions needed by the project.

## Project structure

```text
src/
├── i18n/                       # locale/status/types and dictionaries
├── data/                       # locale configs and sourced tax/salary data
├── calculators/                # pure country-specific calculation engines
├── seo/                        # page registry / active page source of truth
├── lib/seo/                    # canonical, metadata, JSON-LD, hreflang
├── components/                 # Astro UI + Preact calculator islands
├── layouts/                    # BaseLayout.astro
└── pages/                      # explicit published routes
tests/                          # unit and registry/SEO coverage
```

## Limitations

Some calculators are intentionally simplified estimates rather than full payroll systems. Their page copy describes the supported inputs and limitations. For any new country or specialized salary system, source-backed data must be added before the registry entry is promoted from `planned` to `active`.

## Verification note

The provided build sandbox did not contain installed npm dependencies and had no outbound package-registry DNS, so the final `pnpm install --frozen-lockfile`, Astro check, Vitest, lint, Prettier and production build could not be executed inside that sandbox. Static dependency/lockfile consistency, local import resolution, registry route presence, generated assets, and the pure TypeScript engine layer were checked directly.

See [PHASE-1A-STATUS.md](PHASE-1A-STATUS.md) for the exact verification boundary and release checklist.
