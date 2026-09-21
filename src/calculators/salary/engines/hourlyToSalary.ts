import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { PERIODS_PER_YEAR } from '../../core/frequency';
import { roundToCents } from '../../core/math';

export interface HourlyToSalaryInput {
  hourlyWage: number;
  hoursPerWeek: number;
  weeksPerYear: number;
}

export interface HourlyToSalaryResult {
  hourlyWage: number;
  dailyWage: number;
  weeklyWage: number;
  biweeklyWage: number;
  monthlyWage: number;
  annualSalary: number;
}

export const hourlyToSalaryEngine: CalculatorEngine<
  HourlyToSalaryInput,
  HourlyToSalaryResult,
  never
> = {
  validate(input: HourlyToSalaryInput): ValidationResult<HourlyToSalaryInput> {
    const errors: Partial<Record<keyof HourlyToSalaryInput, string>> = {};

    if (
      input.hourlyWage === undefined ||
      input.hourlyWage === null ||
      Number.isNaN(input.hourlyWage)
    ) {
      errors.hourlyWage = 'errors.invalidNumber';
    } else if (input.hourlyWage <= 0) {
      errors.hourlyWage = 'errors.mustBePositive';
    }

    if (
      input.hoursPerWeek === undefined ||
      input.hoursPerWeek === null ||
      Number.isNaN(input.hoursPerWeek)
    ) {
      errors.hoursPerWeek = 'errors.invalidNumber';
    } else if (input.hoursPerWeek <= 0 || input.hoursPerWeek > 168) {
      errors.hoursPerWeek = 'errors.invalidHoursPerWeek';
    }

    if (
      input.weeksPerYear === undefined ||
      input.weeksPerYear === null ||
      Number.isNaN(input.weeksPerYear)
    ) {
      errors.weeksPerYear = 'errors.invalidNumber';
    } else if (input.weeksPerYear <= 0 || input.weeksPerYear > 52) {
      errors.weeksPerYear = 'errors.invalidWeeksPerYear';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: HourlyToSalaryInput): HourlyToSalaryResult {
    const { hourlyWage, hoursPerWeek, weeksPerYear } = input;

    const weeklyWage = hourlyWage * hoursPerWeek;
    const dailyWage = weeklyWage / 5;
    const annualSalary = weeklyWage * weeksPerYear;

    const biweeklyWage = annualSalary / PERIODS_PER_YEAR.biweekly;
    const monthlyWage = annualSalary / PERIODS_PER_YEAR.monthly;

    return {
      hourlyWage: roundToCents(hourlyWage),
      dailyWage: roundToCents(dailyWage),
      weeklyWage: roundToCents(weeklyWage),
      biweeklyWage: roundToCents(biweeklyWage),
      monthlyWage: roundToCents(monthlyWage),
      annualSalary: roundToCents(annualSalary),
    };
  },
};
