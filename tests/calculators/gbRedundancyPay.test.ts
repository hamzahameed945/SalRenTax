import { describe, expect, it } from 'vitest';
import {
  gbRedundancyPayEngine,
  TAX_FREE_ALLOWANCE,
  WEEKLY_PAY_CAP_GB_2026,
  type GbRedundancyPayInput,
} from '../../src/calculators/labor/engines/gbRedundancyPay';

const calc = (input: GbRedundancyPayInput) =>
  gbRedundancyPayEngine.calculate(input, undefined as never, 2026);

describe('gbRedundancyPay engine', () => {
  it('uses the verified 2026/27 Great Britain weekly pay cap of £751', () => {
    expect(WEEKLY_PAY_CAP_GB_2026).toBe(751);
  });

  it('caps weekly pay at £751 for a high earner', () => {
    const r = calc({ age: 40, yearsOfService: 10, grossWeeklyPay: 1200 });
    expect(r.capApplied).toBe(true);
    expect(r.cappedWeeklyPay).toBe(751);
    expect(r.totalWeeks).toBe(10);
    expect(r.statutoryPay).toBe(10 * 751);
  });

  it('does not cap pay below the limit', () => {
    const r = calc({ age: 40, yearsOfService: 10, grossWeeklyPay: 600 });
    expect(r.capApplied).toBe(false);
    expect(r.cappedWeeklyPay).toBe(600);
    expect(r.statutoryPay).toBe(6000);
  });

  it('uses the uncapped amount exactly at the cap', () => {
    const r = calc({ age: 40, yearsOfService: 5, grossWeeklyPay: 751 });
    expect(r.capApplied).toBe(false);
    expect(r.statutoryPay).toBe(5 * 751);
  });

  it('applies the 0.5× multiplier for years aged under 22', () => {
    // Age 25 with 8 years service: 4 years at 22–25, 4 years at 18–21
    // (counted backwards: end-of-year ages 25, 24, 23, 22, 21, 20, 19, 18).
    const r = calc({ age: 25, yearsOfService: 8, grossWeeklyPay: 500 });
    expect(r.bands).toEqual([
      { band: 'under22', multiplier: 0.5, years: 4, weeks: 2 },
      { band: '22to40', multiplier: 1, years: 4, weeks: 4 },
    ]);
    expect(r.totalWeeks).toBe(6);
    expect(r.statutoryPay).toBe(6 * 500);
  });

  it('applies the 1× multiplier for years aged 22 to 40', () => {
    const r = calc({ age: 35, yearsOfService: 10, grossWeeklyPay: 700 });
    expect(r.totalWeeks).toBe(10);
    expect(r.bands).toEqual([{ band: '22to40', multiplier: 1, years: 10, weeks: 10 }]);
    expect(r.statutoryPay).toBe(7000);
  });

  it('applies the 1.5× multiplier for years aged 41 and over', () => {
    // Age 45, 20 years: 5 years at 41–45 (1.5×), 15 years at 26–40 (1×).
    const r = calc({ age: 45, yearsOfService: 20, grossWeeklyPay: 751 });
    expect(r.bands).toEqual([
      { band: '22to40', multiplier: 1, years: 15, weeks: 15 },
      { band: 'age41plus', multiplier: 1.5, years: 5, weeks: 7.5 },
    ]);
    expect(r.totalWeeks).toBe(22.5);
    expect(r.statutoryPay).toBe(22.5 * 751);
  });

  it('caps service at 20 years', () => {
    const r = calc({ age: 60, yearsOfService: 30, grossWeeklyPay: 751 });
    expect(r.yearsCounted).toBe(20);
    // Years at end-of-year ages 60..41 → all in the 41+ band.
    expect(r.bands).toEqual([{ band: 'age41plus', multiplier: 1.5, years: 20, weeks: 30 }]);
    expect(r.totalWeeks).toBe(30);
    // Matches the gov.uk maximum statutory redundancy pay.
    expect(r.statutoryPay).toBe(22530);
  });

  it('flags under 2 years of service as not qualifying for statutory pay', () => {
    const r = calc({ age: 30, yearsOfService: 1.5, grossWeeklyPay: 500 });
    expect(r.qualifiesForStatutory).toBe(false);
    expect(r.yearsCounted).toBe(1);
    expect(r.statutoryPay).toBe(500);
  });

  it('qualifies with exactly 2 years of service', () => {
    const r = calc({ age: 30, yearsOfService: 2, grossWeeklyPay: 500 });
    expect(r.qualifiesForStatutory).toBe(true);
  });

  it('handles the age-band boundaries exactly (22 and 41)', () => {
    // Age 22, 1 year: that year ended at age 22 → 1×.
    const at22 = calc({ age: 22, yearsOfService: 1, grossWeeklyPay: 400 });
    expect(at22.totalWeeks).toBe(1);
    expect(at22.bands[0].band).toBe('22to40');

    // Age 41, 1 year: that year ended at age 41 → 1.5×.
    const at41 = calc({ age: 41, yearsOfService: 1, grossWeeklyPay: 400 });
    expect(at41.totalWeeks).toBe(1.5);
    expect(at41.bands[0].band).toBe('age41plus');

    // Age 21, 1 year: 0.5×.
    const at21 = calc({ age: 21, yearsOfService: 1, grossWeeklyPay: 400 });
    expect(at21.totalWeeks).toBe(0.5);
    expect(at21.bands[0].band).toBe('under22');
  });

  it('exposes the £30,000 tax-free allowance and statutory pay sits below it', () => {
    expect(TAX_FREE_ALLOWANCE).toBe(30000);
    const maxed = calc({ age: 61, yearsOfService: 20, grossWeeklyPay: 751 });
    expect(maxed.statutoryPay).toBeLessThanOrEqual(TAX_FREE_ALLOWANCE);
  });

  it('rejects invalid inputs', () => {
    expect(
      gbRedundancyPayEngine.validate({ age: 15, yearsOfService: 5, grossWeeklyPay: 500 }).valid,
    ).toBe(false);
    expect(
      gbRedundancyPayEngine.validate({ age: 40, yearsOfService: -1, grossWeeklyPay: 500 }).valid,
    ).toBe(false);
    expect(
      gbRedundancyPayEngine.validate({ age: 40, yearsOfService: 5, grossWeeklyPay: -10 }).valid,
    ).toBe(false);
    expect(
      gbRedundancyPayEngine.validate({ age: NaN, yearsOfService: 5, grossWeeklyPay: 500 }).valid,
    ).toBe(false);

    const ok = gbRedundancyPayEngine.validate({ age: 40, yearsOfService: 10, grossWeeklyPay: 751 });
    expect(ok.valid).toBe(true);
  });
});
