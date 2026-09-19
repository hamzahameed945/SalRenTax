import type { CalculatorEngine, ValidationResult } from '../../core/types';

export type MxDismissalType = 'voluntary' | 'justifiedDismissal' | 'unjustifiedDismissal';

export interface MxFiniquitoInput {
  /** Daily integrated salary (salario diario integrado), MXN. */
  dailyWage: number;
  /** Complete years worked. */
  yearsWorked: number;
  /** Vacation days pending. */
  daysVacationPending: number;
  /** Calendar months worked in the current year (1–12). */
  monthsWorkedThisYear: number;
  dismissalType: MxDismissalType;
}

export interface MxFiniquitoResult {
  proportionalBonus: number;     // Aguinaldo proporcional (15 days/year)
  proportionalVacations: number; // Vacaciones proporcionales
  vacationBonus: number;         // Prima vacacional (25% of vacation pay)
  severancePay: number;          // Indemnización constitucional (90 days)
  additionalSeverance: number;   // 20 days/year for unjustified dismissal (simplified)
  seniorityPremium: number;      // Prima de antigüedad (12 days/year × daily wage capped at 2×SMG)
  totalLiquidacion: number;
}

/**
 * Mexican finiquito / liquidación laboral estimator.
 * Source: Ley Federal del Trabajo (LFT) Arts. 76, 87, 162, 500.
 * - Voluntary: aguinaldo proporcional + vacaciones + prima vacacional
 * - Unjustified dismissal: + 90-day severance + seniority premium
 */
export const mxFiniquitoEngine: CalculatorEngine<MxFiniquitoInput, MxFiniquitoResult, never> = {
  validate(input: MxFiniquitoInput): ValidationResult<MxFiniquitoInput> {
    const errors: Partial<Record<keyof MxFiniquitoInput, string>> = {};

    if (!input.dailyWage || Number.isNaN(input.dailyWage)) {
      errors.dailyWage = 'errors.invalidNumber';
    } else if (input.dailyWage <= 0) {
      errors.dailyWage = 'errors.mustBePositive';
    }

    if (input.yearsWorked === undefined || Number.isNaN(input.yearsWorked) || input.yearsWorked < 0) {
      errors.yearsWorked = 'errors.invalidNumber';
    }
    if (input.daysVacationPending === undefined || Number.isNaN(input.daysVacationPending) || input.daysVacationPending < 0 || input.daysVacationPending > 60) {
      errors.daysVacationPending = 'errors.invalidNumber';
    }
    if (input.monthsWorkedThisYear === undefined || Number.isNaN(input.monthsWorkedThisYear) || input.monthsWorkedThisYear < 1 || input.monthsWorkedThisYear > 12) {
      errors.monthsWorkedThisYear = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: MxFiniquitoInput): MxFiniquitoResult {
    const { dailyWage, yearsWorked, daysVacationPending, monthsWorkedThisYear, dismissalType } = input;

    // Aguinaldo proporcional: 15 statutory days, prorated by months worked this year.
    const proportionalBonus = dailyWage * 15 * (monthsWorkedThisYear / 12);

    // Proportional vacations
    const proportionalVacations = dailyWage * daysVacationPending;

    // Prima vacacional: 25% of proportional vacation pay
    const vacationBonus = proportionalVacations * 0.25;

    // Constitutional severance (3 months): only for unjustified dismissal
    const severancePay = dismissalType === 'unjustifiedDismissal' ? dailyWage * 90 : 0;
    const additionalSeverance = dismissalType === 'unjustifiedDismissal' ? dailyWage * 20 * yearsWorked : 0;

    // Seniority premium: 12 days per year, only for unjustified dismissal or voluntary after 15 years
    const seniorityPremium =
      dismissalType === 'unjustifiedDismissal' || (dismissalType === 'voluntary' && yearsWorked >= 15)
        ? dailyWage * 12 * yearsWorked
        : 0;

    const totalLiquidacion =
      proportionalBonus + proportionalVacations + vacationBonus + severancePay + additionalSeverance + seniorityPremium;

    return {
      proportionalBonus,
      proportionalVacations,
      vacationBonus,
      severancePay,
      seniorityPremium,
      additionalSeverance,
      totalLiquidacion,
    };
  },
};
