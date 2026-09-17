import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// SOURCE: Revenue Ireland — Tax rates, bands and reliefs 2025
// Standard rate: 20% on first €44,000 (single) / €53,000 (married one earner)
// Higher rate: 40% on balance
// YEAR: 2026 (using 2025 published figures as 2026 not yet announced)
// VERIFY: Re-check at https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/index.aspx
export const irelandPAYESource2026: DataSource = {
  authority: 'Revenue Ireland — Tax rates, bands and reliefs',
  url: 'https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/tax-relief-charts/income-tax-rates-bands.aspx',
  accessedDate: '2026-09-18',
  year: 2026,
};

/** Irish PAYE income tax brackets for single persons (on gross income — USC and PRSI deducted separately). */
export const irelandIncomeTaxBrackets2026: TaxBracket[] = [
  { min: 0, max: 44_000, rate: 0.20 },
  { min: 44_000, max: null, rate: 0.40 },
];

/** Personal Tax Credit (single) — reduces tax payable */
export const irelandPersonalTaxCredit2026 = 1_875;

// SOURCE: Revenue Ireland — Universal Social Charge (USC) rates 2025
// 0.5% on first €12,012; 2% €12,012–€22,920; 4.5% €22,920–€70,044; 8% above €70,044
// YEAR: 2026 (approximated from 2025 published rates)
export const irelandUSCBrackets2026: TaxBracket[] = [
  { min: 0, max: 12_012, rate: 0.005 },
  { min: 12_012, max: 22_920, rate: 0.02 },
  { min: 22_920, max: 70_044, rate: 0.045 },
  { min: 70_044, max: null, rate: 0.08 },
];

// SOURCE: Revenue Ireland — PRSI rates 2025
// Employee Class A PRSI: 4% on gross earnings above €352/week (€18,304/year)
export const irelandPRSI2026 = {
  employeeRate: 0.04,
  weeklyThreshold: 352,
  annualThreshold: 18_304,
} as const;
