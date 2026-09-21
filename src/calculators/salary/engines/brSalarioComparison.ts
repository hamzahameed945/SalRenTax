import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { brSalarioLiquidoEngine, type BrSalarioLiquidoResult } from './brSalarioLiquido';

/**
 * Brazil salary comparison calculator
 * Compares multiple salary scenarios side-by-side (e.g., current vs. raise, different dependent counts)
 */

export interface BrSalarioComparisonScenario {
  label: string;
  grossMonthly: number;
  dependents?: number;
}

export interface BrSalarioComparisonInput {
  scenarios: BrSalarioComparisonScenario[];
}

export interface BrSalarioComparisonResult {
  scenarios: Array<{
    label: string;
    result: BrSalarioLiquidoResult;
    differences?: {
      grossDiff: number;
      inssDiff: number;
      irrfDiff: number;
      netDiff: number;
      effectiveRateDiff: number;
    };
  }>;
  /** Comparison to first scenario (baseline) */
  baselineLabel: string;
}

export const brSalarioComparisonEngine: CalculatorEngine<BrSalarioComparisonInput, BrSalarioComparisonResult, never> = {
  validate(input): ValidationResult<BrSalarioComparisonInput> {
    const errors: Partial<Record<keyof BrSalarioComparisonInput | string, string>> = {};
    
    if (!input.scenarios || !Array.isArray(input.scenarios)) {
      errors.scenarios = 'errors.invalidScenarios';
      return { valid: false, errors };
    }
    
    if (input.scenarios.length < 1) {
      errors.scenarios = 'errors.atLeastOneScenario';
      return { valid: false, errors };
    }
    
    if (input.scenarios.length > 5) {
      errors.scenarios = 'errors.tooManyScenarios';
      return { valid: false, errors };
    }
    
    // Validate each scenario
    for (let i = 0; i < input.scenarios.length; i++) {
      const scenario = input.scenarios[i];
      const validation = brSalarioLiquidoEngine.validate({
        grossMonthly: scenario.grossMonthly,
        dependents: scenario.dependents,
      });
      
      if (!validation.valid) {
        // Flatten the per-field errors into one message key list so it fits the string-typed errors map.
        errors[`scenario_${i}`] = Object.values(validation.errors)
          .filter((message): message is string => typeof message === 'string')
          .join(', ');
      }
    }
    
    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: BrSalarioComparisonInput, _config: never, year: number): BrSalarioComparisonResult {
    const results = input.scenarios.map((scenario, index) => {
      const result = brSalarioLiquidoEngine.calculate({
        grossMonthly: scenario.grossMonthly,
        dependents: scenario.dependents,
      }, _config, year);
      
      // Calculate differences from baseline (first scenario)
      let differences;
      if (index > 0) {
        const baseline = brSalarioLiquidoEngine.calculate({
          grossMonthly: input.scenarios[0].grossMonthly,
          dependents: input.scenarios[0].dependents,
        }, _config, year);
        
        differences = {
          grossDiff: result.grossMonthly - baseline.grossMonthly,
          inssDiff: result.inss - baseline.inss,
          irrfDiff: result.irrf - baseline.irrf,
          netDiff: result.netMonthly - baseline.netMonthly,
          effectiveRateDiff: result.effectiveTaxRate - baseline.effectiveTaxRate,
        };
      }
      
      return {
        label: scenario.label,
        result,
        differences,
      };
    });
    
    return {
      scenarios: results,
      baselineLabel: input.scenarios[0].label,
    };
  },
};
