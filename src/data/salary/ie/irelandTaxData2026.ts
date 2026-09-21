import type { TaxBracket } from '../../../calculators/core/progressiveTax';
import type { DataSource } from '../../../calculators/core/types';

// SOURCE: KPMG Ireland Budget 2026 — Tax rates and credits
// Standard rate: 20% on first €44,000 (single) / €53,000 (married one earner) / €88,000 (married two earners)
// Higher rate: 40% on balance
// YEAR: 2026 (Budget 2026 confirmed rates)
// VERIFY: https://kpmg.com/ie/en/insights/tax/budget-2026/tables.html
export const irelandPAYESource2026: DataSource = {
  authority: 'KPMG Ireland Budget 2026 — Tax rates and credits',
  url: 'https://kpmg.com/ie/en/insights/tax/budget-2026/tables.html',
  accessedDate: '2026-09-21',
  year: 2026,
};

/** Irish PAYE income tax brackets for different statuses (on gross income — USC and PRSI deducted separately). */
export const irelandIncomeTaxBrackets2026 = {
  single: [
    { min: 0, max: 44_000, rate: 0.20 },
    { min: 44_000, max: null, rate: 0.40 },
  ] as TaxBracket[],
  marriedOneIncome: [
    { min: 0, max: 53_000, rate: 0.20 },
    { min: 53_000, max: null, rate: 0.40 },
  ] as TaxBracket[],
  marriedTwoIncomes: [
    { min: 0, max: 88_000, rate: 0.20 },
    { min: 88_000, max: null, rate: 0.40 },
  ] as TaxBracket[],
  singleParent: [
    { min: 0, max: 48_000, rate: 0.20 },
    { min: 48_000, max: null, rate: 0.40 },
  ] as TaxBracket[],
};

/** Tax Credits 2026 — reduces tax payable (not taxable income) */
export const irelandTaxCredits2026 = {
  /** Personal Tax Credit */
  personal: 2_000,
  /** Employee (PAYE) Tax Credit */
  employee: 2_000,
  /** Single Person Child Carer Credit */
  singleParentChildCarer: 1_900,
  /** Home Carer Credit (full credit if carer income ≤ €7,200) */
  homeCarer: 1_950,
  /** Incapacitated Child Tax Credit (per child) */
  incapacitatedChild: 3_800,
  /** Rent Tax Credit (single person max) */
  rentCreditSingle: 1_000,
  /** Rent Tax Credit (married couple max) */
  rentCreditMarried: 2_000,
  /** Earned Income Credit (self-employed) */
  earnedIncome: 2_000,
} as const;

// SOURCE: KPMG Ireland Budget 2026 — USC rates
// Updated brackets for 2026: 2nd bracket increased to €28,700; 3rd bracket reduced from 4.5% to 3%
// 0.5% on first €12,012; 2% €12,012–€28,700; 3% €28,700–€70,044; 8% above €70,044
// Self-employed pay 11% (not 8%) on income over €100,000
// Exempt if total income ≤ €13,000
// YEAR: 2026
export const irelandUSCBrackets2026: TaxBracket[] = [
  { min: 0, max: 12_012, rate: 0.005 },
  { min: 12_012, max: 28_700, rate: 0.02 },
  { min: 28_700, max: 70_044, rate: 0.03 },
  { min: 70_044, max: null, rate: 0.08 },
];

/** USC exemption threshold — no USC if total income ≤ this amount */
export const irelandUSCExemptionThreshold2026 = 13_000;

/** USC reduced rate for medical card holders and over-70s (where income ≤ €60,000) */
export const irelandUSCReducedRate2026 = 0.02;
export const irelandUSCReducedRateIncomeLimit2026 = 60_000;

// SOURCE: KPMG Ireland Budget 2026 — PRSI rates
// Employee Class A PRSI: Blended rate 4.2375% for 2026 (4.2% Jan-Sep, 4.35% Oct-Dec)
// From 1 October 2026, rate increases from 4.2% to 4.35%
// Employees earning €352 or less per week are exempt from PRSI
// Those aged 70+ pay no employee PRSI
// YEAR: 2026
export const irelandPRSI2026 = {
  /** Blended annual rate for 2026 (weighted average of 4.2% for 9 months + 4.35% for 3 months) */
  employeeRateBlended: 0.042375,
  /** Rate from January to September 2026 */
  employeeRateJanSep: 0.042,
  /** Rate from October to December 2026 */
  employeeRateOctDec: 0.0435,
  /** Weekly threshold — employees earning ≤ this are exempt */
  weeklyThreshold: 352,
  /** Annual threshold approximation */
  annualThreshold: 18_304,
  /** Employer rate (blended for 2026: 11.25% for 9 months, 11.40% for 3 months) */
  employerRateBlended: 0.1129,
} as const;

// SOURCE: EY Ireland Budget 2026 Calculator
// Auto-enrolment pension scheme launched in 2026
// Employees aged 23-60 earning ≥€20,000 automatically enrolled
// Employee contributes 1.5% (max €1,200 on salary up to €80,000)
// Employer contributes 1.5%, Government contributes 0.5%
export const irelandAutoEnrolment2026 = {
  minAge: 23,
  maxAge: 60,
  minSalary: 20_000,
  maxQualifyingSalary: 80_000,
  employeeContributionRate: 0.015,
  employerContributionRate: 0.015,
  governmentContributionRate: 0.005,
} as const;
