import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// SOURCE: HMRC — Income Tax rates and Personal Allowances 2025-26 (tax year Apr 2025 – Apr 2026)
// Personal Allowance: £12,570 (frozen until 2028)
// Basic rate: 20% on £12,571–£50,270
// Higher rate: 40% on £50,271–£125,140
// Additional rate: 45% above £125,140
// YEAR: 2025-26 (UK tax year)
// VERIFY: Re-check at https://www.gov.uk/income-tax-rates each April
export const ukIncomeTaxSource2026: DataSource = {
  authority: 'HMRC — Income Tax rates and Personal Allowances 2025-26',
  url: 'https://www.gov.uk/income-tax-rates',
  accessedDate: '2026-09-18',
  year: 2026,
};

/** UK income tax brackets (after personal allowance deduction). */
export const ukIncomeTaxBrackets2026: TaxBracket[] = [
  { min: 0, max: 37_700, rate: 0.20 },      // Basic rate
  { min: 37_700, max: 112_570, rate: 0.40 }, // Higher rate
  { min: 112_570, max: null, rate: 0.45 },   // Additional rate
];

/** Personal Allowance 2025-26. Tapers by £1 for every £2 above £100,000. */
export const ukPersonalAllowance2026 = 12_570;

// SOURCE: HMRC — National Insurance: rates and thresholds 2025-26
// Employee Class 1: 8% on earnings £12,570–£50,270; 2% above £50,270
// YEAR: 2025-26
// VERIFY: Re-check at https://www.gov.uk/national-insurance/how-much-you-pay each April
export const ukNISource2026: DataSource = {
  authority: 'HMRC — National Insurance rates and thresholds 2025-26',
  url: 'https://www.gov.uk/national-insurance/how-much-you-pay',
  accessedDate: '2026-09-18',
  year: 2026,
};

/** Class 1 NI employee thresholds (annual) */
export const ukNI2026 = {
  /** Primary Threshold (annual) — NI starts above this */
  primaryThresholdAnnual: 12_570,
  /** Upper Earnings Limit (annual) */
  upperEarningsLimitAnnual: 50_270,
  /** Rate between PT and UEL */
  mainRate: 0.08,
  /** Rate above UEL */
  additionalRate: 0.02,
} as const;
