import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';
import { brSalary2026 } from '../../../data/salary/br/brSalary2026';

export interface BrSalarioLiquidoInput { grossMonthly: number; }
export interface BrSalarioLiquidoResult {
  grossMonthly: number;
  inss: number;
  taxableIncome: number;
  irrf: number;
  netMonthly: number;
  effectiveTaxRate: number;
}

function calcInss(gross: number): number {
  let previous = 0;
  let total = 0;
  for (const bracket of brSalary2026.inss.brackets) {
    const upper = Math.min(gross, bracket.upTo);
    if (upper <= previous) continue;
    total += (upper - previous) * bracket.rate;
    previous = bracket.upTo;
    if (gross <= bracket.upTo) break;
  }
  return Math.min(total, brSalary2026.inss.ceiling * 0.14);
}

function calcIrrf(base: number, grossMonthly: number): number {
  const bracket = brSalary2026.irrf.brackets.find((b) => base <= b.upTo) ?? brSalary2026.irrf.brackets.at(-1)!;
  const taxBeforeReduction = Math.max(0, base * bracket.rate - bracket.deduction);
  let reduction = 0;
  if (grossMonthly <= brSalary2026.irrf.reductionForMonthlyIncome.fullExemptionUpTo) {
    reduction = taxBeforeReduction;
  } else if (grossMonthly <= brSalary2026.irrf.reductionForMonthlyIncome.phaseOutUpTo) {
    reduction = Math.max(0, Math.min(taxBeforeReduction, brSalary2026.irrf.reductionForMonthlyIncome.base - brSalary2026.irrf.reductionForMonthlyIncome.slope * grossMonthly));
  }
  return Math.max(0, taxBeforeReduction - reduction);
}

export const brSalarioLiquidoEngine: CalculatorEngine<BrSalarioLiquidoInput, BrSalarioLiquidoResult, never> = {
  validate(input): ValidationResult<BrSalarioLiquidoInput> {
    const errors: Partial<Record<keyof BrSalarioLiquidoInput, string>> = {};
    if (input.grossMonthly === undefined || Number.isNaN(input.grossMonthly)) errors.grossMonthly = 'errors.invalidNumber';
    else if (input.grossMonthly <= 0) errors.grossMonthly = 'errors.mustBePositive';
    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },
  calculate(input): BrSalarioLiquidoResult {
    const inss = calcInss(input.grossMonthly);
    const taxableIncome = Math.max(0, input.grossMonthly - Math.max(inss, brSalary2026.irrf.simplifiedDeduction));
    const irrf = calcIrrf(taxableIncome, input.grossMonthly);
    const netMonthly = input.grossMonthly - inss - irrf;
    return {
      grossMonthly: roundToCents(input.grossMonthly),
      inss: roundToCents(inss),
      taxableIncome: roundToCents(taxableIncome),
      irrf: roundToCents(irrf),
      netMonthly: roundToCents(netMonthly),
      effectiveTaxRate: input.grossMonthly > 0 ? (inss + irrf) / input.grossMonthly : 0,
    };
  },
};
