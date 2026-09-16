# Data Sources

Every tax/payroll data file in this repo carries `SOURCE` / `YEAR` / `VERIFY`
comments and a `DataSource` object. This file is the human-readable index
of the same information, kept in one place for quick review.

## United States — 2026

### Federal income tax brackets

- **File:** `src/data/salary/us/federalTax2026.ts`
- **Authority:** Internal Revenue Service
- **Document:** IR-2025-103, "IRS releases tax inflation adjustments for
  tax year 2026, including amendments from the One, Big, Beautiful Bill,"
  citing Revenue Procedure 2025-32
- **URL:** https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill
- **Effective year:** 2026
- **Retrieved:** 2026-09-15 (via web search during this session)
- **Status:** verified — single and married-filing-jointly bracket
  thresholds and rates, and the standard deduction for both statuses, were
  read directly from the IRS notice.
- **What it supports:** Single and married-filing-jointly federal income
  tax, using the standard deduction only (no itemized deductions, no
  credits).
- **What it does NOT cover:**
  - **Head of household** filing status — the IRS notice gives the
    head-of-household standard deduction ($24,150) but this repo has not
    independently verified the full head-of-household bracket schedule,
    so head-of-household is intentionally left out of the calculator UI
    entirely (see the comment in `federalTax2026.ts` and the omission in
    `src/i18n/en-US/salary.ts`'s `filingStatuses`).
  - Itemized deductions, tax credits (child tax credit, EITC, etc.)
  - Alternative Minimum Tax
  - Self-employment tax

### FICA (Social Security + Medicare)

- **File:** `src/data/salary/us/federalTax2026.ts`
- **Authority:** Social Security Administration
- **Document:** Contribution and Benefit Base
- **URL:** https://www.ssa.gov/oact/cola/cbb.html
- **Effective year:** 2026
- **Retrieved:** 2026-09-15 (via web search during this session)
- **Status:** verified — Social Security wage base and both FICA rates
  (6.2% / 1.45%) read directly from the SSA page.
- **What it supports:** Social Security tax capped at the 2026 wage base;
  uncapped Medicare tax at the standard rate.
- **What it does NOT cover:**
  - **Additional Medicare Tax** (extra 0.9% on wages above $200,000
    single / $250,000 married filing jointly) — not yet implemented.
    Marked as a TODO in the data file. A calculator showing income above
    these thresholds will currently understate Medicare tax.

## Verification status legend

- **verified** — read directly from a primary/official source during this
  project, with the source cited above and in code comments.
- **needs-review** — not currently used in this repo; would be the status
  for any data added without a primary-source citation.
- **placeholder** — not currently used; reserved for explicitly fake
  values used only in tests, never rendered to users.

No `needs-review` or `placeholder` financial data exists in the active
codebase. If it ever needs to (e.g. to unblock UI work before a source is
confirmed), the calculator must remain disabled or show a visible
"data requires verification" warning, per the project's data-integrity
rule — never silently guessed numbers.

## Updating for a future tax year

1. Add a new sibling file, e.g. `src/data/salary/us/federalTax2027.ts`,
   with its own `DataSource`, brackets, standard deduction, and FICA
   constants — do not overwrite the 2026 file, since historical years may
   still be referenced.
2. Update `usPaycheckEngine.calculate` (`src/calculators/salary/engines/usPaycheck.ts`)
   to branch on the requested `year` and import the matching data module,
   instead of hard-coding 2026.
3. Add the new year to `availableYears` / `defaultYear` in
   `src/data/locales/en-US.ts`.
4. Add unit tests mirroring `tests/calculators/usPaycheck.test.ts` for the
   new year's figures (standard-deduction zero-tax case, wage-base cap,
   single vs. married comparison).
5. Update this file with the new year's source citations before enabling
   it for users.

## Other locales (en-GB, en-IE, pt-BR, es-ES, es-MX, de-DE, nl-NL)

No tax, payroll, rent, or labor data exists for these locales yet. They
are typed in `src/i18n/types.ts` (`LOCALE_STATUS`) with status
`coming-soon` and have no entry in `src/data/locales/index.ts` — any
attempt to call `getLocaleConfig` or `getDictionary` for them throws
rather than silently falling back to US data or English text.
