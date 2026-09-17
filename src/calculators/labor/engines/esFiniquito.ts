import type { CalculatorEngine, ValidationResult } from '../../core/types';

export type EsDismissalType = 'voluntary' | 'objectiveDismissal' | 'unfairDismissal';

export interface EsFiniquitoInput {
  /** Annual gross salary, EUR. */
  grossAnnual: number;
  /** Full years worked. */
  yearsWorked: number;
  /** Vacation days not yet taken. */
  daysHolidayPending: number;
  dismissalType: EsDismissalType;
}

export interface EsFiniquitoResult {
  proportionalPay: number;   // Parte proporcional pagas extra
  holidayPay: number;        // Vacaciones no disfrutadas
  severancePay: number;      // Indemnización (if applicable)
  totalFiniquito: number;
}

/**
 * Spanish finiquito / indemnización por despido estimator.
 * - Voluntary: only proportional extra pays + pending vacation
 * - Objective dismissal: 20 days per year of service (max 12 months)
 * - Unfair dismissal: 33 days per year of service (max 24 months)
 * Source: Estatuto de los Trabajadores Art. 53, 56; RDL 3/2012.
 */
export const esFiniquitoEngine: CalculatorEngine<EsFiniquitoInput, EsFiniquitoResult, never> = {
  validate(input: EsFiniquitoInput): ValidationResult<EsFiniquitoInput> {
    const errors: Partial<Record<keyof EsFiniquitoInput, string>> = {};

    if (!input.grossAnnual || Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    }

    if (!input.yearsWorked || Number.isNaN(input.yearsWorked) || input.yearsWorked < 0) {
      errors.yearsWorked = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: EsFiniquitoInput): EsFiniquitoResult {
    const dailyRate = input.grossAnnual / 365;

    // Proportional extra pays (approximation: 2 extra pays / 12 months, assume mid-year departure)
    const proportionalPay = (input.grossAnnual / 12) * 0.5; // ~half a monthly salary as approximation

    // Holiday pay: days not taken × daily rate
    const holidayPay = input.daysHolidayPending * dailyRate;

    // Severance (indemnización)
    let severancePay = 0;
    if (input.dismissalType === 'objectiveDismissal') {
      const cappedYears = Math.min(input.yearsWorked, 12); // max 12 months
      severancePay = 20 * dailyRate * cappedYears;
    } else if (input.dismissalType === 'unfairDismissal') {
      const cappedYears = Math.min(input.yearsWorked, 24); // max 24 months
      severancePay = 33 * dailyRate * cappedYears;
    }

    return {
      proportionalPay,
      holidayPay,
      severancePay,
      totalFiniquito: proportionalPay + holidayPay + severancePay,
    };
  },
};
