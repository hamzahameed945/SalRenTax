import { describe, expect, it } from 'vitest';
import { hourlyToSalaryEngine } from '../../src/calculators/salary/engines/hourlyToSalary';

describe('hourlyToSalaryEngine.validate', () => {
  it('accepts valid input', () => {
    const result = hourlyToSalaryEngine.validate({
      hourlyWage: 25,
      hoursPerWeek: 40,
      weeksPerYear: 52,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid rate', () => {
    const result = hourlyToSalaryEngine.validate({
      hourlyWage: -10,
      hoursPerWeek: 40,
      weeksPerYear: 52,
    });
    expect(result.valid).toBe(false);
  });
});

describe('hourlyToSalaryEngine.calculate', () => {
  it('calculates annual salary correctly for standard full time', () => {
    const result = hourlyToSalaryEngine.calculate(
      {
        hourlyWage: 25,
        hoursPerWeek: 40,
        weeksPerYear: 52,
      },
      undefined as never,
      2026,
    );

    expect(result.annualSalary).toBe(52000);
    expect(result.weeklyWage).toBe(1000);
    expect(result.dailyWage).toBe(200);
    expect(result.biweeklyWage).toBe(2000);
    expect(result.monthlyWage).toBeCloseTo(4333.33);
  });
});
