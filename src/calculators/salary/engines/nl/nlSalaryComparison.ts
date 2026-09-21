import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { nlBruttoNettoEngine, type NlBruttoNettoBreakdown } from './nlBruttoNetto';

/**
 * Netherlands salary comparison calculator
 * Compares multiple salary scenarios side-by-side (e.g., with/without 30% ruling, different ages)
 */

export interface NlSalaryComparisonScenario {
  label: string;
  grossAnnual: number;
  age?: number;
  thirtyPercentRuling?: boolean;
  includeVakantiegeld?: boolean;
  iackEligible?: boolean;
  bornBefore1946?: boolean;
}

export interface NlSalaryComparisonInput {
  scenarios: NlSalaryComparisonScenario[];
  payPeriod?: 'annual' | 'monthly' | 'fourweekly' | 'weekly';
}

export interface NlSalaryComparisonResult {
  scenarios: Array<{
    label: string;
    result: NlBruttoNettoBreakdown;
    differences?: {
      grossDiff: number;
      box1TaxDiff: number;
      creditsDiff: number;
      netAnnualDiff: number;
      netMonthlyDiff: number;
      effectiveRateDiff: number;
      thirtyPctSavings?: number;
    };
  }>;
  /** Comparison to first scenario (baseline) */
  baselineLabel: string;
}

export const nlSalaryComparisonEngine: CalculatorEngine<NlSalaryComparisonInput, NlSalaryComparisonResult, never> = {
  validate(input): ValidationResult<NlSalaryComparisonInput> {
    const errors: Partial<Record<keyof NlSalaryComparisonInput | string, string>> = {};
    
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
      const validation = nlBruttoNettoEngine.validate({
        grossAnnual: scenario.grossAnnual,
        age: scenario.age,
        thirtyPercentRuling: scenario.thirtyPercentRuling,
        includeVakantiegeld: scenario.includeVakantiegeld,
        iackEligible: scenario.iackEligible,
        bornBefore1946: scenario.bornBefore1946,
        payPeriod: input.payPeriod,
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

  calculate(input: NlSalaryComparisonInput, _config: never, year: number): NlSalaryComparisonResult {
    const payPeriod = input.payPeriod ?? 'monthly';
    
    const results = input.scenarios.map((scenario, index) => {
      const result = nlBruttoNettoEngine.calculate({
        grossAnnual: scenario.grossAnnual,
        age: scenario.age,
        thirtyPercentRuling: scenario.thirtyPercentRuling,
        includeVakantiegeld: scenario.includeVakantiegeld,
        iackEligible: scenario.iackEligible,
        bornBefore1946: scenario.bornBefore1946,
        payPeriod,
      }, _config, year);
      
      // Calculate differences from baseline (first scenario)
      let differences: {
        grossDiff: number;
        box1TaxDiff: number;
        creditsDiff: number;
        netAnnualDiff: number;
        netMonthlyDiff: number;
        effectiveRateDiff: number;
        thirtyPctSavings?: number;
      } | undefined;
      if (index > 0) {
        const baseline = nlBruttoNettoEngine.calculate({
          grossAnnual: input.scenarios[0].grossAnnual,
          age: input.scenarios[0].age,
          thirtyPercentRuling: input.scenarios[0].thirtyPercentRuling,
          includeVakantiegeld: input.scenarios[0].includeVakantiegeld,
          iackEligible: input.scenarios[0].iackEligible,
          bornBefore1946: input.scenarios[0].bornBefore1946,
          payPeriod,
        }, _config, year);
        
        differences = {
          grossDiff: result.grossTotal - baseline.grossTotal,
          box1TaxDiff: result.box1TaxRaw - baseline.box1TaxRaw,
          creditsDiff: result.totalCredits - baseline.totalCredits,
          netAnnualDiff: result.netAnnual - baseline.netAnnual,
          netMonthlyDiff: result.netMonthly - baseline.netMonthly,
          effectiveRateDiff: result.effectiveRate - baseline.effectiveRate,
        };
        
        // Calculate 30% ruling savings if applicable
        if (scenario.thirtyPercentRuling && !input.scenarios[0].thirtyPercentRuling) {
          differences.thirtyPctSavings = result.netAnnual - baseline.netAnnual;
        }
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
