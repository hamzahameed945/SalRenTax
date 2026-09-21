import type { CalculatorEngine, ValidationResult } from '../../core/types';
import {
  primaAntiguedadTopeDiario2026,
  vacacionesMinimas,
  umaDaily2026,
} from '../../../data/salary/mx/mexicoPayrollData2026';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MxDismissalType = 'voluntary' | 'justifiedDismissal' | 'unjustifiedDismissal';

export interface MxFiniquitoInput {
  /** Salario diario integrado (SDI), MXN. */
  dailyWage: number;
  /** Complete years worked (años de servicio). */
  yearsWorked: number;
  /**
   * Pending vacation days.
   * If omitted the engine calculates the statutory minimum per LFT Art. 76 (2023).
   */
  daysVacationPending?: number;
  /** Calendar months worked in the current year (1–12). */
  monthsWorkedThisYear: number;
  dismissalType: MxDismissalType;
}

export interface MxFiniquitoResult {
  // ── Basic entitlements (owed in ALL scenarios) ───────────────────────
  /** Aguinaldo proporcional (15 statutory days pro-rated). */
  proportionalBonus: number;
  /** Vacaciones pendientes en días. */
  vacationDaysUsed: number;
  /** Pago de vacaciones pendientes. */
  proportionalVacations: number;
  /** Prima vacacional (25% of vacation pay). */
  vacationBonus: number;
  /** Subtotal: entitlements owed in all cases. */
  subtotalBasic: number;

  // ── Dismissal-specific entitlements ─────────────────────────────────
  /** Indemnización constitucional: 90 días (only unjustified dismissal). */
  severancePay: number;
  /** 20 días/año de servicio (only unjustified dismissal). */
  additionalSeverance: number;
  /** Prima de antigüedad (12 días/año, capped at 2×SMG daily wage). */
  seniorityPremium: number;
  /** Daily wage used for prima de antigüedad (min of SDI, UMA cap). */
  seniorityDailyWageCapped: number;
  /** Whether the UMA cap was applied. */
  umaCapApplied: boolean;

  // ── ISR exemption note ───────────────────────────────────────────────
  /**
   * Approximate ISR-exempt portion of indemnización per Art. 93 LISR.
   * Exempt: up to 90 days of SMG per year of service (informational only).
   */
  isrExemptEstimate: number;

  totalLiquidacion: number;
  /** Statutory minimum vacation days for the years worked (LFT Art. 76, 2023). */
  statutoryVacationDays: number;
}

// ─── Engine ─────────────────────────────────────────────────────────────────

export const mxFiniquitoEngine: CalculatorEngine<MxFiniquitoInput, MxFiniquitoResult, never> = {
  validate(input: MxFiniquitoInput): ValidationResult<MxFiniquitoInput> {
    const errors: Partial<Record<keyof MxFiniquitoInput, string>> = {};

    if (!input.dailyWage || typeof input.dailyWage === 'number' && Number.isNaN(input.dailyWage)) {
      errors.dailyWage = 'errors.invalidNumber';
    } else if (input.dailyWage <= 0) {
      errors.dailyWage = 'errors.mustBePositive';
    }

    if (input.yearsWorked === undefined || typeof input.yearsWorked === 'number' && Number.isNaN(input.yearsWorked) || input.yearsWorked < 0) {
      errors.yearsWorked = 'errors.invalidNumber';
    }

    if (
      input.daysVacationPending !== undefined &&
      (typeof input.daysVacationPending === 'number' && Number.isNaN(input.daysVacationPending) || input.daysVacationPending < 0 || input.daysVacationPending > 365)
    ) {
      errors.daysVacationPending = 'errors.invalidNumber';
    }

    if (
      input.monthsWorkedThisYear === undefined ||
      typeof input.monthsWorkedThisYear === 'number' && Number.isNaN(input.monthsWorkedThisYear) ||
      input.monthsWorkedThisYear < 1 ||
      input.monthsWorkedThisYear > 12
    ) {
      errors.monthsWorkedThisYear = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: MxFiniquitoInput): MxFiniquitoResult {
    const { dailyWage, yearsWorked, monthsWorkedThisYear, dismissalType } = input;

    // ── 1. Statutory vacation days per LFT Art. 76 (2023 reform) ───────
    const completedYears    = Math.floor(yearsWorked);
    const statutoryVacDays  = vacacionesMinimas(completedYears);
    // Use user-provided days if given; fall back to statutory minimum
    const vacationDaysUsed  =
      input.daysVacationPending !== undefined
        ? input.daysVacationPending
        : statutoryVacDays;

    // ── 2. Basic entitlements (all dismissal types) ─────────────────────
    // Aguinaldo proporcional: 15 días × meses/12 (Art. 87 LFT)
    const proportionalBonus     = dailyWage * 15 * (monthsWorkedThisYear / 12);
    // Vacaciones pendientes
    const proportionalVacations = dailyWage * vacationDaysUsed;
    // Prima vacacional: 25% (Art. 80 LFT minimum)
    const vacationBonus         = proportionalVacations * 0.25;
    const subtotalBasic         = proportionalBonus + proportionalVacations + vacationBonus;

    // ── 3. Dismissal-specific ────────────────────────────────────────────
    const isUnjustified = dismissalType === 'unjustifiedDismissal';

    // Indemnización constitucional: 90 días (Art. 50 LFT)
    const severancePay = isUnjustified ? dailyWage * 90 : 0;

    // 20 días/año adicionales (Art. 50 LFT)
    const additionalSeverance = isUnjustified ? dailyWage * 20 * yearsWorked : 0;

    // Prima de antigüedad: 12 días/año — applies to unjustified dismissal
    // OR voluntary resignation after 15+ years (Art. 162 LFT).
    // IMPORTANT: daily wage is CAPPED at 2× salario mínimo general diario.
    const seniorityApplies =
      isUnjustified || (dismissalType === 'voluntary' && yearsWorked >= 15);

    const seniorityDailyWageCapped = Math.min(dailyWage, primaAntiguedadTopeDiario2026);
    const umaCapApplied            = dailyWage > primaAntiguedadTopeDiario2026;
    const seniorityPremium         = seniorityApplies
      ? seniorityDailyWageCapped * 12 * yearsWorked
      : 0;

    // ── 4. ISR exemption estimate (Art. 93 LISR) ────────────────────────
    // Exempt: up to 90 UMAs diarias × years worked (informational, not deducted).
    const isrExemptEstimate = isUnjustified
      ? Math.min(
          severancePay + additionalSeverance,
          umaDaily2026 * 90 * yearsWorked,
        )
      : 0;

    const totalLiquidacion =
      subtotalBasic + severancePay + additionalSeverance + seniorityPremium;

    return {
      proportionalBonus,
      vacationDaysUsed,
      proportionalVacations,
      vacationBonus,
      subtotalBasic,
      severancePay,
      additionalSeverance,
      seniorityPremium,
      seniorityDailyWageCapped,
      umaCapApplied,
      isrExemptEstimate,
      totalLiquidacion,
      statutoryVacationDays: statutoryVacDays,
    };
  },
};
