import type { CalculatorEngine, ValidationResult } from '../../core/types';
import type { PayFrequency } from '../../core/frequency';
import { PERIODS_PER_YEAR, convertFrequency } from '../../core/frequency';
import { roundToCents } from '../../core/math';

export interface PayFrequencyConverterInput {
  amount: number;
  frequency: PayFrequency;
  hoursPerWeek?: number; // Needed if hourly is involved
}

export type PayFrequencyConverterResult = Record<PayFrequency, number>;

export const payFrequencyConverterEngine: CalculatorEngine<
  PayFrequencyConverterInput,
  PayFrequencyConverterResult,
  never
> = {
  validate(input: PayFrequencyConverterInput): ValidationResult<PayFrequencyConverterInput> {
    const errors: Partial<Record<keyof PayFrequencyConverterInput, string>> = {};

    if (input.amount === undefined || input.amount === null || Number.isNaN(input.amount)) {
      errors.amount = 'errors.invalidNumber';
    } else if (input.amount < 0) {
      errors.amount = 'errors.mustBePositive';
    }

    if (!input.frequency || !PERIODS_PER_YEAR[input.frequency]) {
      errors.frequency = 'errors.invalidFrequency';
    }

    if (input.hoursPerWeek !== undefined) {
      if (Number.isNaN(input.hoursPerWeek)) {
        errors.hoursPerWeek = 'errors.invalidNumber';
      } else if (input.hoursPerWeek <= 0 || input.hoursPerWeek > 168) {
        errors.hoursPerWeek = 'errors.invalidHoursPerWeek';
      }
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: PayFrequencyConverterInput): PayFrequencyConverterResult {
    const { amount, frequency, hoursPerWeek = 40 } = input;

    // First convert to annual to serve as the base
    let annualAmount = 0;

    if (frequency === 'hourly') {
      const weekly = amount * hoursPerWeek;
      annualAmount = weekly * 52;
    } else if (frequency === 'daily') {
      const weekly = amount * 5;
      annualAmount = weekly * 52;
    } else {
      annualAmount = amount * PERIODS_PER_YEAR[frequency];
    }

    // Now calculate all other frequencies
    const weeklyWage = annualAmount / 52;
    
    return {
      annually: roundToCents(annualAmount),
      monthly: roundToCents(annualAmount / PERIODS_PER_YEAR.monthly),
      semimonthly: roundToCents(annualAmount / PERIODS_PER_YEAR.semimonthly),
      biweekly: roundToCents(annualAmount / PERIODS_PER_YEAR.biweekly),
      weekly: roundToCents(weeklyWage),
      daily: roundToCents(weeklyWage / 5),
      hourly: roundToCents(weeklyWage / hoursPerWeek),
    };
  }
};
