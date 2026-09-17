import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  irpfStateBrackets2026,
  minimoPersonal2026,
  seguridadSocial2026,
} from '../../../../data/salary/es/spainPayrollData2026';

export interface SpainSalaryInput {
  /** Annual gross salary, EUR. */
  grossAnnual: number;
  /** Number of pay periods per year (12 standard, or 14 with extra "pagas"). */
  paymentsPerYear: 12 | 14;
}

export interface SpainSalaryResult {
  grossAnnual: number;
  grossPerPayment: number;
  irpfStateAnnual: number;
  irpfEffectiveStateRate: number;
  seguridadSocialAnnual: number;
  netAnnual: number;
  netPerPayment: number;
  /** State IRPF only — autonomous-community portion not included. */
  stateIrpfOnly: true;
  /** Formación Profesional not included. */
  formacionProfesionalExcluded: true;
}

export const spainSalaryEngine: CalculatorEngine<SpainSalaryInput, SpainSalaryResult, never> = {
  validate(input: SpainSalaryInput): ValidationResult<SpainSalaryInput> {
    const errors: Partial<Record<keyof SpainSalaryInput, string>> = {};

    if (!input.grossAnnual || Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    }

    if (input.paymentsPerYear !== 12 && input.paymentsPerYear !== 14) {
      errors.paymentsPerYear = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: SpainSalaryInput): SpainSalaryResult {
    const gross = input.grossAnnual;

    const ssBaseAnnualCap = seguridadSocial2026.baseMaximaCotizacionMonthly * input.paymentsPerYear;
    const ssBase = Math.min(gross, ssBaseAnnualCap);
    const seguridadSocialAnnual =
      ssBase *
      (seguridadSocial2026.contingenciasComunesEmployeeRate +
        seguridadSocial2026.desempleoEmployeeRate +
        seguridadSocial2026.meiEmployeeRate);

    const irpfTaxableBase = Math.max(0, gross - seguridadSocialAnnual - minimoPersonal2026);
    const { totalTax: irpfStateAnnual, effectiveRate: irpfEffectiveStateRate } =
      calculateProgressiveTax(irpfTaxableBase, irpfStateBrackets2026);

    const netAnnual = gross - seguridadSocialAnnual - irpfStateAnnual;

    return {
      grossAnnual: gross,
      grossPerPayment: gross / input.paymentsPerYear,
      irpfStateAnnual,
      irpfEffectiveStateRate,
      seguridadSocialAnnual,
      netAnnual,
      netPerPayment: netAnnual / input.paymentsPerYear,
      stateIrpfOnly: true,
      formacionProfesionalExcluded: true,
    };
  },
};
