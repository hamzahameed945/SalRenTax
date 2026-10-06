import { describe, expect, it } from 'vitest';
import { esBajaLaboralEngine } from '../../src/calculators/labor/engines/esBajaLaboral';

describe('esBajaLaboral engine', () => {
  it('calculates the 60/75 tranches for a 30-day leave (base €3000)', () => {
    const r = esBajaLaboralEngine.calculate(
      { baseCotizacionMensual: 3000, diasBaja: 30 },
      {} as never,
      2026,
    );
    expect(r.baseReguladoraDiaria).toBe(100);
    expect(r.desglose.tramo60.dias).toBe(17);
    expect(r.desglose.tramo60.importe).toBe(1020);
    expect(r.desglose.tramo75.dias).toBe(10);
    expect(r.desglose.tramo75.importe).toBe(750);
    expect(r.totalPrestacion).toBe(1770);
  });

  it('splits the 60% tranche between employer (days 4–15) and INSS/Mutua (days 16–20)', () => {
    const r = esBajaLaboralEngine.calculate(
      { baseCotizacionMensual: 3000, diasBaja: 30 },
      {} as never,
      2026,
    );
    expect(r.desglose.tramo60.diasEmpresa).toBe(12);
    expect(r.desglose.tramo60.importeEmpresa).toBe(720);
    expect(r.desglose.tramo60.diasInss).toBe(5);
    expect(r.desglose.tramo60.importeInss).toBe(300);
    expect(r.desglose.tramo60.importeEmpresa + r.desglose.tramo60.importeInss)
      .toBe(r.desglose.tramo60.importe);
  });

  it('pays nothing for a 3-day leave (periodo de carencia)', () => {
    const r = esBajaLaboralEngine.calculate(
      { baseCotizacionMensual: 2400, diasBaja: 3 },
      {} as never,
      2026,
    );
    expect(r.desglose.diasCarencia).toBe(3);
    expect(r.desglose.tramo60.dias).toBe(0);
    expect(r.desglose.tramo75.dias).toBe(0);
    expect(r.totalPrestacion).toBe(0);
  });

  it('caps the 60% tranche at 17 days for long leaves', () => {
    const r = esBajaLaboralEngine.calculate(
      { baseCotizacionMensual: 3000, diasBaja: 365 },
      {} as never,
      2026,
    );
    expect(r.baseReguladoraDiaria).toBe(100);
    expect(r.desglose.tramo60.dias).toBe(17);
    expect(r.desglose.tramo60.importe).toBe(1020);
    expect(r.desglose.tramo75.dias).toBe(345);
    expect(r.desglose.tramo75.importe).toBe(345 * 75);
    expect(r.totalPrestacion).toBe(1020 + 345 * 75);
  });

  it('scales proportionally with the contribution base', () => {
    const r = esBajaLaboralEngine.calculate(
      { baseCotizacionMensual: 1500, diasBaja: 30 },
      {} as never,
      2026,
    );
    expect(r.baseReguladoraDiaria).toBe(50);
    expect(r.totalPrestacion).toBe(885);
  });

  it('validates a correct input', () => {
    const v = esBajaLaboralEngine.validate({ baseCotizacionMensual: 2000, diasBaja: 10 });
    expect(v.valid).toBe(true);
  });

  it('rejects a non-positive contribution base', () => {
    // 0 is treated as "not provided", like esFiniquito; negatives hit mustBePositive
    const v0 = esBajaLaboralEngine.validate({ baseCotizacionMensual: 0, diasBaja: 10 });
    expect(v0.valid).toBe(false);
    if (!v0.valid) expect(v0.errors.baseCotizacionMensual).toBe('errors.invalidNumber');

    const vNeg = esBajaLaboralEngine.validate({ baseCotizacionMensual: -500, diasBaja: 10 });
    expect(vNeg.valid).toBe(false);
    if (!vNeg.valid) expect(vNeg.errors.baseCotizacionMensual).toBe('errors.mustBePositive');

    const vNaN = esBajaLaboralEngine.validate({ baseCotizacionMensual: NaN, diasBaja: 10 });
    expect(vNaN.valid).toBe(false);
    if (!vNaN.valid) expect(vNaN.errors.baseCotizacionMensual).toBe('errors.invalidNumber');
  });

  it('rejects out-of-range or fractional day counts', () => {
    for (const dias of [0, -1, 366, 2.5]) {
      const v = esBajaLaboralEngine.validate({ baseCotizacionMensual: 2000, diasBaja: dias });
      expect(v.valid).toBe(false);
      if (!v.valid) expect(v.errors.diasBaja).toBe('errors.invalidNumber');
    }
  });
});
