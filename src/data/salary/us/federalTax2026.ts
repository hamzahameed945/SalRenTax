import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// SOURCE: Internal Revenue Service, "IRS releases tax inflation adjustments for
//         tax year 2026, including amendments from the One, Big, Beautiful Bill"
//         (IR-2025-103, Oct. 9, 2025), citing Revenue Procedure 2025-32.
// YEAR: 2026
// VERIFY: Re-check against Rev. Proc. 2025-32 before each filing season.
export const federalIncomeTaxSource2026: DataSource = {
  authority: 'Internal Revenue Service (Revenue Procedure 2025-32)',
  url: 'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill',
  accessedDate: '2026-09-15',
  year: 2026,
};

// SOURCE: Social Security Administration, "Contribution and Benefit Base" (ssa.gov/oact/cola/cbb.html)
// YEAR: 2026
export const ficaSource2026: DataSource = {
  authority: 'Social Security Administration — Contribution and Benefit Base',
  url: 'https://www.ssa.gov/oact/cola/cbb.html',
  accessedDate: '2026-09-15',
  year: 2026,
};

/**
 * 2026 federal income tax brackets, single filers.
 * SOURCE: IRS IR-2025-103 / Revenue Procedure 2025-32.
 */
export const federalBrackets2026Single: TaxBracket[] = [
  { min: 0, max: 12_400, rate: 0.1 },
  { min: 12_400, max: 50_400, rate: 0.12 },
  { min: 50_400, max: 105_700, rate: 0.22 },
  { min: 105_700, max: 201_775, rate: 0.24 },
  { min: 201_775, max: 256_225, rate: 0.32 },
  { min: 256_225, max: 640_600, rate: 0.35 },
  { min: 640_600, max: null, rate: 0.37 },
];

/**
 * 2026 federal income tax brackets, married filing jointly.
 * SOURCE: IRS IR-2025-103 / Revenue Procedure 2025-32.
 */
export const federalBrackets2026MarriedJointly: TaxBracket[] = [
  { min: 0, max: 24_800, rate: 0.1 },
  { min: 24_800, max: 100_800, rate: 0.12 },
  { min: 100_800, max: 211_400, rate: 0.22 },
  { min: 211_400, max: 403_550, rate: 0.24 },
  { min: 403_550, max: 512_450, rate: 0.32 },
  { min: 512_450, max: 768_700, rate: 0.35 },
  { min: 768_700, max: null, rate: 0.37 },
];

/**
 * 2026 standard deduction amounts.
 * SOURCE: IRS IR-2025-103 / Revenue Procedure 2025-32.
 * NOTE: Head-of-household bracket thresholds are not yet included in this
 * engine — only the standard deduction is sourced. Head-of-household filing
 * status is intentionally left out of the calculator UI until the full
 * bracket schedule is verified (see Section 13: unverified data must remain
 * disabled).
 */
export const standardDeduction2026 = {
  single: 16_100,
  marriedJointly: 32_200,
  // headOfHousehold: 24_150 — TODO: verify full HoH bracket schedule before enabling.
} as const;

/**
 * FICA (Social Security + Medicare) rates and wage base for 2026.
 * SOURCE: Social Security Administration, Contribution and Benefit Base.
 */
export const fica2026 = {
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 184_500,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: {
    single: 200_000,
    marriedJointly: 250_000,
  },
} as const;
