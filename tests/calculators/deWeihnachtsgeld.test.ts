import { describe, expect, it } from 'vitest';
import { weihnachtsgeldEngine } from '../../src/calculators/salary/engines/de/weihnachtsgeld';

describe('weihnachtsgeld engine', () => {
  it('estimates net below gross with positive tax (bonus 2000, salary 50000)', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 2000, jahresBrutto: 50000 },
      {} as never,
      2026,
    );
    expect(result.lohnsteuerGeschaetzt).toBeGreaterThan(0);
    expect(result.nettoGeschaetzt).toBeLessThan(2000);
    expect(result.nettoGeschaetzt).toBeCloseTo(
      2000 - result.lohnsteuerGeschaetzt - result.soliGeschaetzt,
      6,
    );
    expect(result.marginalRate).toBeGreaterThan(0);
    expect(result.marginalRate).toBeLessThanOrEqual(0.45);
    expect(result.isSchaetzung).toBe(true);
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

  it('pays no tax below the Grundfreibetrag', () => {
    const result = weihnachtsgeldEngine.calculate(
      { bonusBrutto: 1000, jahresBrutto: 10000 },
      {} as never,
      2026,
    );
    expect(result.lohnsteuerGeschaetzt).toBe(0);
    expect(result.nettoGeschaetzt).toBe(1000);
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

  it('scales tax with the bonus size', () => {
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
    expect(big.lohnsteuerGeschaetzt).toBeCloseTo(small.lohnsteuerGeschaetzt * 4, 6);
  });
});
