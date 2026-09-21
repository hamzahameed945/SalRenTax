import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { nlMinimumloon2026, NL_VAKANTIEGELD_RATE } from '../../../../data/salary/nl/nlTaxData2026';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NlMinimumloonInput {
  /** Gross hourly rate entered by the user to check against minimum wage. */
  hourlyRate?: number;
  /** Gross monthly salary to check against minimum wage. */
  monthlySalary?: number;
  /** Hours worked per week (default 40 — the reference week). */
  hoursPerWeek?: number;
  /** Age of the worker — minimum wage fully applies from age 21+. */
  age?: number;
}

export interface NlMinimumloonResult {
  /** Reference minimum wage figures for 2026. */
  minimumHourly: number;
  minimumMonthly: number;
  minimumAnnual: number;
  /** User's own hourly rate (if provided). */
  userHourly: number | null;
  /** User's own monthly salary (if provided). */
  userMonthly: number | null;
  /** Whether the user's pay meets the minimum wage. */
  meetsMinimum: boolean;
  /** Shortfall below minimum (positive = underpaid, 0 = OK). */
  shortfallHourly: number;
  shortfallMonthly: number;
  /** Annual gross at minimum wage for the chosen hours/week. */
  minimumAnnualForHours: number;
  /** Vakantiegeld on top of minimum annual. */
  minimumVakantiegeld: number;
  /** Total package at minimum wage incl. vakantiegeld. */
  minimumTotalPackage: number;
  hoursPerWeek: number;
}

// ─── Youth minimum wage multipliers (percentage of adult minimum) ──────────
// SOURCE: Rijksoverheid — Minimumjeugdloon 2026
// From age 21 onward: 100%. Below: stepped table.
const youthMultipliers: Record<number, number> = {
  15: 0.40, 16: 0.47, 17: 0.54,
  18: 0.61, 19: 0.726, 20: 0.855,
};

function getMultiplier(age: number | undefined): number {
  if (age === undefined || age >= 21) return 1.0;
  return youthMultipliers[Math.min(20, Math.max(15, age))] ?? 1.0;
}

// ─── Engine ────────────────────────────────────────────────────────────────

export const nlMinimumloonEngine: CalculatorEngine<NlMinimumloonInput, NlMinimumloonResult, never> = {
  validate(input: NlMinimumloonInput): ValidationResult<NlMinimumloonInput> {
    const errors: Partial<Record<keyof NlMinimumloonInput, string>> = {};

    if (input.hourlyRate !== undefined && (typeof input.hourlyRate === 'number' && Number.isNaN(input.hourlyRate) || input.hourlyRate < 0)) {
      errors.hourlyRate = 'errors.invalidNumber';
    }
    if (input.monthlySalary !== undefined && (typeof input.monthlySalary === 'number' && Number.isNaN(input.monthlySalary) || input.monthlySalary < 0)) {
      errors.monthlySalary = 'errors.invalidNumber';
    }
    const hrs = input.hoursPerWeek ?? 40;
    if (typeof hrs === 'number' && Number.isNaN(hrs) || hrs < 1 || hrs > 60) {
      errors.hoursPerWeek = 'errors.invalidHours';
    }
    if (input.age !== undefined && (typeof input.age === 'number' && Number.isNaN(input.age) || input.age < 15 || input.age > 100)) {
      errors.age = 'errors.invalidAge';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: NlMinimumloonInput): NlMinimumloonResult {
    const { hourlyRate, monthlySalary, hoursPerWeek = 40, age } = input;
    const multiplier = getMultiplier(age);

    // Minimum hourly for this worker's age
    const minimumHourly = nlMinimumloon2026.hourlyGross * multiplier;
    // Scale minimum monthly/annual to actual hours vs 40h reference week
    const minimumAnnualForHours = minimumHourly * hoursPerWeek * 52;
    const minimumMonthly = minimumAnnualForHours / 12;
    const minimumAnnual = minimumHourly * nlMinimumloon2026.weeklyHours * 52;
    const minimumVakantiegeld = minimumAnnualForHours * NL_VAKANTIEGELD_RATE;
    const minimumTotalPackage = minimumAnnualForHours + minimumVakantiegeld;

    // User comparison
    const userHourly = hourlyRate ?? null;
    const userMonthly = monthlySalary ?? null;

    let effectiveUserHourly = userHourly;
    if (effectiveUserHourly === null && userMonthly !== null) {
      effectiveUserHourly = userMonthly / (hoursPerWeek * (52 / 12));
    }

    const meetsMinimum =
      effectiveUserHourly !== null ? effectiveUserHourly >= minimumHourly : true;
    const shortfallHourly =
      effectiveUserHourly !== null ? Math.max(0, minimumHourly - effectiveUserHourly) : 0;
    const shortfallMonthly = shortfallHourly * hoursPerWeek * (52 / 12);

    return {
      minimumHourly,
      minimumMonthly,
      minimumAnnual,
      userHourly,
      userMonthly,
      meetsMinimum,
      shortfallHourly,
      shortfallMonthly,
      minimumAnnualForHours,
      minimumVakantiegeld,
      minimumTotalPackage,
      hoursPerWeek,
    };
  },
};
