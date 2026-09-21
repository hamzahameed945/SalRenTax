import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { irelandPaycheckEngine, type IrelandPaycheckInput } from './irelandPaycheck';

export interface IrelandRaiseSimulatorInput extends IrelandPaycheckInput {
  /** Proposed raise amount (EUR) or percentage */
  raiseAmount?: number;
  /** Raise percentage (alternative to raiseAmount) */
  raisePercent?: number;
}

export interface IrelandRaiseSimulatorResult {
  /** Current salary details */
  current: {
    grossAnnual: number;
    netAnnual: number;
    netMonthly: number;
    effectiveTaxRate: number;
    marginalTaxRate: number;
  };
  /** After raise salary details */
  afterRaise: {
    grossAnnual: number;
    netAnnual: number;
    netMonthly: number;
    effectiveTaxRate: number;
    marginalTaxRate: number;
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
    lostToTax: number;
  };
}

export const irelandRaiseSimulatorEngine: CalculatorEngine<
  IrelandRaiseSimulatorInput,
  IrelandRaiseSimulatorResult,
  never
> = {
  validate(input: IrelandRaiseSimulatorInput): ValidationResult<IrelandRaiseSimulatorInput> {
    // Use base validator from paycheck engine
    const baseValidation = irelandPaycheckEngine.validate(input);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors: Partial<Record<keyof IrelandRaiseSimulatorInput, string>> = {};

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

  calculate(input: IrelandRaiseSimulatorInput, _config: never, year: number): IrelandRaiseSimulatorResult {
    // Calculate current salary
    const currentResult = irelandPaycheckEngine.calculate(input, _config, year);

    // Calculate raise amount
    let raiseAmount = input.raiseAmount ?? 0;
    if (input.raisePercent) {
      raiseAmount = input.grossAnnual * (input.raisePercent / 100);
    }

    // Calculate after-raise salary
    const afterRaiseInput: IrelandPaycheckInput = {
      ...input,
      grossAnnual: input.grossAnnual + raiseAmount,
    };
    const afterRaiseResult = irelandPaycheckEngine.calculate(afterRaiseInput, _config, year);

    // Calculate comparison metrics
    const grossIncrease = afterRaiseResult.grossAnnualPay - currentResult.grossAnnualPay;
    const netIncrease = afterRaiseResult.netAnnualPay - currentResult.netAnnualPay;
    const netMonthlyIncrease = netIncrease / 12;
    const grossIncreasePercent = (grossIncrease / currentResult.grossAnnualPay) * 100;
    const netIncreasePercent = (netIncrease / currentResult.netAnnualPay) * 100;
    const takeHomeRate = (netIncrease / grossIncrease) * 100;
    const lostToTax = grossIncrease - netIncrease;

    return {
      current: {
        grossAnnual: currentResult.grossAnnualPay,
        netAnnual: currentResult.netAnnualPay,
        netMonthly: currentResult.netAnnualPay / 12,
        effectiveTaxRate: currentResult.effectiveTotalRate,
        marginalTaxRate: currentResult.marginalTaxRate,
      },
      afterRaise: {
        grossAnnual: afterRaiseResult.grossAnnualPay,
        netAnnual: afterRaiseResult.netAnnualPay,
        netMonthly: afterRaiseResult.netAnnualPay / 12,
        effectiveTaxRate: afterRaiseResult.effectiveTotalRate,
        marginalTaxRate: afterRaiseResult.marginalTaxRate,
      },
      comparison: {
        grossIncrease,
        netIncrease,
        netMonthlyIncrease,
        grossIncreasePercent,
        netIncreasePercent,
        takeHomeRate,
        lostToTax,
      },
    };
  },
};
