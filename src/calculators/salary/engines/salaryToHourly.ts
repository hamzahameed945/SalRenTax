import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { PERIODS_PER_YEAR } from '../../core/frequency';
import { roundToCents } from '../../core/math';

export interface SalaryToHourlyInput {
  annualSalary: number;
  hoursPerWeek: number;
  weeksPerYear: number;
}

export interface SalaryToHourlyResult {
  hourlyWage: number;
  dailyWage: number;
  weeklyWage: number;
  biweeklyWage: number;
  monthlyWage: number;
  annualSalary: number;
}

export const salaryToHourlyEngine: CalculatorEngine<
  SalaryToHourlyInput,
  SalaryToHourlyResult,
  never
> = {
  validate(input: SalaryToHourlyInput): ValidationResult<SalaryToHourlyInput> {
    const errors: Partial<Record<keyof SalaryToHourlyInput, string>> = {};

    if (
      input.annualSalary === undefined ||
      input.annualSalary === null ||
      Number.isNaN(input.annualSalary)
    ) {
      errors.annualSalary = 'errors.invalidNumber';
    } else if (input.annualSalary <= 0) {
      errors.annualSalary = 'errors.mustBePositive';
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

  calculate(input: SalaryToHourlyInput): SalaryToHourlyResult {
    const { annualSalary, hoursPerWeek, weeksPerYear } = input;

    // Total hours worked in the year based on input assumptions
    const totalAnnualHours = hoursPerWeek * weeksPerYear;

    // Core hourly wage calculation
    const hourlyWage = annualSalary / totalAnnualHours;

    // Derive other frequencies based on standard payroll periods (assuming paid year-round for standard salaries)
    // If someone works 40 weeks, their "weekly wage" for those 40 weeks is:
    const weeklyWage = annualSalary / weeksPerYear;

    // Daily assuming 5 working days per week
    const dailyWage = weeklyWage / 5;

    // For standard biweekly and monthly, we distribute the annual salary evenly over the year
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
