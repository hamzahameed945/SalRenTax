import { describe, expect, it } from 'vitest';
import {
  SEVERANCE_TIER_MULTIPLIERS,
  usSeveranceEngine,
} from '../../src/calculators/labor/engines/usSeverance';

describe('US severance benchmark validation', () => {
  const base = {
    annualSalary: 85000,
    yearsOfService: 5,
    seniorityTier: 'individual-contributor' as const,
  };

  it('accepts valid input', () => {
    expect(usSeveranceEngine.validate(base).valid).toBe(true);
  });

  it('rejects zero or negative salary', () => {
    expect(usSeveranceEngine.validate({ ...base, annualSalary: 0 }).valid).toBe(false);
    expect(usSeveranceEngine.validate({ ...base, annualSalary: -1000 }).valid).toBe(false);
  });

  it('rejects negative years of service', () => {
    expect(usSeveranceEngine.validate({ ...base, yearsOfService: -1 }).valid).toBe(false);
  });

  it('rejects an unknown seniority tier', () => {
    expect(
      usSeveranceEngine.validate({ ...base, seniorityTier: 'intern' as never }).valid,
    ).toBe(false);
  });

  it('rejects negative offered weeks', () => {
    expect(
      usSeveranceEngine.validate({ ...base, offeredSeveranceWeeks: -2 }).valid,
    ).toBe(false);
  });

  it('accepts an optional offered-weeks value', () => {
    expect(
      usSeveranceEngine.validate({ ...base, offeredSeveranceWeeks: 8 }).valid,
    ).toBe(true);
  });
});

describe('US severance benchmark calculation', () => {
  it('applies the 1–2 weeks per year rule for individual contributors', () => {
    const result = usSeveranceEngine.calculate(
      { annualSalary: 104000, yearsOfService: 5, seniorityTier: 'individual-contributor' },
      undefined as never,
      2026,
    );
    // $104,000 / 52 = $2,000 per week; 5 yrs × 1 wk × 1.0 = 5 wks; × 2 wks = 10 wks
    expect(result.weeklyPay).toBe(2000);
    expect(result.lowWeeks).toBe(5);
    expect(result.highWeeks).toBe(10);
    expect(result.lowAmount).toBe(10000);
    expect(result.highAmount).toBe(20000);
    expect(result.midAmount).toBe(15000);
  });

  it('scales the range by seniority tier multipliers', () => {
    const manager = usSeveranceEngine.calculate(
      { annualSalary: 104000, yearsOfService: 5, seniorityTier: 'manager' },
      undefined as never,
      2026,
    );
    const executive = usSeveranceEngine.calculate(
      { annualSalary: 104000, yearsOfService: 5, seniorityTier: 'executive' },
      undefined as never,
      2026,
    );
    expect(SEVERANCE_TIER_MULTIPLIERS.manager).toBe(1.5);
    expect(SEVERANCE_TIER_MULTIPLIERS.executive).toBe(2.0);
    expect(manager.lowWeeks).toBe(7.5);
    expect(manager.highWeeks).toBe(15);
    expect(executive.lowWeeks).toBe(10);
    expect(executive.highWeeks).toBe(20);
    expect(executive.lowAmount).toBe(20000);
    expect(executive.highAmount).toBe(40000);
  });

  it('returns a zero range for zero years of service', () => {
    const result = usSeveranceEngine.calculate(
      { annualSalary: 85000, yearsOfService: 0, seniorityTier: 'individual-contributor' },
      undefined as never,
      2026,
    );
    expect(result.lowAmount).toBe(0);
    expect(result.highAmount).toBe(0);
  });

  it('reports no-offer verdict when no offer is entered', () => {
    const result = usSeveranceEngine.calculate(
      { annualSalary: 85000, yearsOfService: 5, seniorityTier: 'individual-contributor' },
      undefined as never,
      2026,
    );
    expect(result.verdict).toBe('no-offer');
  });

  it('verdicts below-market, market and strong correctly', () => {
    const input = {
      annualSalary: 104000,
      yearsOfService: 5,
      seniorityTier: 'individual-contributor' as const,
    };
    // benchmark: 5–10 weeks
    expect(
      usSeveranceEngine.calculate({ ...input, offeredSeveranceWeeks: 4 }, undefined as never, 2026)
        .verdict,
    ).toBe('below-market');
    expect(
      usSeveranceEngine.calculate({ ...input, offeredSeveranceWeeks: 5 }, undefined as never, 2026)
        .verdict,
    ).toBe('market');
    expect(
      usSeveranceEngine.calculate({ ...input, offeredSeveranceWeeks: 8 }, undefined as never, 2026)
        .verdict,
    ).toBe('market');
    expect(
      usSeveranceEngine.calculate({ ...input, offeredSeveranceWeeks: 10 }, undefined as never, 2026)
        .verdict,
    ).toBe('market');
    expect(
      usSeveranceEngine.calculate({ ...input, offeredSeveranceWeeks: 12 }, undefined as never, 2026)
        .verdict,
    ).toBe('strong');
  });
});
