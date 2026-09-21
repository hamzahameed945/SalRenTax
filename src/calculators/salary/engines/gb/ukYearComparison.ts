import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { ukPaycheckEngine, type UkPaycheckInput } from './ukPaycheck';

export interface UkYearComparisonInput {
  /** Current year calculation input */
  currentYear: UkPaycheckInput;
  /** Previous year salary (for comparison) */
  previousYearSalary: number;
  /** Previous year net pay (if known, otherwise will estimate using current rates) */
  previousYearNetPay?: number;
}

export interface UkYearComparisonResult {
  /** Previous year details */
  previousYear: {
    grossAnnual: number;
    netAnnual: number;
    netMonthly: number;
  };
  /** Current year details */
  currentYear: {
    grossAnnual: number;
    netAnnual: number;
    netMonthly: number;
    effectiveTaxRate: number;
  };
  /** Year-over-year comparison */
  comparison: {
    grossChange: number;
    netChange: number;
    netMonthlyChange: number;
    grossChangePercent: number;
    netChangePercent: number;
    /** Real terms change (accounting for inflation, if provided) */
    realTermsChangePercent?: number;
  };
}

export const ukYearComparisonEngine: CalculatorEngine<
  UkYearComparisonInput,
  UkYearComparisonResult,
  never
> = {
  validate(input: UkYearComparisonInput): ValidationResult<UkYearComparisonInput> {
    // Validate current year input
    const currentValidation = ukPaycheckEngine.validate(input.currentYear);
    if (!currentValidation.valid) {
      return { valid: false, errors: { currentYear: 'errors.invalidCurrentYear' } as Partial<Record<keyof UkYearComparisonInput, string>> };
    }

    const errors: Partial<Record<keyof UkYearComparisonInput, string>> = {};

    if (!input.previousYearSalary || input.previousYearSalary <= 0) {
      errors.previousYearSalary = 'errors.mustBePositive';
    }

    if (input.previousYearNetPay !== undefined && input.previousYearNetPay < 0) {
      errors.previousYearNetPay = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UkYearComparisonInput, _config: never, year: number): UkYearComparisonResult {
    // Calculate current year
    const currentResult = ukPaycheckEngine.calculate(input.currentYear, _config, year);

    // Estimate previous year net pay if not provided
    // (using current tax rates as approximation)
    let previousYearNetPay = input.previousYearNetPay;
    if (!previousYearNetPay) {
      const previousYearInput: UkPaycheckInput = {
        ...input.currentYear,
        grossAnnual: input.previousYearSalary,
      };
      const previousResult = ukPaycheckEngine.calculate(previousYearInput, _config, year);
      previousYearNetPay = previousResult.netAnnualPay;
    }

    // Calculate comparison metrics
    const grossChange = currentResult.grossAnnualPay - input.previousYearSalary;
    const netChange = currentResult.netAnnualPay - previousYearNetPay;
    const netMonthlyChange = netChange / 12;
    const grossChangePercent = (grossChange / input.previousYearSalary) * 100;
    const netChangePercent = (netChange / previousYearNetPay) * 100;

    return {
      previousYear: {
        grossAnnual: input.previousYearSalary,
        netAnnual: previousYearNetPay,
        netMonthly: previousYearNetPay / 12,
      },
      currentYear: {
        grossAnnual: currentResult.grossAnnualPay,
        netAnnual: currentResult.netAnnualPay,
        netMonthly: currentResult.netAnnualPay / 12,
        effectiveTaxRate: currentResult.effectiveTotalRate,
      },
      comparison: {
        grossChange,
        netChange,
        netMonthlyChange,
        grossChangePercent,
        netChangePercent,
      },
    };
  },
};
