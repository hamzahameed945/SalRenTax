import type { CalculatorEngine, ValidationResult } from '../../core/types';

export interface CoPrimaServiciosInput {
  /** Monthly salary (salario mensual), COP. */
  salarioMensual: number;
  /** Days worked July–December (1–180). */
  diasTrabajados: number;
}

export interface CoPrimaServiciosResult {
  salarioMensual: number;
  diasTrabajados: number;
  /** Full December installment (cuota completa): salarioMensual / 2. */
  cuotaCompleta: number;
  /** Proportional amount actually due. */
  primaBruta: number;
}

/**
 * Colombian prima de servicios — December installment.
 * Source: Código Sustantivo del Trabajo, Art. 306 — one full monthly salary
 * per year paid in two installments (June 30 and December 20); the December
 * installment covers days worked July–December.
 * - Cuota completa = salarioMensual / 2
 * - Prima bruta = cuotaCompleta × (diasTrabajados / 180)
 */
export const coPrimaServiciosEngine: CalculatorEngine<CoPrimaServiciosInput, CoPrimaServiciosResult, never> = {
  validate(input: CoPrimaServiciosInput): ValidationResult<CoPrimaServiciosInput> {
    const errors: Partial<Record<keyof CoPrimaServiciosInput, string>> = {};

    if (!input.salarioMensual || Number.isNaN(input.salarioMensual) || input.salarioMensual <= 0) {
      errors.salarioMensual = 'errors.mustBePositive';
    }
    if (
      input.diasTrabajados === undefined ||
      Number.isNaN(input.diasTrabajados) ||
      input.diasTrabajados < 1 ||
      input.diasTrabajados > 180
    ) {
      errors.diasTrabajados = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: CoPrimaServiciosInput): CoPrimaServiciosResult {
    const cuotaCompleta = input.salarioMensual / 2;
    const primaBruta = cuotaCompleta * (input.diasTrabajados / 180);

    return {
      salarioMensual: input.salarioMensual,
      diasTrabajados: input.diasTrabajados,
      cuotaCompleta,
      primaBruta,
    };
  },
};
