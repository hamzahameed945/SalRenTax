import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { roundToCents } from '../../../core/math';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NlOverurenInput {
  /** Gross monthly salary in EUR. Used to derive the hourly wage: maandsalaris x 12 / 52 / urenPerWeek. */
  brutoMaandsalaris?: number;
  /** Contractual hours per week. Used to derive the hourly wage. */
  urenPerWeek?: number;
  /** Direct hourly wage in EUR. Overrides the derived value when provided. */
  uurloon?: number;
  /** Number of overtime hours. */
  overuren: number;
  /**
   * Premium percentage ON TOP of the normal hourly wage.
   * e.g. 25 -> uitbetaling tegen 125% (1.25x), 50 -> 1.5x, 100 -> dubbel (2x).
   */
  toeslagPercent: number;
}

export interface NlOverurenResult {
  /** Effective hourly wage used in the calculation (derived or entered directly). */
  uurloon: number;
  /** True when the hourly wage was derived from maandsalaris + urenPerWeek. */
  uurloonAfgeleid: boolean;
  /** Hourly overtime rate: uurloon x (1 + toeslagPercent / 100). */
  overurentarief: number;
  /** Normal pay component: uurloon x overuren. */
  basisComponent: number;
  /** Premium component: uurloon x (toeslagPercent / 100) x overuren. */
  toeslagComponent: number;
  /** Total gross overtime compensation. */
  brutoOverwerkvergoeding: number;
}

// ─── Engine ────────────────────────────────────────────────────────────────

export const nlOverurenEngine: CalculatorEngine<NlOverurenInput, NlOverurenResult, never> = {
  validate(input: NlOverurenInput): ValidationResult<NlOverurenInput> {
    const errors: Partial<Record<keyof NlOverurenInput, string>> = {};

    const direct = input.uurloon !== undefined && input.uurloon !== null && !Number.isNaN(input.uurloon);
    const hasSalary = input.brutoMaandsalaris !== undefined && input.brutoMaandsalaris !== null && !Number.isNaN(input.brutoMaandsalaris);
    const hasHours = input.urenPerWeek !== undefined && input.urenPerWeek !== null && !Number.isNaN(input.urenPerWeek);

    if (direct) {
      if (input.uurloon! <= 0) errors.uurloon = 'errors.mustBePositive';
    } else {
      if (!hasSalary || input.brutoMaandsalaris! <= 0) {
        errors.brutoMaandsalaris = 'errors.mustBePositive';
      }
      if (!hasHours || input.urenPerWeek! <= 0 || input.urenPerWeek! > 100) {
        errors.urenPerWeek = 'errors.invalidNumber';
      }
    }

    if (input.overuren === undefined || Number.isNaN(input.overuren) || input.overuren < 0) {
      errors.overuren = 'errors.invalidNumber';
    }

    if (
      input.toeslagPercent === undefined ||
      Number.isNaN(input.toeslagPercent) ||
      input.toeslagPercent < 0 ||
      input.toeslagPercent > 300
    ) {
      errors.toeslagPercent = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlOverurenInput): NlOverurenResult {
    const direct = input.uurloon !== undefined && input.uurloon !== null && !Number.isNaN(input.uurloon) && input.uurloon > 0;

    const uurloon = direct
      ? input.uurloon!
      : input.brutoMaandsalaris! * 12 / 52 / input.urenPerWeek!;

    const factor = 1 + input.toeslagPercent / 100;
    const overurentarief = uurloon * factor;
    const basisComponent = uurloon * input.overuren;
    const toeslagComponent = uurloon * (input.toeslagPercent / 100) * input.overuren;

    return {
      uurloon: roundToCents(uurloon),
      uurloonAfgeleid: !direct,
      overurentarief: roundToCents(overurentarief),
      basisComponent: roundToCents(basisComponent),
      toeslagComponent: roundToCents(toeslagComponent),
      brutoOverwerkvergoeding: roundToCents(overurentarief * input.overuren),
    };
  },
};
