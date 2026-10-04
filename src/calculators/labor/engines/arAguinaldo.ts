import type { CalculatorEngine, ValidationResult } from '../../core/types';

export interface ArAguinaldoInput {
  /** Best monthly salary of the semester (mejor sueldo mensual del semestre), ARS. */
  mejorSueldo: number;
  /** Days worked in the semester (1–180). */
  diasTrabajados: number;
}

export interface ArAguinaldoResult {
  mejorSueldo: number;
  diasTrabajados: number;
  /** Full second installment (cuota completa): mejorSueldo / 2. */
  cuotaCompleta: number;
  /** Proportional amount actually due. */
  aguinaldoBruto: number;
}

/**
 * Argentine aguinaldo — Sueldo Anual Complementario (SAC), second installment.
 * Source: Ley 23.073 — SAC = 50% of the best monthly salary of each semester,
 * proportional to days worked; second installment payable by December 18.
 * - Cuota completa = mejorSueldo / 2
 * - Aguinaldo bruto = cuotaCompleta × (diasTrabajados / 180)
 * Note: SAC is subject to Impuesto a las Ganancias withholding in practice;
 * this calculator returns the gross (bruto) amount only.
 */
export const arAguinaldoEngine: CalculatorEngine<ArAguinaldoInput, ArAguinaldoResult, never> = {
  validate(input: ArAguinaldoInput): ValidationResult<ArAguinaldoInput> {
    const errors: Partial<Record<keyof ArAguinaldoInput, string>> = {};

    if (!input.mejorSueldo || Number.isNaN(input.mejorSueldo) || input.mejorSueldo <= 0) {
      errors.mejorSueldo = 'errors.mustBePositive';
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

  calculate(input: ArAguinaldoInput): ArAguinaldoResult {
    const cuotaCompleta = input.mejorSueldo / 2;
    const aguinaldoBruto = cuotaCompleta * (input.diasTrabajados / 180);

    return {
      mejorSueldo: input.mejorSueldo,
      diasTrabajados: input.diasTrabajados,
      cuotaCompleta,
      aguinaldoBruto,
    };
  },
};
