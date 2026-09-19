import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  ukIncomeTaxBrackets2026,
  ukPersonalAllowance2026,
  ukNI2026,
} from '../../../../data/salary/gb/ukTaxData2026';
import { PERIODS_PER_YEAR, type PayFrequency } from '../../../core/frequency';

export interface UkPaycheckInput {
  /** Annual gross salary, GBP. */
  grossAnnual: number;
  payFrequency: PayFrequency;
  /** Scottish taxpayer: different income tax rates apply (not yet implemented). */
  scottish?: boolean;
}

export interface UkPaycheckResult {
  grossAnnualPay: number;
  incomeTaxAnnual: number;
  nationalInsuranceAnnual: number;
  netAnnualPay: number;
  netPayPerPeriod: number;
  grossPayPerPeriod: number;
  effectiveIncomeTaxRate: number;
  effectiveNIRate: number;
  effectiveTotalRate: number;
}

export const ukPaycheckEngine: CalculatorEngine<UkPaycheckInput, UkPaycheckResult, never> = {
  validate(input: UkPaycheckInput): ValidationResult<UkPaycheckInput> {
    const errors: Partial<Record<keyof UkPaycheckInput, string>> = {};

    if (!input.grossAnnual || Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UkPaycheckInput): UkPaycheckResult {
    const gross = input.grossAnnual;
    const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency];

    // Personal allowance tapers by £1 per £2 above £100,000
    let personalAllowance = ukPersonalAllowance2026;
    if (gross > 100_000) {
      personalAllowance = Math.max(0, personalAllowance - Math.floor((gross - 100_000) / 2));
    }

    // Income tax on taxable income above personal allowance
    const taxableIncome = Math.max(0, gross - personalAllowance);
    const { totalTax: incomeTaxAnnual } = calculateProgressiveTax(
      taxableIncome,
      ukIncomeTaxBrackets2026,
    );

    // National Insurance (Class 1 employee)
    let nationalInsuranceAnnual = 0;
    if (gross > ukNI2026.primaryThresholdAnnual) {
      const mainNIBase = Math.min(gross, ukNI2026.upperEarningsLimitAnnual) - ukNI2026.primaryThresholdAnnual;
      nationalInsuranceAnnual += Math.max(0, mainNIBase) * ukNI2026.mainRate;
      if (gross > ukNI2026.upperEarningsLimitAnnual) {
        nationalInsuranceAnnual += (gross - ukNI2026.upperEarningsLimitAnnual) * ukNI2026.additionalRate;
      }
    }

    const netAnnualPay = gross - incomeTaxAnnual - nationalInsuranceAnnual;

    return {
      grossAnnualPay: gross,
      incomeTaxAnnual,
      nationalInsuranceAnnual,
      netAnnualPay,
      netPayPerPeriod: netAnnualPay / periodsPerYear,
      grossPayPerPeriod: gross / periodsPerYear,
      effectiveIncomeTaxRate: gross > 0 ? incomeTaxAnnual / gross : 0,
      effectiveNIRate: gross > 0 ? nationalInsuranceAnnual / gross : 0,
      effectiveTotalRate: gross > 0 ? (incomeTaxAnnual + nationalInsuranceAnnual) / gross : 0,
    };
  },
};
