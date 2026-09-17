import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  irelandIncomeTaxBrackets2026,
  irelandPersonalTaxCredit2026,
  irelandUSCBrackets2026,
  irelandPRSI2026,
} from '../../../../data/salary/ie/irelandTaxData2026';
import { PERIODS_PER_YEAR, type PayFrequency } from '../../../core/frequency';

export interface IrelandPaycheckInput {
  /** Annual gross salary, EUR. */
  grossAnnual: number;
  payFrequency: PayFrequency;
  maritalStatus: 'single' | 'married';
}

export interface IrelandPaycheckResult {
  grossAnnualPay: number;
  payeAnnual: number;
  uscAnnual: number;
  prsiAnnual: number;
  netAnnualPay: number;
  netPayPerPeriod: number;
  grossPayPerPeriod: number;
  effectivePAYERate: number;
  effectiveUSCRate: number;
  effectiveTotalRate: number;
}

export const irelandPaycheckEngine: CalculatorEngine<IrelandPaycheckInput, IrelandPaycheckResult, never> = {
  validate(input: IrelandPaycheckInput): ValidationResult<IrelandPaycheckInput> {
    const errors: Partial<Record<keyof IrelandPaycheckInput, string>> = {};

    if (!input.grossAnnual || Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: IrelandPaycheckInput): IrelandPaycheckResult {
    const gross = input.grossAnnual;
    const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency];

    // PAYE — progressive on gross; then subtract Personal Tax Credit
    const { totalTax: rawPAYE } = calculateProgressiveTax(gross, irelandIncomeTaxBrackets2026);
    const taxCredit = input.maritalStatus === 'married'
      ? irelandPersonalTaxCredit2026 * 2
      : irelandPersonalTaxCredit2026;
    const payeAnnual = Math.max(0, rawPAYE - taxCredit);

    // USC
    const { totalTax: uscAnnual } = calculateProgressiveTax(gross, irelandUSCBrackets2026);

    // PRSI (Class A Employee): 4% on gross above annual threshold
    const prsiAnnual = gross > irelandPRSI2026.annualThreshold
      ? gross * irelandPRSI2026.employeeRate
      : 0;

    const netAnnualPay = gross - payeAnnual - uscAnnual - prsiAnnual;

    return {
      grossAnnualPay: gross,
      payeAnnual,
      uscAnnual,
      prsiAnnual,
      netAnnualPay,
      netPayPerPeriod: netAnnualPay / periodsPerYear,
      grossPayPerPeriod: gross / periodsPerYear,
      effectivePAYERate: gross > 0 ? payeAnnual / gross : 0,
      effectiveUSCRate: gross > 0 ? uscAnnual / gross : 0,
      effectiveTotalRate: gross > 0 ? (payeAnnual + uscAnnual + prsiAnnual) / gross : 0,
    };
  },
};
