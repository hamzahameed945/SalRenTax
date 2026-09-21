import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';
import { PERIODS_PER_YEAR } from '../../core/frequency';

export interface SalaryRaiseInput {
  currentSalary: number;
  raisePercentage?: number;
  newSalary?: number;
  hoursPerWeek?: number; // Needed to compute hourly difference
}

export interface SalaryRaiseResult {
  currentSalary: number;
  newSalary: number;
  increaseAmount: number;
  increasePercentage: number;
  monthlyDifference: number;
  biweeklyDifference: number;
  hourlyDifference?: number;
}

export const salaryRaiseEngine: CalculatorEngine<SalaryRaiseInput, SalaryRaiseResult, never> = {
  validate(input: SalaryRaiseInput): ValidationResult<SalaryRaiseInput> {
    const errors: Partial<Record<keyof SalaryRaiseInput, string>> = {};

    if (
      input.currentSalary === undefined ||
      input.currentSalary === null ||
      Number.isNaN(input.currentSalary)
    ) {
      errors.currentSalary = 'errors.invalidNumber';
    } else if (input.currentSalary <= 0) {
      errors.currentSalary = 'errors.mustBePositive';
    }

    if (
      (input.raisePercentage === undefined || input.raisePercentage === null) &&
      (input.newSalary === undefined || input.newSalary === null)
    ) {
      errors.raisePercentage = 'errors.raisePercentageOrNewSalaryRequired';
      errors.newSalary = 'errors.raisePercentageOrNewSalaryRequired';
    }

    if (input.raisePercentage !== undefined && input.raisePercentage !== null) {
      if (Number.isNaN(input.raisePercentage)) {
        errors.raisePercentage = 'errors.invalidNumber';
      } else if (input.raisePercentage < 0) {
        errors.raisePercentage = 'errors.mustBePositive';
      }
    }

    if (input.newSalary !== undefined && input.newSalary !== null) {
      if (Number.isNaN(input.newSalary)) {
        errors.newSalary = 'errors.invalidNumber';
      } else if (input.newSalary <= 0) {
        errors.newSalary = 'errors.mustBePositive';
      }
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

  calculate(input: SalaryRaiseInput): SalaryRaiseResult {
    const { currentSalary, hoursPerWeek = 40 } = input;

    let newSalary = 0;
    let increaseAmount = 0;
    let increasePercentage = 0;

    if (input.newSalary !== undefined && input.newSalary !== null) {
      newSalary = input.newSalary;
      increaseAmount = newSalary - currentSalary;
      increasePercentage = (increaseAmount / currentSalary) * 100;
    } else if (input.raisePercentage !== undefined && input.raisePercentage !== null) {
      increasePercentage = input.raisePercentage;
      increaseAmount = currentSalary * (increasePercentage / 100);
      newSalary = currentSalary + increaseAmount;
    }

    const monthlyDifference = increaseAmount / PERIODS_PER_YEAR.monthly;
    const biweeklyDifference = increaseAmount / PERIODS_PER_YEAR.biweekly;

    const currentHourly = currentSalary / (hoursPerWeek * 52);
    const newHourly = newSalary / (hoursPerWeek * 52);
    const hourlyDifference = newHourly - currentHourly;

    return {
      currentSalary: roundToCents(currentSalary),
      newSalary: roundToCents(newSalary),
      increaseAmount: roundToCents(increaseAmount),
      increasePercentage: roundToCents(increasePercentage),
      monthlyDifference: roundToCents(monthlyDifference),
      biweeklyDifference: roundToCents(biweeklyDifference),
      hourlyDifference: roundToCents(hourlyDifference),
    };
  },
};
