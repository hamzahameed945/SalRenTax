import { describe, it, expect } from 'vitest';
import { frBruttoNettoEngine } from '../../src/calculators/salary/engines/fr/frBruttoNetto';

const approx = (v: number, expected: number) => expect(Math.abs(v - expected)).toBeLessThan(0.01);

describe('frBruttoNettoEngine', () => {
  it('3 000 € gross → net 2 374.79 € (all tranche 1)', () => {
    const r = frBruttoNettoEngine.calculate({ grossMonthly: 3000 }, {} as never, 2026);
    approx(r.totalEmployeeDeductions, 625.21);
    approx(r.netMonthly, 2374.79);
    expect(r.cet).toBe(0);
  });

  it('6 000 € gross → net 4 764.93 € (CET applies)', () => {
    const r = frBruttoNettoEngine.calculate({ grossMonthly: 6000 }, {} as never, 2026);
    approx(r.totalEmployeeDeductions, 1235.07);
    approx(r.netMonthly, 4764.93);
    expect(r.cet).toBeGreaterThan(0);
  });

  it('exactly at the PSS (4 005 €) → CET must NOT apply', () => {
    const r = frBruttoNettoEngine.calculate({ grossMonthly: 4005 }, {} as never, 2026);
    expect(r.cet).toBe(0);
  });

  it('just above the PSS (4 006 €) → CET applies on the full gross', () => {
    const r = frBruttoNettoEngine.calculate({ grossMonthly: 4006 }, {} as never, 2026);
    approx(r.cet, 4006 * 0.0014);
  });

  it('rejects non-positive input', () => {
    const v = frBruttoNettoEngine.validate({ grossMonthly: 0 });
    expect(v.valid).toBe(false);
  });
});
