import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { usPaycheckEngine, type FilingStatus } from './usPaycheck';
import {
  EFFECTIVE_PROPERTY_TAX_RATES_2026,
  US_STATES,
} from '../../../data/salary/us/effectivePropertyTaxRates2026';

/**
 * House affordability assumptions (documented on every generated page):
 * - 28/36 rule: max monthly housing payment = 28% of GROSS monthly income
 *   (front-end ratio). We use gross — not take-home — because lenders do.
 * - 30-year fixed mortgage at 7.28% APR: Freddie Mac Primary Mortgage Market
 *   Survey, week ending October 1, 2026.
 * - 20% down payment (no PMI).
 * - Property tax: state effective rate on owner-occupied housing
 *   (Tax Foundation, "Property Taxes by State and County, 2026", 2024 ACS data).
 * - Homeowner's insurance: 0.20% of home value per year (national rule of thumb).
 *
 * The max home price is solved from:
 *   0.28 * monthlyGross = P * (0.80 * f + taxRate/12 + insuranceRate/12)
 * where f is the standard 30-yr amortization factor per $1 of loan.
 */

export const MORTGAGE_ANNUAL_RATE_2026 = 0.0728;
export const MORTGAGE_TERM_MONTHS = 360;
export const FRONT_END_RATIO = 0.28;
export const DOWN_PAYMENT_RATIO = 0.2;
export const HOMEOWNER_INSURANCE_ANNUAL_RATE = 0.002;

export interface HouseAffordabilityInput {
  /** Gross annual salary in USD. */
  annualSalary: number;
  /** Two-letter US state code (e.g. 'TX'). */
  stateCode: string;
  filingStatus?: FilingStatus;
}

export interface HouseAffordabilityResult {
  annualSalary: number;
  stateCode: string;
  stateName: string;
  filingStatus: FilingStatus;
  monthlyGrossPay: number;
  /** 28% of gross monthly — the max allowable monthly PITI. */
  maxMonthlyHousingPayment: number;
  annualTakeHomePay: number;
  monthlyTakeHomePay: number;
  annualFederalIncomeTax: number;
  annualStateIncomeTax: number;
  annualFicaTax: number;
  propertyTaxEffectiveRate: number;
  mortgageAnnualRate: number;
  /** Solved max purchase price (PITI == 28% of gross monthly). */
  maxHomePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyHomeownerInsurance: number;
  monthlyPiti: number;
}

/** Monthly amortization factor per $1 borrowed (30-yr fixed). */
export function monthlyPaymentFactor(annualRate: number, months: number): number {
  const r = annualRate / 12;
  const growth = Math.pow(1 + r, months);
  return (r * growth) / (growth - 1);
}

export const usHouseAffordabilityEngine: CalculatorEngine<
  HouseAffordabilityInput,
  HouseAffordabilityResult,
  { countryCode: 'US' }
> = {
  validate(input: HouseAffordabilityInput): ValidationResult<HouseAffordabilityInput> {
    const errors: Partial<Record<keyof HouseAffordabilityInput, string>> = {};
    if (
      input.annualSalary === undefined ||
      input.annualSalary === null ||
      typeof input.annualSalary !== 'number' ||
      Number.isNaN(input.annualSalary) ||
      input.annualSalary <= 0
    ) {
      errors.annualSalary = 'errors.mustBePositive';
    }
    const code = input.stateCode?.toUpperCase();
    if (!code || !EFFECTIVE_PROPERTY_TAX_RATES_2026[code]) {
      errors.stateCode = 'errors.unsupportedState';
    }
    if (
      input.filingStatus !== undefined &&
      input.filingStatus !== 'single' &&
      input.filingStatus !== 'marriedJointly'
    ) {
      errors.filingStatus = 'UNSUPPORTED_FILING_STATUS';
    }
    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(
    input: HouseAffordabilityInput,
    _config: { countryCode: 'US' },
    year: number,
  ): HouseAffordabilityResult {
    if (year !== 2026) {
      throw new Error(`US house affordability engine only has verified data for tax year 2026 (got ${year}).`);
    }
    const stateCode = input.stateCode.toUpperCase();
    const propertyTaxEffectiveRate = EFFECTIVE_PROPERTY_TAX_RATES_2026[stateCode];
    if (propertyTaxEffectiveRate === undefined) {
      throw new Error(`Unknown state code: ${input.stateCode}`);
    }
    const stateName = US_STATES.find((s) => s.code === stateCode)?.name ?? stateCode;
    const filingStatus: FilingStatus = input.filingStatus ?? 'single';

    // Take-home pay from the verified usPaycheck engine (single filer, no deductions).
    const paycheck = usPaycheckEngine.calculate(
      {
        grossPayPerPeriod: input.annualSalary,
        payFrequency: 'annually',
        filingStatus,
        preTaxDeductionsPerPeriod: 0,
        stateCode,
      },
      { countryCode: 'US' },
      2026,
    );
    const annualTakeHomePay =
      paycheck.annualGrossPay -
      paycheck.annualFederalIncomeTax -
      paycheck.annualSocialSecurity -
      paycheck.annualMedicare -
      (paycheck.annualAdditionalMedicare ?? 0) -
      (paycheck.annualStateIncomeTax ?? 0);

    const monthlyGrossPay = input.annualSalary / 12;
    const maxMonthlyHousingPayment = monthlyGrossPay * FRONT_END_RATIO;

    const factor = monthlyPaymentFactor(MORTGAGE_ANNUAL_RATE_2026, MORTGAGE_TERM_MONTHS);
    const burdenPerDollar =
      (1 - DOWN_PAYMENT_RATIO) * factor +
      propertyTaxEffectiveRate / 12 +
      HOMEOWNER_INSURANCE_ANNUAL_RATE / 12;

    const maxHomePrice = maxMonthlyHousingPayment / burdenPerDollar;
    const downPayment = maxHomePrice * DOWN_PAYMENT_RATIO;
    const loanAmount = maxHomePrice - downPayment;
    const monthlyPrincipalAndInterest = loanAmount * factor;
    const monthlyPropertyTax = (maxHomePrice * propertyTaxEffectiveRate) / 12;
    const monthlyHomeownerInsurance = (maxHomePrice * HOMEOWNER_INSURANCE_ANNUAL_RATE) / 12;
    const monthlyPiti = monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyHomeownerInsurance;

    return {
      annualSalary: input.annualSalary,
      stateCode,
      stateName,
      filingStatus,
      monthlyGrossPay,
      maxMonthlyHousingPayment,
      annualTakeHomePay,
      monthlyTakeHomePay: annualTakeHomePay / 12,
      annualFederalIncomeTax: paycheck.annualFederalIncomeTax,
      annualStateIncomeTax: paycheck.annualStateIncomeTax ?? 0,
      annualFicaTax: paycheck.annualSocialSecurity + paycheck.annualMedicare,
      propertyTaxEffectiveRate,
      mortgageAnnualRate: MORTGAGE_ANNUAL_RATE_2026,
      maxHomePrice,
      downPayment,
      loanAmount,
      monthlyPrincipalAndInterest,
      monthlyPropertyTax,
      monthlyHomeownerInsurance,
      monthlyPiti,
    };
  },
};
