import { describe, expect, it } from 'vitest';
import {
  stundenlohnAusGehalt,
  ueberstundenEngine,
} from '../../src/calculators/salary/engines/de/ueberstunden';

const stundenlohnInput = {
  stunden: 10,
  zuschlagProzent: 0,
  modus: 'stundenlohn' as const,
  stundenlohn: 25,
  jahresBrutto: 50000,
};

describe('ueberstunden engine', () => {
  it('estimates net below gross with positive tax and SV (10h x 25 EUR, salary 50000)', () => {
    const result = ueberstundenEngine.calculate(stundenlohnInput, {} as never, 2026);
    expect(result.ueberstundenBrutto).toBeCloseTo(250, 6);
    expect(result.lohnsteuerGeschaetzt).toBeGreaterThan(0);
    expect(result.sozialversicherungGeschaetzt).toBeGreaterThan(0);
    expect(result.nettoGeschaetzt).toBeLessThan(250);
    expect(result.nettoGeschaetzt).toBeCloseTo(
      250 - result.lohnsteuerGeschaetzt - result.soliGeschaetzt - result.sozialversicherungGeschaetzt,
      6,
    );
    expect(result.marginalRate).toBeGreaterThan(0);
    expect(result.marginalRate).toBeLessThanOrEqual(0.45);
    expect(result.isSchaetzung).toBe(true);
  });

  it('uses the difference method: OT tax equals ESt(salary+OT) - ESt(salary)', () => {
    const result = ueberstundenEngine.calculate(stundenlohnInput, {} as never, 2026);
    // Difference method must exceed the flat marginal-rate approximation
    // (progressive tariff curvature) but stay in the same ballpark.
    const flatApprox = 250 * result.marginalRate;
    expect(result.lohnsteuerGeschaetzt).toBeGreaterThanOrEqual(flatApprox);
    expect(result.lohnsteuerGeschaetzt).toBeLessThan(flatApprox * 1.25);
  });

  it('deducts employee social insurance of ~21.65% below the ceilings', () => {
    const result = ueberstundenEngine.calculate(stundenlohnInput, {} as never, 2026);
    // RV 9.3% + AV 1.3% + KV 8.75% + PV 2.3% (kinderlos) = 21.65%
    expect(result.sozialversicherungGeschaetzt).toBeCloseTo(250 * 0.2165, 6);
  });

  it('applies no SV once the ceilings are exhausted by the salary', () => {
    const result = ueberstundenEngine.calculate(
      { ...stundenlohnInput, jahresBrutto: 150000 },
      {} as never,
      2026,
    );
    expect(result.sozialversicherungGeschaetzt).toBe(0);
  });

  it('applies no soli below the freigrenze at 50000 salary', () => {
    const result = ueberstundenEngine.calculate(stundenlohnInput, {} as never, 2026);
    expect(result.soliGeschaetzt).toBe(0);
  });

  it('applies soli for high earners above the freigrenze', () => {
    const result = ueberstundenEngine.calculate(
      { ...stundenlohnInput, jahresBrutto: 120000 },
      {} as never,
      2026,
    );
    expect(result.soliGeschaetzt).toBeGreaterThan(0);
    expect(result.marginalRate).toBeCloseTo(0.42, 2);
  });

  it('pays no income tax below the Grundfreibetrag but still deducts SV', () => {
    const result = ueberstundenEngine.calculate(
      { ...stundenlohnInput, jahresBrutto: 10000 },
      {} as never,
      2026,
    );
    expect(result.lohnsteuerGeschaetzt).toBe(0);
    expect(result.sozialversicherungGeschaetzt).toBeCloseTo(250 * 0.2165, 6);
    expect(result.nettoGeschaetzt).toBeCloseTo(250 - result.sozialversicherungGeschaetzt, 6);
  });

  it('derives the hourly rate from monthly salary with the x3/13 formula', () => {
    // 4000 EUR x 3 / (40 x 13) = 23.0769... EUR
    expect(stundenlohnAusGehalt(4000, 40)).toBeCloseTo(12000 / 520, 8);
    const result = ueberstundenEngine.calculate(
      {
        stunden: 10,
        zuschlagProzent: 0,
        modus: 'gehalt',
        monatsBrutto: 4000,
        wochenStunden: 40,
        jahresBrutto: 48000,
      },
      {} as never,
      2026,
    );
    expect(result.stundenlohnEffektiv).toBeCloseTo(12000 / 520, 8);
    expect(result.ueberstundenBrutto).toBeCloseTo(10 * (12000 / 520), 6);
  });

  it('applies the overtime premium to the gross amount', () => {
    const ohne = ueberstundenEngine.calculate(stundenlohnInput, {} as never, 2026);
    const mit = ueberstundenEngine.calculate(
      { ...stundenlohnInput, zuschlagProzent: 25 },
      {} as never,
      2026,
    );
    expect(mit.ueberstundenBrutto).toBeCloseTo(ohne.ueberstundenBrutto * 1.25, 6);
    expect(mit.nettoGeschaetzt).toBeGreaterThan(ohne.nettoGeschaetzt);
  });

  it('rejects invalid inputs', () => {
    expect(ueberstundenEngine.validate({ ...stundenlohnInput, stunden: 0 }).valid).toBe(false);
    expect(ueberstundenEngine.validate({ ...stundenlohnInput, stunden: -5 }).valid).toBe(false);
    expect(
      ueberstundenEngine.validate({ ...stundenlohnInput, zuschlagProzent: 301 }).valid,
    ).toBe(false);
    expect(
      ueberstundenEngine.validate({ ...stundenlohnInput, jahresBrutto: -5 }).valid,
    ).toBe(false);
    expect(
      ueberstundenEngine.validate({ ...stundenlohnInput, jahresBrutto: 10_000_000 }).valid,
    ).toBe(false);
    expect(
      ueberstundenEngine.validate({ ...stundenlohnInput, stundenlohn: 0 }).valid,
    ).toBe(false);
  });

  it('rejects missing gehalt-mode fields', () => {
    const base = {
      stunden: 10,
      zuschlagProzent: 0,
      modus: 'gehalt' as const,
      jahresBrutto: 48000,
    };
    expect(ueberstundenEngine.validate({ ...base, wochenStunden: 40 }).valid).toBe(false);
    expect(
      ueberstundenEngine.validate({ ...base, monatsBrutto: 4000, wochenStunden: 0 }).valid,
    ).toBe(false);
    expect(
      ueberstundenEngine.validate({ ...base, monatsBrutto: 4000, wochenStunden: 40 }).valid,
    ).toBe(true);
  });

  it('scales tax monotonically with the overtime amount', () => {
    const small = ueberstundenEngine.calculate(
      { ...stundenlohnInput, stunden: 5 },
      {} as never,
      2026,
    );
    const big = ueberstundenEngine.calculate(
      { ...stundenlohnInput, stunden: 20 },
      {} as never,
      2026,
    );
    // Difference method is near-linear for small amounts; allow tariff curvature.
    const ratio = big.lohnsteuerGeschaetzt / small.lohnsteuerGeschaetzt;
    expect(ratio).toBeGreaterThan(3.5);
    expect(ratio).toBeLessThan(4.5);
  });
});
