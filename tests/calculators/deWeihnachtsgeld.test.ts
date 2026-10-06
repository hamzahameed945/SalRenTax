import { describe, expect, it } from 'vitest';
import { weihnachtsgeldEngine } from '../../src/calculators/salary/engines/de/weihnachtsgeld';

describe('weihnachtsgeld engine', () => {
  it('estimates net below gross with positive tax and SV (bonus 2000, salary 50000)', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 2000, jahresBrutto: 50000 },
      {} as never,
      2026,
    );
    expect(result.lohnsteuerGeschaetzt).toBeGreaterThan(0);
    expect(result.sozialversicherungGeschaetzt).toBeGreaterThan(0);
    expect(result.nettoGeschaetzt).toBeLessThan(2000);
    expect(result.nettoGeschaetzt).toBeCloseTo(
      2000 - result.lohnsteuerGeschaetzt - result.soliGeschaetzt - result.sozialversicherungGeschaetzt,
      6,
    );
    expect(result.marginalRate).toBeGreaterThan(0);
    expect(result.marginalRate).toBeLessThanOrEqual(0.45);
    expect(result.isSchaetzung).toBe(true);
  });

  it('uses the difference method: bonus tax equals ESt(salary+bonus) - ESt(salary)', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 2000, jahresBrutto: 50000 },
      {} as never,
      2026,
    );
    // Difference method must exceed the flat marginal-rate approximation
    // (progressive tariff curvature) but stay in the same ballpark.
    const flatApprox = 2000 * result.marginalRate;
    expect(result.lohnsteuerGeschaetzt).toBeGreaterThanOrEqual(flatApprox);
    expect(result.lohnsteuerGeschaetzt).toBeLessThan(flatApprox * 1.25);
  });

  it('deducts employee social insurance of ~21.65% below the ceilings', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 2000, jahresBrutto: 50000 },
      {} as never,
      2026,
    );
    // RV 9.3% + AV 1.3% + KV 8.75% + PV 2.3% (kinderlos) = 21.65%
    expect(result.sozialversicherungGeschaetzt).toBeCloseTo(2000 * 0.2165, 6);
  });

  it('applies no SV once the ceilings are exhausted by the salary', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 2000, jahresBrutto: 150000 },
      {} as never,
      2026,
    );
    expect(result.sozialversicherungGeschaetzt).toBe(0);
  });

  it('applies no soli below the freigrenze at 50000 salary', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 2000, jahresBrutto: 50000 },
      {} as never,
      2026,
    );
    expect(result.soliGeschaetzt).toBe(0);
  });

  it('applies soli for high earners above the freigrenze', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 5000, jahresBrutto: 120000 },
      {} as never,
      2026,
    );
    expect(result.soliGeschaetzt).toBeGreaterThan(0);
    expect(result.marginalRate).toBeCloseTo(0.42, 2);
  });

  it('pays no income tax below the Grundfreibetrag but still deducts SV', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 1000, jahresBrutto: 10000 },
      {} as never,
      2026,
    );
    expect(result.lohnsteuerGeschaetzt).toBe(0);
    expect(result.sozialversicherungGeschaetzt).toBeCloseTo(1000 * 0.2165, 6);
    expect(result.nettoGeschaetzt).toBeCloseTo(1000 - result.sozialversicherungGeschaetzt, 6);
  });

  it('rejects a bonus of 0', () => {
    const validation = weihnachtsgeldEngine.validate({ bonusBrutto: 0, jahresBrutto: 50000 });
    expect(validation.valid).toBe(false);
  });

  it('rejects non-positive and absurd salaries', () => {
    expect(weihnachtsgeldEngine.validate({ bonusBrutto: 2000, jahresBrutto: -5 }).valid).toBe(false);
    expect(
      weihnachtsgeldEngine.validate({ bonusBrutto: 2000, jahresBrutto: 10_000_000 }).valid,
    ).toBe(false);
  });

  it('scales tax monotonically with the bonus size', () => {
    const small = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 1000, jahresBrutto: 50000 },
      {} as never,
      2026,
    );
    const big = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 4000, jahresBrutto: 50000 },
      {} as never,
      2026,
    );
    // Difference method is near-linear for small bonuses; allow tariff curvature.
    const ratio = big.lohnsteuerGeschaetzt / small.lohnsteuerGeschaetzt;
    expect(ratio).toBeGreaterThan(3.5);
    expect(ratio).toBeLessThan(4.5);
  });
});
