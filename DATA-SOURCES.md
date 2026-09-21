# Data Sources

All calculator formulas are implemented as small, testable TypeScript engines. Published pages do not duplicate payroll/tax formulas in inline JavaScript.

## US federal and state calculators

- Federal 2026: `src/data/salary/us/federalTax2026.ts` (IRS/SSA source notes in the module).
- Texas: no state individual income tax; `src/calculators/salary/engines/usStates/tx.ts`.
- Florida: no state individual income tax; `src/calculators/salary/engines/usStates/fl.ts`.
- Illinois: 2026 individual income tax rate 4.95% and $2,925 personal exemption allowance; `src/calculators/salary/engines/usStates/il.ts`. Illinois Department of Revenue 2026 withholding guidance is the source basis.
- Arizona: 2.5% flat-rate estimate with the standard-deduction assumptions documented in `src/calculators/salary/engines/usStates/az.ts`.
- New York: 2026 New York State withholding-style estimate in `src/calculators/salary/engines/usStates/ny.ts`; NYC local income tax is deliberately excluded.

## Germany

- 2026 payroll/social-insurance data: `src/data/salary/de/germanPayrollData2026.ts`.
- 2026 statutory minimum wage: €13.90/hour.
- 2026 Minijob earnings limit: €603/month annual average.
- `Teilzeit`, `Stundenlohn` and `Minijob` tools are proportional/threshold estimates and do not claim to be complete payroll withholding calculators.
- TVöD/public-service salary tables remain planned until source tables are integrated.

## Spain

- Payroll data: `src/data/salary/es/spainPayrollData2026.ts`.
- Finiquito/indemnización engine uses simplified statutory day-per-year rules and explicit monetary monthly caps. Page copy identifies it as an estimate rather than a complete legal payroll determination.

## Mexico

- Payroll data: `src/data/salary/mx/mexicoPayrollData2026.ts`.
- Finiquito/liquidación remains an estimate; it does not claim to replace a full legal payroll calculation or all seniority-premium caps.

## Brazil

- 2026 INSS data: official INSS monthly contribution table, linked in `src/data/salary/br/brSalary2026.ts`.
- 2026 IRRF data: official Receita Federal 2026 monthly tax table/reduction rules, linked in `src/data/salary/br/brSalary2026.ts`.
- The net-salary tool models progressive INSS plus the 2026 monthly IRRF table and simplified-deduction/reduction rules. Dependents and other payroll deductions are not modeled.
- Vacation and overtime tools are transparent gross-pay models and do not claim to model every collective-agreement or payroll deduction.

## Metadata / SEO

- `PUBLIC_SITE_URL` drives canonical URLs, hreflang URLs, sitemap URLs, robots.txt and JSON-LD URLs.
- `public/og-default.png` is the default Open Graph/Twitter preview image.
