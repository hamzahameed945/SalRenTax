import { describe, expect, it } from 'vitest';
import { salaryToHourlyEngine } from '../../src/calculators/salary/engines/salaryToHourly';

describe('salaryToHourlyEngine.validate', () => {
  it('accepts valid input', () => {
    const result = salaryToHourlyEngine.validate({
      annualSalary: 50000,
      hoursPerWeek: 40,
      weeksPerYear: 52,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid hours', () => {
    const result = salaryToHourlyEngine.validate({
      annualSalary: 50000,
      hoursPerWeek: 200, // max 168
      weeksPerYear: 52,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid weeks', () => {
    const result = salaryToHourlyEngine.validate({
      annualSalary: 50000,
      hoursPerWeek: 40,
      weeksPerYear: 53, // max 52
    });
    expect(result.valid).toBe(false);
  });
});

describe('salaryToHourlyEngine.calculate', () => {
  it('calculates hourly wage correctly for standard full time', () => {
    const result = salaryToHourlyEngine.calculate(
      {
        annualSalary: 52000,
        hoursPerWeek: 40,
        weeksPerYear: 52,
      },
      undefined as never,
      2026,
    );

    // 52000 / (40 * 52) = 52000 / 2080 = 25
    expect(result.hourlyWage).toBe(25);
    expect(result.weeklyWage).toBe(1000);
    expect(result.dailyWage).toBe(200);
    expect(result.biweeklyWage).toBe(2000); // 52000 / 26
    expect(result.monthlyWage).toBeCloseTo(4333.33); // 52000 / 12
  });

  it('calculates correctly for part year', () => {
    const result = salaryToHourlyEngine.calculate(
      {
        annualSalary: 40000,
        hoursPerWeek: 40,
        weeksPerYear: 40,
      },
      undefined as never,
      2026,
    );

    // hourly = 40000 / (40 * 40) = 40000 / 1600 = 25
    expect(result.hourlyWage).toBe(25);
    // weekly = 40000 / 40 = 1000
    expect(result.weeklyWage).toBe(1000);
  });
});
