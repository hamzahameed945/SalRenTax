import { describe, expect, it } from 'vitest';
import {
  AGUINALDO_EXENTO_UMA_2026,
  calculateAguinaldoIsrEstimado,
  mxAguinaldoEngine,
} from '../../src/calculators/labor/engines/mxAguinaldo';
import { umaDaily2026 } from '../../src/data/salary/mx/mexicoPayrollData2026';

const base = { diasAguinaldo: 15, mesesTrabajados: 12 };

describe('MX aguinaldo ISR layer — verified 2026 figures', () => {
  it('uses the verified 2026 UMA value ($117.31 diario, INEGI vigente 1-feb-2026)', () => {
    expect(umaDaily2026).toBe(117.31);
    // 30 UMAs × $117.31 = $3,519.30 (LISR Art. 93 fracc. XIV)
    expect(AGUINALDO_EXENTO_UMA_2026).toBeCloseTo(3519.3, 2);
  });

  it('matches the marginal math of the official Art. 96 monthly tariff (Anexo 8 RMF 2026, DOF 28-12-2025)', () => {
    // Tax at the top of each bracket equals the official cuota fija of the next bracket.
    // (1-decimal tolerance: official cuotas fijas are rounded to cents, so the
    // unrounded marginal math can differ by fractions of a cent.)
    expect(calculateAguinaldoIsrEstimado(844.59)).toBeCloseTo(16.22, 1);
    expect(calculateAguinaldoIsrEstimado(7168.51)).toBeCloseTo(420.95, 1);
    expect(calculateAguinaldoIsrEstimado(12598.02)).toBeCloseTo(1011.68, 1);
    expect(calculateAguinaldoIsrEstimado(14644.64)).toBeCloseTo(1339.14, 1);
    expect(calculateAguinaldoIsrEstimado(17533.64)).toBeCloseTo(1856.84, 1);
    expect(calculateAguinaldoIsrEstimado(35362.83)).toBeCloseTo(5665.16, 1);
    expect(calculateAguinaldoIsrEstimado(55736.68)).toBeCloseTo(10457.09, 1);
    expect(calculateAguinaldoIsrEstimado(106410.5)).toBeCloseTo(25659.23, 1);
    expect(calculateAguinaldoIsrEstimado(141880.66)).toBeCloseTo(37009.69, 1);
    expect(calculateAguinaldoIsrEstimado(425641.99)).toBeCloseTo(133488.54, 1);
    // Marginal example: 6.4% on the excess over $844.59
    expect(calculateAguinaldoIsrEstimado(1480.7)).toBeCloseTo(56.93, 2);
  });

  it('returns 0 ISR for zero or negative taxable base', () => {
    expect(calculateAguinaldoIsrEstimado(0)).toBe(0);
    expect(calculateAguinaldoIsrEstimado(-100)).toBe(0);
  });
});

describe('MX aguinaldo engine — gross → exento → gravada → ISR → neto (7 published pages)', () => {
  const cases: Array<{
    sueldo: number;
    bruto: number;
    exento: number;
    gravada: number;
    isr: number;
    neto: number;
  }> = [
    { sueldo: 10000, bruto: 5000, exento: 3519.3, gravada: 1480.7, isr: 56.93, neto: 4943.07 },
    { sueldo: 15000, bruto: 7500, exento: 3519.3, gravada: 3980.7, isr: 216.93, neto: 7283.07 },
    { sueldo: 20000, bruto: 10000, exento: 3519.3, gravada: 6480.7, isr: 376.93, neto: 9623.07 },
    { sueldo: 30000, bruto: 15000, exento: 3519.3, gravada: 11480.7, isr: 890.11, neto: 14109.89 },
    { sueldo: 50000, bruto: 25000, exento: 3519.3, gravada: 21480.7, isr: 2699.94, neto: 22300.06 },
    { sueldo: 75000, bruto: 37500, exento: 3519.3, gravada: 33980.7, isr: 5369.94, neto: 32130.06 },
    { sueldo: 100000, bruto: 50000, exento: 3519.3, gravada: 46480.7, isr: 8280.08, neto: 41719.92 },
  ];

  for (const c of cases) {
    it(`sueldo $${c.sueldo}: ISR $${c.isr}, neto $${c.neto}`, () => {
      const v = mxAguinaldoEngine.validate({ sueldoMensual: c.sueldo, ...base });
      expect(v.valid).toBe(true);
      const r = mxAguinaldoEngine.calculate({ sueldoMensual: c.sueldo, ...base });
      expect(r.aguinaldoBruto).toBeCloseTo(c.bruto, 2);
      expect(r.montoExento).toBeCloseTo(c.exento, 2);
      expect(r.baseGravada).toBeCloseTo(c.gravada, 2);
      expect(r.isrEstimado).toBeCloseTo(c.isr, 2);
      expect(r.aguinaldoNeto).toBeCloseTo(c.neto, 2);
      // Invariants
      expect(r.aguinaldoNeto).toBeCloseTo(r.aguinaldoBruto - r.isrEstimado, 2);
      expect(r.baseGravada).toBeCloseTo(r.aguinaldoBruto - r.montoExento, 2);
    });
  }

  it('pays no ISR when the bruto is fully within the 30-UMA exemption', () => {
    // sueldo $6,000 → bruto $3,000 < $3,519.30 → todo exento
    const r = mxAguinaldoEngine.calculate({ sueldoMensual: 6000, ...base });
    expect(r.aguinaldoBruto).toBeCloseTo(3000, 2);
    expect(r.montoExento).toBeCloseTo(3000, 2);
    expect(r.baseGravada).toBe(0);
    expect(r.isrEstimado).toBe(0);
    expect(r.aguinaldoNeto).toBeCloseTo(3000, 2);
  });

  it('prorates by months worked (6 of 12)', () => {
    const r = mxAguinaldoEngine.calculate({ sueldoMensual: 12000, diasAguinaldo: 15, mesesTrabajados: 6 });
    expect(r.aguinaldoBruto).toBeCloseTo(3000, 2);
    expect(r.isrEstimado).toBe(0);
  });
});

describe('MX aguinaldo engine — validation (existing exports intact)', () => {
  it('rejects invalid inputs', () => {
    expect(mxAguinaldoEngine.validate({ sueldoMensual: 0, ...base }).valid).toBe(false);
    expect(mxAguinaldoEngine.validate({ sueldoMensual: -5000, ...base }).valid).toBe(false);
    expect(mxAguinaldoEngine.validate({ sueldoMensual: 10000, diasAguinaldo: 0, mesesTrabajados: 12 }).valid).toBe(false);
    expect(mxAguinaldoEngine.validate({ sueldoMensual: 10000, diasAguinaldo: 15, mesesTrabajados: 13 }).valid).toBe(false);
  });

  it('keeps the legacy result shape (salarioDiario, aguinaldoBruto)', () => {
    const r = mxAguinaldoEngine.calculate({ sueldoMensual: 12000, ...base });
    expect(r.salarioDiario).toBeCloseTo(400, 2);
    expect(r.aguinaldoBruto).toBeCloseTo(6000, 2);
  });
});
