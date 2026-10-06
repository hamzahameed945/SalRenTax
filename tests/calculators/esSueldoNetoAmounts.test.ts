import { describe, expect, it } from 'vitest';
import { spainSalaryEngine } from '../../src/calculators/salary/engines/es/spainSalary';

/**
 * Tests for the 8 es-es programmatic "sueldo neto" amount pages
 * (€18k/20k/22k/25k/28k/30k/35k/40k brutos anuales).
 *
 * They exercise the shared spainSalaryEngine at each published amount:
 * figures below were computed by the engine and spot-checked by hand
 * (e.g. €18.000: RNT = 18.000 − 1.170 − 2.000 = 14.830 → Art. 20
 * reducción €7.302 → base = 14.830 − 7.302 − 5.550 = 1.978 → IRPF
 * estatal 1.978 × 9,5% ≈ 187,91 + autonómico Madrid ≈ 168,13 = 356,04).
 */
const AMOUNTS: Array<{ gross: number; netAnnual: number; irpf: number }> = [
  { gross: 18000, netAnnual: 16473.96, irpf: 356.04 },
  { gross: 20000, netAnnual: 17425.24, irpf: 1274.76 },
  { gross: 22000, netAnnual: 18468.02, irpf: 2101.98 },
  { gross: 25000, netAnnual: 20364.5, irpf: 3010.5 },
  { gross: 28000, netAnnual: 22511.5, irpf: 3668.5 },
  { gross: 30000, netAnnual: 23908.74, irpf: 4141.26 },
  { gross: 35000, netAnnual: 27284.09, irpf: 5440.91 },
  { gross: 40000, netAnnual: 30659.44, irpf: 6740.56 },
];

describe('es-es sueldo-neto amount pages (spainSalaryEngine)', () => {
  it('computes the published net-annual and IRPF figures for each amount', () => {
    for (const { gross, netAnnual, irpf } of AMOUNTS) {
      const r = spainSalaryEngine.calculate(
        { grossAnnual: gross, paymentsPerYear: 14, comunidadAutonoma: 'madrid' },
        undefined as never,
        2026,
      );
      expect(r.netAnnual).toBeCloseTo(netAnnual, 1);
      expect(r.irpfTotalAnnual).toBeCloseTo(irpf, 1);
    }
  });

  it('charges exactly 6,50% employee Seguridad Social (all amounts under the cap)', () => {
    for (const { gross } of AMOUNTS) {
      // €40k/12 = €3.333 < base máxima €5.101,20/mes → no cap applies.
      const r = spainSalaryEngine.calculate(
        { grossAnnual: gross, paymentsPerYear: 14 },
        undefined as never,
        2026,
      );
      expect(r.ssTotalEmployee).toBeCloseTo(gross * 0.065, 2);
      expect(r.ssContingenciasComunes).toBeCloseTo(gross * 0.047, 2);
      expect(r.ssDesempleo).toBeCloseTo(gross * 0.0155, 2);
      expect(r.ssMei).toBeCloseTo(gross * 0.0015, 2);
      expect(r.ssFormacionProfesional).toBeCloseTo(gross * 0.001, 2);
    }
  });

  it('net annual equals gross minus SS minus IRPF; 12/14 paga splits are consistent', () => {
    for (const { gross } of AMOUNTS) {
      const r14 = spainSalaryEngine.calculate(
        { grossAnnual: gross, paymentsPerYear: 14 },
        undefined as never,
        2026,
      );
      const r12 = spainSalaryEngine.calculate(
        { grossAnnual: gross, paymentsPerYear: 12 },
        undefined as never,
        2026,
      );
      expect(r14.netAnnual).toBeCloseTo(
        gross - r14.ssTotalEmployee - r14.irpfTotalAnnual,
        2,
      );
      expect(r14.netPerPayment).toBeCloseTo(r14.netAnnual / 14, 2);
      expect(r14.netMonthly).toBeCloseTo(r14.netAnnual / 12, 2);
      // Annual net is identical in 12 and 14 pagas; only the per-payment amount differs.
      expect(r12.netAnnual).toBeCloseTo(r14.netAnnual, 2);
      expect(r12.netPerPayment).toBeCloseTo(r14.netAnnual / 12, 2);
    }
  });

  it('effective deduction rate rises with income (progressive IRPF)', () => {
    const rates = AMOUNTS.map(({ gross }) => {
      const r = spainSalaryEngine.calculate(
        { grossAnnual: gross, paymentsPerYear: 14 },
        undefined as never,
        2026,
      );
      return r.effectiveTotalDeductionRate;
    });
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1]);
    }
    expect(rates[0]).toBeGreaterThan(0);
    expect(rates[rates.length - 1]).toBeLessThan(0.5);
  });
});
