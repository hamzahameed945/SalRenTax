import { describe, expect, it } from 'vitest';
import { salaryRaiseEngine } from '../../src/calculators/salary/engines/salaryRaise';

describe('salaryRaiseEngine.calculate', () => {
  it('calculates based on percentage', () => {
    const result = salaryRaiseEngine.calculate(
      {
        currentSalary: 50000,
        raisePercentage: 10,
      },
      undefined as never,
      2026,
    );

    expect(result.newSalary).toBe(55000);
    expect(result.increaseAmount).toBe(5000);
    expect(result.increasePercentage).toBe(10);
    expect(result.monthlyDifference).toBeCloseTo(416.67);
  });

  it('calculates based on new salary', () => {
    const result = salaryRaiseEngine.calculate(
      {
        currentSalary: 50000,
        newSalary: 60000,
      },
      undefined as never,
      2026,
    );

    expect(result.newSalary).toBe(60000);
    expect(result.increaseAmount).toBe(10000);
    expect(result.increasePercentage).toBe(20);
    expect(result.monthlyDifference).toBeCloseTo(833.33);
  });
});
