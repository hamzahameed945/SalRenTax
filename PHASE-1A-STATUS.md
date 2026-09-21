# Verification and Release Status

## Current release

The project has moved beyond the original US-only proof-of-concept. The current tree contains active routes for the eight configured locales and country-specific calculator engines where data is available.

### Implemented in this release

- US salary calculators and state paycheck routes for Florida, Texas, Arizona, New York and Illinois.
- UK, Ireland, Germany, Spain, Mexico, Brazil and Netherlands locale routes already present in the source tree.
- New salary/labor keyword coverage for annual salary, paystub, Illinois paycheck, Germany part-time/minijob/hourly/Bayern/NRW, Spain dismissal, Mexico liquidation and gross/net salary, Brazil net salary/vacation/overtime.
- Shared Preact islands for the previously duplicated Spain/Mexico/Brazil labor calculators.
- State-specific US engine selection instead of silently using federal-only logic for state pages.
- Corrected Spain finiquito severance caps and Mexico proportional aguinaldo / unjustified-dismissal calculations.
- SEO robots.txt, Open Graph/Twitter image metadata, and corrected DE/NL hreflang grouping.
- Fresh `DATA-SOURCES.md` and `KEYWORD-COVERAGE.md` documentation.
- Pinned Node/pnpm versions and Cloudflare Wrangler static deployment instructions.

## Verification completed in the available environment

- Direct package-to-lockfile dependency comparison: clean.
- Relative-import scan: no missing local imports found.
- Active-registry route existence scan: clean for the checked routes.
- Pure TypeScript calculator-engine typecheck: clean with a modern ES2022 target.
- TypeScript/TSX source syntax pass: 180 files; Astro frontmatter syntax pass: 71 files.
- Runtime smoke checks passed for Brazil net salary/vacation/overtime and German part-time/minijob engines.
- Generated Open Graph image: valid 1200x630 RGB PNG.
- No stray nested source copy / dump files remain.

## Environment limitation

The supplied execution environment does not have the repository's pnpm binary or installed npm dependencies, and outbound package-registry DNS is unavailable. Therefore the final `pnpm install --frozen-lockfile`, `pnpm test`, `astro check`, `pnpm run lint`, `pnpm run format`, and `pnpm run build` could not be executed here. The repository is prepared for those commands on Node 22.16.0 + pnpm 10.16.1, with `pnpm-lock.yaml` kept in sync.

## CI fix log

- `tests/calculators/usPaycheck.test.ts`: the "rejects unsupported states" test used `NY`, but New York is a supported state (`nyStateEngine`, `usStates.test.ts`, and a dedicated page). The test now uses `CA` (not modeled) and a new `it.each` asserts TX/IL/AZ/NY/FL are accepted.
- Island components (`HourlyToSalary`, `PayFrequencyConverter`, `SalaryRaise`, `SalaryToHourly`) typed `t` as `any`, which fails `@typescript-eslint/no-explicit-any`. They now use `ErrorTranslations` from `src/components/islands/types.ts`.

## Release checklist

```text
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run lint
pnpm run format
pnpm run build
pnpm run deploy
```

For Cloudflare Git builds, use Node 22.16.0, pnpm 10.16.1 and set `PUBLIC_SITE_URL` to the production origin.
