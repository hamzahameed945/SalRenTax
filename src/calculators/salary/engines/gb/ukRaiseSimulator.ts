import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { ukPaycheckEngine, type UkPaycheckInput } from './ukPaycheck';

export interface UkRaiseSimulatorInput extends UkPaycheckInput {
  /** Proposed raise amount (GBP) or percentage */
  raiseAmount?: number;
  /** Raise percentage (alternative to raiseAmount) */
  raisePercent?: number;
}

export interface UkRaiseSimulatorResult {
  /** Current salary details */
  current: {
    grossAnnual: number;
    netAnnual: number;
    netMonthly: number;
    effectiveTaxRate: number;
    marginalDeductionRate: number;
  };
  /** After raise salary details */
  afterRaise: {
    grossAnnual: number;
    netAnnual: number;
    netMonthly: number;
    effectiveTaxRate: number;
    marginalDeductionRate: number;
  };
  /** Comparison metrics */
  comparison: {
    grossIncrease: number;
    netIncrease: number;
    netMonthlyIncrease: number;
    grossIncreasePercent: number;
    netIncreasePercent: number;
    /** Percentage of raise kept after tax (take-home rate) */
    takeHomeRate: number;
    /** Amount lost to tax/deductions */
    lostToDeductions: number;
  };
}

export const ukRaiseSimulatorEngine: CalculatorEngine<
  UkRaiseSimulatorInput,
  UkRaiseSimulatorResult,
  never
> = {
  validate(input: UkRaiseSimulatorInput): ValidationResult<UkRaiseSimulatorInput> {
    // Use base validator from paycheck engine
    const baseValidation = ukPaycheckEngine.validate(input);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors: Partial<Record<keyof UkRaiseSimulatorInput, string>> = {};

    if (!input.raiseAmount && !input.raisePercent) {
      errors.raiseAmount = 'errors.raiseAmountOrPercentRequired';
    }

    if (input.raiseAmount !== undefined && input.raiseAmount < 0) {
      errors.raiseAmount = 'errors.mustBePositive';
    }

    if (input.raisePercent !== undefined && input.raisePercent < 0) {
      errors.raisePercent = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UkRaiseSimulatorInput, _config: never, year: number): UkRaiseSimulatorResult {
    // Calculate current salary
    const currentResult = ukPaycheckEngine.calculate(input, _config, year);

    // Calculate raise amount
    let raiseAmount = input.raiseAmount ?? 0;
    if (input.raisePercent) {
      raiseAmount = input.grossAnnual * (input.raisePercent / 100);
    }

    // Calculate after-raise salary
    const afterRaiseInput: UkPaycheckInput = {
      ...input,
      grossAnnual: input.grossAnnual + raiseAmount,
    };
    const afterRaiseResult = ukPaycheckEngine.calculate(afterRaiseInput, _config, year);

    // Calculate comparison metrics
    const grossIncrease = afterRaiseResult.grossAnnualPay - currentResult.grossAnnualPay;
    const netIncrease = afterRaiseResult.netAnnualPay - currentResult.netAnnualPay;
    const netMonthlyIncrease = netIncrease / 12;
    const grossIncreasePercent = (grossIncrease / currentResult.grossAnnualPay) * 100;
    const netIncreasePercent = (netIncrease / currentResult.netAnnualPay) * 100;
    const takeHomeRate = (netIncrease / grossIncrease) * 100;
    const lostToDeductions = grossIncrease - netIncrease;

    return {
      current: {
        grossAnnual: currentResult.grossAnnualPay,
        netAnnual: currentResult.netAnnualPay,
        netMonthly: currentResult.netAnnualPay / 12,
        effectiveTaxRate: currentResult.effectiveTotalRate,
        marginalDeductionRate: currentResult.marginalDeductionRate,
      },
      afterRaise: {
        grossAnnual: afterRaiseResult.grossAnnualPay,
        netAnnual: afterRaiseResult.netAnnualPay,
        netMonthly: afterRaiseResult.netAnnualPay / 12,
        effectiveTaxRate: afterRaiseResult.effectiveTotalRate,
        marginalDeductionRate: afterRaiseResult.marginalDeductionRate,
      },
      comparison: {
        grossIncrease,
        netIncrease,
        netMonthlyIncrease,
        grossIncreasePercent,
        netIncreasePercent,
        takeHomeRate,
        lostToDeductions,
      },
    };
  },
};
