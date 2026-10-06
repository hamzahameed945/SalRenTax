import { describe, expect, it } from 'vitest';
import {
  gbMaternityAllowanceEngine,
  type GbMaternityAllowanceInput,
} from '../../src/calculators/labor/engines/gbMaternityAllowance';

const calc = (input: GbMaternityAllowanceInput) =>
  gbMaternityAllowanceEngine.calculate(input, {} as never, 2026);

const base: GbMaternityAllowanceInput = {
  workStatus: 'employed',
  weeksWorked: 40,
  weeksAtLeast30: 40,
  averageWeeklyEarnings: 500,
  class2WeeksPaid: 0,
  receivesSmpFromAnotherJob: false,
};

describe('gbMaternityAllowance engine', () => {
  it('pays the standard rate for an eligible employed claimant', () => {
    const r = calc(base);
    expect(r.eligible).toBe(true);
    expect(r.ineligibilityReasons).toEqual([]);
    expect(r.weeklyRate).toBe(194.32);
    expect(r.paidWeeks).toBe(39);
    expect(r.totalAmount).toBeCloseTo(194.32 * 39, 2);
    expect(r.rateBasis).toBe('standard');
  });

  it('uses 90% of AWE when it is lower than the standard rate', () => {
    const r = calc({ ...base, averageWeeklyEarnings: 200 });
    expect(r.eligible).toBe(true);
    expect(r.weeklyRate).toBe(180); // 90% of £200
    expect(r.rateBasis).toBe('ninety-percent');
    expect(r.totalAmount).toBeCloseTo(180 * 39, 2);
  });

  it('switches to the 90% basis at the exact £194.32 crossover', () => {
    // 90% of £215.91 = £194.319 → rounds to £194.32, equal to the cap.
    const r = calc({ ...base, averageWeeklyEarnings: 215.91 });
    expect(r.weeklyRate).toBe(194.32);
    // 90% of £200 = £180, strictly below the cap.
    const r2 = calc({ ...base, averageWeeklyEarnings: 200 });
    expect(r2.rateBasis).toBe('ninety-percent');
  });

  it('requires 26 weeks worked in the 66-week test period', () => {
    const r = calc({ ...base, weeksWorked: 25, weeksAtLeast30: 25 });
    expect(r.eligible).toBe(false);
    expect(r.ineligibilityReasons).toContain('too-few-work-weeks');
    expect(r.weeklyRate).toBe(0);
    expect(r.totalAmount).toBe(0);
  });

  it('accepts exactly 26 work weeks as the boundary', () => {
    const r = calc({ ...base, weeksWorked: 26, weeksAtLeast30: 13 });
    expect(r.eligible).toBe(true);
  });

  it('requires 13 weeks earning at least £30/week', () => {
    const r = calc({ ...base, weeksAtLeast30: 12 });
    expect(r.eligible).toBe(false);
    expect(r.ineligibilityReasons).toContain('too-few-high-earning-weeks');
  });

  it('rejects claimants who get SMP from another job', () => {
    const r = calc({ ...base, receivesSmpFromAnotherJob: true });
    expect(r.eligible).toBe(false);
    expect(r.ineligibilityReasons).toContain('receives-smp');
  });

  it('reports multiple ineligibility reasons together', () => {
    const r = calc({ ...base, weeksWorked: 10, weeksAtLeast30: 5, receivesSmpFromAnotherJob: true });
    expect(r.ineligibilityReasons).toEqual(
      expect.arrayContaining(['receives-smp', 'too-few-work-weeks', 'too-few-high-earning-weeks']),
    );
  });

  it('gives self-employed claimants with 13+ Class 2 weeks the full rate', () => {
    const r = calc({
      ...base,
      workStatus: 'selfEmployed',
      class2WeeksPaid: 13,
      averageWeeklyEarnings: 600,
    });
    expect(r.eligible).toBe(true);
    expect(r.weeklyRate).toBe(194.32);
    expect(r.rateBasis).toBe('standard');
    expect(r.class2ShortfallWeeks).toBe(0);
  });

  it('pro-rates the self-employed rate below 13 Class 2 weeks', () => {
    const r = calc({
      ...base,
      workStatus: 'selfEmployed',
      class2WeeksPaid: 6,
      averageWeeklyEarnings: 600,
    });
    expect(r.eligible).toBe(true);
    expect(r.weeklyRate).toBeCloseTo(194.32 * (6 / 13), 2);
    expect(r.rateBasis).toBe('reduced');
    expect(r.class2ShortfallWeeks).toBe(7);
  });

  it('pays the £27 minimum to self-employed claimants with no Class 2 NI', () => {
    const r = calc({
      ...base,
      workStatus: 'selfEmployed',
      class2WeeksPaid: 0,
      averageWeeklyEarnings: 600,
    });
    expect(r.eligible).toBe(true);
    expect(r.weeklyRate).toBe(27);
    expect(r.rateBasis).toBe('reduced');
    expect(r.totalAmount).toBeCloseTo(27 * 39, 2);
  });

  it('floors the reduced self-employed rate at £27', () => {
    // 1 Class 2 week at low earnings: 90% of £100 = £90 × 1/13 = £6.92 → floored to £27.
    const r = calc({
      ...base,
      workStatus: 'selfEmployed',
      class2WeeksPaid: 1,
      averageWeeklyEarnings: 100,
    });
    expect(r.weeklyRate).toBe(27);
  });

  it('treats recently stopped workers at the full employed rate', () => {
    const r = calc({ ...base, workStatus: 'recentlyStopped', class2WeeksPaid: 0 });
    expect(r.eligible).toBe(true);
    expect(r.weeklyRate).toBe(194.32);
    expect(r.rateBasis).toBe('standard');
  });

  it('gives the spouse/partner unpaid-work case £27 for 14 weeks', () => {
    const r = calc({
      ...base,
      workStatus: 'spouseBusiness',
      weeksAtLeast30: 0, // no £30 earnings requirement for this route
      averageWeeklyEarnings: 600,
    });
    expect(r.eligible).toBe(true);
    expect(r.weeklyRate).toBe(27);
    expect(r.paidWeeks).toBe(14);
    expect(r.totalAmount).toBeCloseTo(27 * 14, 2);
    expect(r.rateBasis).toBe('minimum');
  });

  it('validates ranges and enums', () => {
    const v = gbMaternityAllowanceEngine.validate;
    expect(v({ ...base, weeksWorked: 67 }).valid).toBe(false);
    expect(v({ ...base, weeksWorked: -1 }).valid).toBe(false);
    expect(v({ ...base, weeksAtLeast30: 41 }).valid).toBe(false); // more than weeks worked
    expect(v({ ...base, averageWeeklyEarnings: -5 }).valid).toBe(false);
    expect(v({ ...base, class2WeeksPaid: 67 }).valid).toBe(false);
    expect(
      v({ ...base, workStatus: 'retired' as unknown as GbMaternityAllowanceInput['workStatus'] }).valid,
    ).toBe(false);
    expect(v(base).valid).toBe(true);
  });

  it('exposes the Class 2 top-up cost', () => {
    const r = calc({ ...base, workStatus: 'selfEmployed', class2WeeksPaid: 10 });
    expect(r.class2WeeklyCost).toBe(3.65);
  });
});
