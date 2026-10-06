import { describe, expect, it } from 'vitest';
import { nlOverurenEngine } from '../../src/calculators/salary/engines/nl/nlOveruren';

describe('nlOveruren engine', () => {
  it('derives hourly wage from monthly salary and applies premium', () => {
    // €3500/mo, 40h/week -> 3500*12/52/40 = 20.19/h
    const r = nlOverurenEngine.calculate(
      { brutoMaandsalaris: 3500, urenPerWeek: 40, overuren: 8, toeslagPercent: 50 },
      {} as never,
      2026,
    );
    expect(r.uurloonAfgeleid).toBe(true);
    expect(r.uurloon).toBeCloseTo(20.19, 1);
    expect(r.overurentarief).toBeCloseTo(30.29, 1); // 1.5x
    expect(r.brutoOverwerkvergoeding).toBeCloseTo(242.31, 1); // 8 x 30.288...
  });

  it('accepts a directly entered hourly wage', () => {
    const r = nlOverurenEngine.calculate(
      { uurloon: 20, overuren: 10, toeslagPercent: 100 },
      {} as never,
      2026,
    );
    expect(r.uurloonAfgeleid).toBe(false);
    expect(r.uurloon).toBe(20);
    expect(r.overurentarief).toBe(40);
    expect(r.brutoOverwerkvergoeding).toBe(400);
  });

  it('splits the compensation into basis and premium components', () => {
    const r = nlOverurenEngine.calculate(
      { uurloon: 25, overuren: 4, toeslagPercent: 25 },
      {} as never,
      2026,
    );
    expect(r.basisComponent).toBe(100); // 25 x 4
    expect(r.toeslagComponent).toBe(25); // 25 x 0.25 x 4
    expect(r.brutoOverwerkvergoeding).toBe(125);
  });

  it('returns zero for zero overtime hours', () => {
    const r = nlOverurenEngine.calculate(
      { uurloon: 20, overuren: 0, toeslagPercent: 50 },
      {} as never,
      2026,
    );
    expect(r.brutoOverwerkvergoeding).toBe(0);
  });

  it('rejects negative premium and missing wage inputs', () => {
    const v1 = nlOverurenEngine.validate({ overuren: 5, toeslagPercent: -10 });
    expect(v1.valid).toBe(false);

    const v2 = nlOverurenEngine.validate({ uurloon: 0, overuren: 5, toeslagPercent: 50 });
    expect(v2.valid).toBe(false);
  });

  it('validates a correct input', () => {
    const v = nlOverurenEngine.validate({ brutoMaandsalaris: 3500, urenPerWeek: 40, overuren: 8, toeslagPercent: 50 });
    expect(v.valid).toBe(true);
  });
});
