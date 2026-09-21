import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { brSalarioLiquidoEngine, type BrSalarioLiquidoResult } from './brSalarioLiquido';
import { roundToCents } from '../../core/math';

/**
 * Brazil salary raise simulator
 * Shows impact of salary raises accounting for progressive taxation
 */

export interface BrRaiseSimulatorInput {
  currentGrossMonthly: number;
  raisePercentage: number;
  dependents?: number;
}

export interface BrRaiseSimulatorResult {
  current: {
    grossMonthly: number;
    netMonthly: number;
    effectiveTaxRate: number;
    fullResult: BrSalarioLiquidoResult;
  };
  afterRaise: {
    grossMonthly: number;
    netMonthly: number;
    effectiveTaxRate: number;
    fullResult: BrSalarioLiquidoResult;
  };
  changes: {
    grossIncreaseAmount: number;
    grossIncreasePercentage: number;
    netIncreaseAmount: number;
    netIncreasePercentage: number;
    inssIncreaseAmount: number;
    irrfIncreaseAmount: number;
    effectiveTaxRateChange: number;
    /** How much of each additional R$1 of raise you keep after taxes */
    marginalTakeHomeRate: number;
  };
  annual: {
    currentGrossAnnual: number;
    afterRaiseGrossAnnual: number;
    currentNetAnnual: number;
    afterRaiseNetAnnual: number;
    netAnnualIncrease: number;
  };
}

export const brRaiseSimulatorEngine: CalculatorEngine<BrRaiseSimulatorInput, BrRaiseSimulatorResult, never> = {
  validate(input): ValidationResult<BrRaiseSimulatorInput> {
    const errors: Partial<Record<keyof BrRaiseSimulatorInput, string>> = {};
    
    if (input.currentGrossMonthly === undefined || (typeof input.currentGrossMonthly === 'number' && Number.isNaN(input.currentGrossMonthly))) {
      errors.currentGrossMonthly = 'errors.invalidNumber';
    } else if (input.currentGrossMonthly <= 0) {
      errors.currentGrossMonthly = 'errors.mustBePositive';
    }
    
    if (input.raisePercentage === undefined || (typeof input.raisePercentage === 'number' && Number.isNaN(input.raisePercentage))) {
      errors.raisePercentage = 'errors.invalidNumber';
    } else if (input.raisePercentage < 0) {
      errors.raisePercentage = 'errors.mustBeNonNegative';
    } else if (input.raisePercentage > 200) {
      errors.raisePercentage = 'errors.tooHigh';
    }
    
    if (input.dependents !== undefined) {
      if (typeof input.dependents === 'number' && Number.isNaN(input.dependents)) errors.dependents = 'errors.invalidNumber';
      else if (input.dependents < 0) errors.dependents = 'errors.mustBeNonNegative';
      else if (!Number.isInteger(input.dependents)) errors.dependents = 'errors.mustBeInteger';
    }
    
    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: BrRaiseSimulatorInput, _config: never, year: number): BrRaiseSimulatorResult {
    const currentResult = brSalarioLiquidoEngine.calculate({
      grossMonthly: input.currentGrossMonthly,
      dependents: input.dependents,
    }, _config, year);
    
    const newGrossMonthly = input.currentGrossMonthly * (1 + input.raisePercentage / 100);
    const afterRaiseResult = brSalarioLiquidoEngine.calculate({
      grossMonthly: newGrossMonthly,
      dependents: input.dependents,
    }, _config, year);
    
    const grossIncrease = newGrossMonthly - input.currentGrossMonthly;
    const netIncrease = afterRaiseResult.netMonthly - currentResult.netMonthly;
    const marginalTakeHomeRate = grossIncrease > 0 ? netIncrease / grossIncrease : 0;
    
    return {
      current: {
        grossMonthly: currentResult.grossMonthly,
        netMonthly: currentResult.netMonthly,
        effectiveTaxRate: currentResult.effectiveTaxRate,
        fullResult: currentResult,
      },
      afterRaise: {
        grossMonthly: afterRaiseResult.grossMonthly,
        netMonthly: afterRaiseResult.netMonthly,
        effectiveTaxRate: afterRaiseResult.effectiveTaxRate,
        fullResult: afterRaiseResult,
      },
      changes: {
        grossIncreaseAmount: roundToCents(grossIncrease),
        grossIncreasePercentage: input.raisePercentage,
        netIncreaseAmount: roundToCents(netIncrease),
        netIncreasePercentage: currentResult.netMonthly > 0
          ? (netIncrease / currentResult.netMonthly) * 100
          : 0,
        inssIncreaseAmount: roundToCents(afterRaiseResult.inss - currentResult.inss),
        irrfIncreaseAmount: roundToCents(afterRaiseResult.irrf - currentResult.irrf),
        effectiveTaxRateChange: afterRaiseResult.effectiveTaxRate - currentResult.effectiveTaxRate,
        marginalTakeHomeRate,
      },
      annual: {
        currentGrossAnnual: roundToCents(currentResult.grossMonthly * 12),
        afterRaiseGrossAnnual: roundToCents(afterRaiseResult.grossMonthly * 12),
        currentNetAnnual: roundToCents(currentResult.netMonthly * 12),
        afterRaiseNetAnnual: roundToCents(afterRaiseResult.netMonthly * 12),
        netAnnualIncrease: roundToCents(netIncrease * 12),
      },
    };
  },
};
