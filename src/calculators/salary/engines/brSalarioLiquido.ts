import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';
import { brSalary2026 } from '../../../data/salary/br/brSalary2026';

export interface BrSalarioLiquidoInput {
  grossMonthly: number;
  dependents?: number;
}

export interface BrSalarioLiquidoResult {
  grossMonthly: number;
  inss: number;
  inssPerBracket: { bracketLabel: string; taxableAmount: number; rate: number; inssOwed: number }[];
  dependents: number;
  dependentDeduction: number;
  taxableIncome: number;
  irrf: number;
  irrfPerBracket: { bracketLabel: string; taxableAmount: number; rate: number; taxOwed: number; deduction: number }[];
  irrfBeforeReduction: number;
  irrfReduction: number;
  netMonthly: number;
  effectiveTaxRate: number;
  takeHomePercentage: number;
}

function calcInss(gross: number): { total: number; perBracket: { bracketLabel: string; taxableAmount: number; rate: number; inssOwed: number }[] } {
  let previous = 0;
  let total = 0;
  const perBracket: { bracketLabel: string; taxableAmount: number; rate: number; inssOwed: number }[] = [];
  
  for (let i = 0; i < brSalary2026.inss.brackets.length; i++) {
    const bracket = brSalary2026.inss.brackets[i];
    const upper = Math.min(gross, bracket.upTo);
    if (upper <= previous) continue;
    
    const taxableInBracket = upper - previous;
    const inssInBracket = taxableInBracket * bracket.rate;
    
    if (taxableInBracket > 0) {
      perBracket.push({
        bracketLabel: `Faixa ${i + 1}`,
        taxableAmount: taxableInBracket,
        rate: bracket.rate,
        inssOwed: inssInBracket,
      });
      total += inssInBracket;
    }
    
    previous = bracket.upTo;
    if (gross <= bracket.upTo) break;
  }
  
  const finalTotal = Math.min(total, brSalary2026.inss.ceiling * 0.14);
  return { total: finalTotal, perBracket };
}

function calcIrrf(base: number, grossMonthly: number): {
  total: number;
  beforeReduction: number;
  reduction: number;
  perBracket: { bracketLabel: string; taxableAmount: number; rate: number; taxOwed: number; deduction: number }[];
} {
  const bracket = brSalary2026.irrf.brackets.find((b) => base <= b.upTo) ?? brSalary2026.irrf.brackets.at(-1)!;
  const bracketIndex = brSalary2026.irrf.brackets.findIndex((b) => base <= b.upTo);
  const finalIndex = bracketIndex === -1 ? brSalary2026.irrf.brackets.length - 1 : bracketIndex;
  
  const taxBeforeReduction = Math.max(0, base * bracket.rate - bracket.deduction);
  
  // Build per-bracket breakdown
  const perBracket: { bracketLabel: string; taxableAmount: number; rate: number; taxOwed: number; deduction: number }[] = [];
  
  if (base > 0) {
    perBracket.push({
      bracketLabel: `Faixa ${finalIndex + 1}`,
      taxableAmount: base,
      rate: bracket.rate,
      taxOwed: base * bracket.rate,
      deduction: bracket.deduction,
    });
  }
  
  let reduction = 0;
  if (grossMonthly <= brSalary2026.irrf.reductionForMonthlyIncome.fullExemptionUpTo) {
    reduction = taxBeforeReduction;
  } else if (grossMonthly <= brSalary2026.irrf.reductionForMonthlyIncome.phaseOutUpTo) {
    reduction = Math.max(0, Math.min(taxBeforeReduction, brSalary2026.irrf.reductionForMonthlyIncome.base - brSalary2026.irrf.reductionForMonthlyIncome.slope * grossMonthly));
  }
  
  return {
    total: Math.max(0, taxBeforeReduction - reduction),
    beforeReduction: taxBeforeReduction,
    reduction,
    perBracket,
  };
}

export const brSalarioLiquidoEngine: CalculatorEngine<BrSalarioLiquidoInput, BrSalarioLiquidoResult, never> = {
  validate(input): ValidationResult<BrSalarioLiquidoInput> {
    const errors: Partial<Record<keyof BrSalarioLiquidoInput, string>> = {};
    if (input.grossMonthly === undefined || (typeof input.grossMonthly === 'number' && Number.isNaN(input.grossMonthly))) errors.grossMonthly = 'errors.invalidNumber';
    else if (input.grossMonthly <= 0) errors.grossMonthly = 'errors.mustBePositive';
    
    if (input.dependents !== undefined) {
      if (typeof input.dependents === 'number' && Number.isNaN(input.dependents)) errors.dependents = 'errors.invalidNumber';
      else if (input.dependents < 0) errors.dependents = 'errors.mustBeNonNegative';
      else if (!Number.isInteger(input.dependents)) errors.dependents = 'errors.mustBeInteger';
    }
    
    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },
  calculate(input): BrSalarioLiquidoResult {
    const dependents = input.dependents ?? 0;
    const dependentDeduction = dependents * brSalary2026.irrf.dependentDeduction;
    
    const inssResult = calcInss(input.grossMonthly);
    const inss = inssResult.total;
    
    // Taxable income = gross - INSS - dependent deductions, or use simplified deduction if higher
    const baseAfterInss = Math.max(0, input.grossMonthly - inss - dependentDeduction);
    const baseWithSimplified = Math.max(0, input.grossMonthly - Math.max(inss, brSalary2026.irrf.simplifiedDeduction));
    const taxableIncome = Math.max(baseAfterInss, baseWithSimplified);
    
    const irrfResult = calcIrrf(taxableIncome, input.grossMonthly);
    const irrf = irrfResult.total;
    
    const netMonthly = input.grossMonthly - inss - irrf;
    
    return {
      grossMonthly: roundToCents(input.grossMonthly),
      inss: roundToCents(inss),
      inssPerBracket: inssResult.perBracket.map(b => ({
        ...b,
        taxableAmount: roundToCents(b.taxableAmount),
        inssOwed: roundToCents(b.inssOwed),
      })),
      dependents,
      dependentDeduction: roundToCents(dependentDeduction),
      taxableIncome: roundToCents(taxableIncome),
      irrf: roundToCents(irrf),
      irrfPerBracket: irrfResult.perBracket.map(b => ({
        ...b,
        taxableAmount: roundToCents(b.taxableAmount),
        taxOwed: roundToCents(b.taxOwed),
        deduction: roundToCents(b.deduction),
      })),
      irrfBeforeReduction: roundToCents(irrfResult.beforeReduction),
      irrfReduction: roundToCents(irrfResult.reduction),
      netMonthly: roundToCents(netMonthly),
      effectiveTaxRate: input.grossMonthly > 0 ? (inss + irrf) / input.grossMonthly : 0,
      takeHomePercentage: input.grossMonthly > 0 ? netMonthly / input.grossMonthly : 0,
    };
  },
};
