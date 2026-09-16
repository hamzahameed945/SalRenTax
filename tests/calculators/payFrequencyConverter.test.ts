import { describe, expect, it } from 'vitest';
import { payFrequencyConverterEngine } from '../../src/calculators/salary/engines/payFrequencyConverter';

describe('payFrequencyConverterEngine.calculate', () => {
  it('converts monthly to all frequencies', () => {
    const result = payFrequencyConverterEngine.calculate(
      {
        amount: 5000,
        frequency: 'monthly',
        hoursPerWeek: 40,
      },
      undefined as never,
      2026,
    );

    expect(result.annually).toBe(60000); // 5000 * 12
    expect(result.monthly).toBe(5000);
    expect(result.biweekly).toBeCloseTo(2307.69); // 60000 / 26
    expect(result.weekly).toBeCloseTo(1153.85); // 60000 / 52
    expect(result.hourly).toBeCloseTo(28.85); // 1153.85 / 40
  });

  it('converts hourly to all frequencies', () => {
    const result = payFrequencyConverterEngine.calculate(
      {
        amount: 25,
        frequency: 'hourly',
        hoursPerWeek: 40,
      },
      undefined as never,
      2026,
    );

    expect(result.annually).toBe(52000); // 25 * 40 * 52
    expect(result.weekly).toBe(1000);
    expect(result.hourly).toBe(25);
  });
});
