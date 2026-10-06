import { describe, expect, it } from 'vitest';
import {
  grDoroHristougennonEngine,
  GR_DORO_FULL_DAYS,
  GR_DORO_VACATION_FACTOR,
  GR_DORO_DEADLINE_2026,
} from '../../src/calculators/labor/engines/grDoroHristougennon';

describe('grDoroHristougennon engine', () => {
  it('pays a full monthly salary for the whole May 1 – Dec 31 window', () => {
    // €2000/mo, 243 days -> 2000 x 1.041666 = €2083.33
    const r = grDoroHristougennonEngine.calculate({ monthlySalary: 2000, daysWorked: 243 });
    expect(r.proRataFraction).toBe(1);
    expect(r.fullBonus).toBeCloseTo(2083.33, 1);
    expect(r.baseBonus).toBe(2000);
    expect(r.vacationFactor).toBe(GR_DORO_VACATION_FACTOR);
    expect(r.doroBruto).toBeCloseTo(2083.33, 1);
  });

  it('pro-rates 2/25 of salary per 19 days of employment', () => {
    // €1500/mo, 95 days -> (95/19) x (2/25) = 0.4 -> 600 x 1.041666 = €625.00
    const r = grDoroHristougennonEngine.calculate({ monthlySalary: 1500, daysWorked: 95 });
    expect(r.proRataFraction).toBeCloseTo(0.4, 4);
    expect(r.baseBonus).toBeCloseTo(600, 2);
    expect(r.doroBruto).toBeCloseTo(625, 1);
  });

  it('applies a proportional fraction below 19 days', () => {
    // €1200/mo, 10 days -> (10/19) x (2/25) x 1200 x 1.041666 = €52.63
    const r = grDoroHristougennonEngine.calculate({ monthlySalary: 1200, daysWorked: 10 });
    expect(r.proRataFraction).toBeCloseTo((10 / 19) * (2 / 25), 6);
    expect(r.doroBruto).toBeCloseTo(52.63, 1);
  });

  it('returns zero for zero days worked', () => {
    const r = grDoroHristougennonEngine.calculate({ monthlySalary: 1800, daysWorked: 0 });
    expect(r.doroBruto).toBe(0);
    expect(r.proRataFraction).toBe(0);
  });

  it('caps the pro-rata fraction at one full salary', () => {
    // 242 days raw fraction would exceed 1 -> capped
    const r = grDoroHristougennonEngine.calculate({ monthlySalary: 1000, daysWorked: 242 });
    expect(r.proRataFraction).toBe(1);
    expect(r.doroBruto).toBeCloseTo(1041.67, 1);
  });

  it('exposes the 2026 statutory constants', () => {
    expect(GR_DORO_FULL_DAYS).toBe(243);
    expect(GR_DORO_VACATION_FACTOR).toBe(1.041666);
    expect(GR_DORO_DEADLINE_2026).toBe('2026-12-21');
  });

  it('validates input', () => {
    expect(grDoroHristougennonEngine.validate({ monthlySalary: 1500, daysWorked: 243 }).valid).toBe(
      true,
    );
    expect(grDoroHristougennonEngine.validate({ monthlySalary: 1500, daysWorked: 0 }).valid).toBe(
      true,
    );
    expect(grDoroHristougennonEngine.validate({ monthlySalary: 0, daysWorked: 100 }).valid).toBe(
      false,
    );
    expect(grDoroHristougennonEngine.validate({ monthlySalary: -500, daysWorked: 100 }).valid).toBe(
      false,
    );
    expect(grDoroHristougennonEngine.validate({ monthlySalary: 1500, daysWorked: -1 }).valid).toBe(
      false,
    );
    expect(grDoroHristougennonEngine.validate({ monthlySalary: 1500, daysWorked: 244 }).valid).toBe(
      false,
    );
    expect(
      grDoroHristougennonEngine.validate({ monthlySalary: 1500, daysWorked: 10.5 }).valid,
    ).toBe(false);
    expect(grDoroHristougennonEngine.validate({ monthlySalary: NaN, daysWorked: 100 }).valid).toBe(
      false,
    );
  });
});
