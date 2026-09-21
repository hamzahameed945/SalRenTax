import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// SOURCE: HMRC — Rates and thresholds for employers 2026 to 2027
// Personal Allowance: £12,570 (frozen until 2028)
// England/Wales/NI: Basic 20% (£0-£37,700), Higher 40% (£37,701-£125,140), Additional 45% (>£125,140)
// Scotland: Different rates with 6 tax bands
// YEAR: 2026-27 (UK tax year: 6 April 2026 – 5 April 2027)
// VERIFY: https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
export const ukIncomeTaxSource2026: DataSource = {
  authority: 'HMRC — Rates and thresholds for employers 2026 to 2027',
  url: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027',
  accessedDate: '2026-09-21',
  year: 2026,
};

/** Personal Allowance 2026-27. Tapers by £1 for every £2 above £100,000. */
export const ukPersonalAllowance2026 = 12_570;

/** UK income tax brackets for England, Wales, and Northern Ireland (applied to taxable income after personal allowance). */
export const ukIncomeTaxBrackets2026: TaxBracket[] = [
  { min: 0, max: 37_700, rate: 0.20 },       // Basic rate
  { min: 37_700, max: 112_570, rate: 0.40 }, // Higher rate
  { min: 112_570, max: null, rate: 0.45 },   // Additional rate
];

/** Scottish income tax brackets 2026-27 (applied to taxable income after personal allowance).
 * Scotland has devolved income tax powers with different rates and bands.
 */
export const ukScottishIncomeTaxBrackets2026: TaxBracket[] = [
  { min: 0, max: 3_967, rate: 0.19 },        // Starter rate
  { min: 3_967, max: 16_956, rate: 0.20 },   // Basic rate
  { min: 16_956, max: 31_092, rate: 0.21 },  // Intermediate rate
  { min: 31_092, max: 62_430, rate: 0.42 },  // Higher rate
  { min: 62_430, max: 112_570, rate: 0.45 }, // Advanced rate
  { min: 112_570, max: null, rate: 0.48 },   // Top rate
];

/** Welsh income tax brackets 2026-27 (currently same as England/NI) */
export const ukWelshIncomeTaxBrackets2026: TaxBracket[] = ukIncomeTaxBrackets2026;

// SOURCE: HMRC — National Insurance rates 2026-27
// Employee Class 1 (Category A): 8% on earnings £12,570–£50,270; 2% above £50,270
// Employer Class 1: 15% on earnings above £5,000 (secondary threshold)
// YEAR: 2026-27
export const ukNISource2026: DataSource = {
  authority: 'HMRC — National Insurance rates and thresholds 2026-27',
  url: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027',
  accessedDate: '2026-09-21',
  year: 2026,
};

/** Class 1 NI employee thresholds and rates (annual) */
export const ukNI2026 = {
  /** Lower Earnings Limit (annual) — minimum for qualifying for benefits */
  lowerEarningsLimitAnnual: 6_708,
  /** Primary Threshold (annual) — employee NI starts above this */
  primaryThresholdAnnual: 12_570,
  /** Upper Earnings Limit (annual) — reduced rate applies above this */
  upperEarningsLimitAnnual: 50_270,
  /** Employee rate between Primary Threshold and Upper Earnings Limit (Category A) */
  mainRate: 0.08,
  /** Employee rate above Upper Earnings Limit (Category A) */
  additionalRate: 0.02,
  /** Employer Secondary Threshold (annual) — employer NI starts above this */
  secondaryThresholdAnnual: 5_000,
  /** Employer rate on earnings above secondary threshold */
  employerRate: 0.15,
} as const;

// SOURCE: HMRC — Student loan thresholds 2026-27
// Plan 1 (pre-Sep 2012): £26,900, Plan 2 (post-Sep 2012): £29,385
// Plan 4 (Scotland): £33,795, Plan 5 (post-Aug 2023): £25,000
// All plans: 9% deduction rate
// Postgraduate loan: £21,000 threshold, 6% rate
export const ukStudentLoan2026 = {
  plan1Threshold: 26_900,
  plan2Threshold: 29_385,
  plan4Threshold: 33_795,
  plan5Threshold: 25_000,
  deductionRate: 0.09,
  postgraduateThreshold: 21_000,
  postgraduateRate: 0.06,
} as const;

// SOURCE: HMRC — National Minimum Wage rates from 1 April 2026
export const ukMinimumWage2026 = {
  /** National Living Wage (21+) */
  age21Plus: 12.71,
  /** Age 18-20 */
  age18To20: 10.85,
  /** Under 18 (above school leaving age) */
  under18: 8.00,
  /** Apprentice rate (under 19, or 19+ in first year) */
  apprentice: 8.00,
} as const;

/** Blind Person's Allowance 2026-27 — additional tax-free allowance */
export const ukBlindPersonAllowance2026 = 3_070;

/** Marriage Allowance 2026-27 — transferable amount between spouses (10% of personal allowance) */
export const ukMarriageAllowance2026 = 1_260;
