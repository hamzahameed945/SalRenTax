import { describe, it, expect } from 'vitest';
import { itLordoNettoEngine } from '../../src/calculators/salary/engines/it/itLordoNetto';

const approx = (v: number, expected: number) => expect(Math.abs(v - expected)).toBeLessThan(0.01);

describe('itLordoNettoEngine', () => {
  it('RAL 30 000 € → net 20 977.11 €', () => {
    const r = itLordoNettoEngine.calculate({ grossAnnual: 30000 }, {} as never, 2026);
    approx(r.inps, 2757);
    approx(r.inpsExtra, 0);
    approx(r.taxableIncome, 27243);
    approx(r.irpef, 6265.89);
    approx(r.netAnnual, 20977.11);
  });

  it('RAL 60 000 € → net 38 835.50 € (+1% INPS above 56 224)', () => {
    const r = itLordoNettoEngine.calculate({ grossAnnual: 60000 }, {} as never, 2026);
    approx(r.inps, 5514);
    approx(r.inpsExtra, 37.76);
    approx(r.taxableIncome, 54448.24);
    approx(r.irpef, 15612.74);
    approx(r.netAnnual, 38835.5);
  });

  it('at the 56 224 € threshold → no extra INPS', () => {
    const r = itLordoNettoEngine.calculate({ grossAnnual: 56224 }, {} as never, 2026);
    expect(r.inpsExtra).toBe(0);
  });

  it('rejects non-positive input', () => {
    const v = itLordoNettoEngine.validate({ grossAnnual: 0 });
    expect(v.valid).toBe(false);
  });
});
