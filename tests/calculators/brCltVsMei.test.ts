import { describe, expect, it } from 'vitest';
import { brCltVsMeiEngine } from '../../src/calculators/labor/engines/brCltVsMei';

describe('Brazil CLT vs MEI validation', () => {
  const base = { grossMonthly: 5000, meiActivity: 'servicos' as const };

  it('accepts a valid input', () => {
    expect(brCltVsMeiEngine.validate(base).valid).toBe(true);
  });

  it('rejects non-positive gross', () => {
    expect(brCltVsMeiEngine.validate({ ...base, grossMonthly: 0 }).valid).toBe(false);
    expect(brCltVsMeiEngine.validate({ ...base, grossMonthly: -100 }).valid).toBe(false);
  });

  it('rejects unknown MEI activity', () => {
    // @ts-expect-error exercising runtime validation
    expect(brCltVsMeiEngine.validate({ ...base, meiActivity: 'ltda' }).valid).toBe(false);
  });
});

describe('Brazil CLT vs MEI engine', () => {
  it('uses the 2026 DAS value for services (R$ 86,05)', () => {
    const r = brCltVsMeiEngine.calculate({ grossMonthly: 5000, meiActivity: 'servicos' }, {} as never, 2026);
    expect(r.mei.das).toBe(86.05);
    expect(r.mei.netMonthly).toBeCloseTo(4913.95, 2);
    expect(r.mei.annualNet).toBeCloseTo(4913.95 * 12, 2);
  });

  it('uses the 2026 DAS value for commerce (R$ 82,05) and combined (R$ 87,05)', () => {
    const comercio = brCltVsMeiEngine.calculate({ grossMonthly: 5000, meiActivity: 'comercio' }, {} as never, 2026);
    expect(comercio.mei.das).toBe(82.05);
    const ambos = brCltVsMeiEngine.calculate({ grossMonthly: 5000, meiActivity: 'ambos' }, {} as never, 2026);
    expect(ambos.mei.das).toBe(87.05);
  });

  it('computes CLT monthly net with progressive INSS 2026 + IRRF with the R$5k exemption', () => {
    const r = brCltVsMeiEngine.calculate({ grossMonthly: 3000, meiActivity: 'servicos' }, {} as never, 2026);
    // INSS: 1621×7.5% + (2902.84−1621)×9% + (3000−2902.84)×12% = 248.60
    expect(r.clt.inss).toBeCloseTo(248.6, 1);
    // Gross ≤ R$5k: IRRF fully reduced to zero (Lei 15.270/2025)
    expect(r.clt.irrf).toBe(0);
    expect(r.clt.netMonthly).toBeCloseTo(2751.4, 1);
  });

  it('charges IRRF above the R$5k exemption band', () => {
    const r = brCltVsMeiEngine.calculate({ grossMonthly: 10000, meiActivity: 'servicos' }, {} as never, 2026);
    expect(r.clt.irrf).toBeGreaterThan(0);
    expect(r.clt.netMonthly).toBeLessThan(10000 - r.clt.inss);
  });

  it('annualises CLT with 13º + férias + 1/3, so CLT can win annually while MEI wins monthly', () => {
    const r = brCltVsMeiEngine.calculate({ grossMonthly: 3000, meiActivity: 'servicos' }, {} as never, 2026);
    // Monthly: MEI wins (DAS 86,05 < INSS 248,60)
    expect(r.betterMonthly).toBe('mei');
    expect(r.monthlyDifference).toBeLessThan(0);
    // Annual: CLT wins thanks to 13º + férias + 1/3
    expect(r.clt.decimoTerceiroNet).toBeCloseTo(2751.4, 1);
    expect(r.clt.feriasGross).toBeCloseTo(4000, 2);
    expect(r.clt.feriasNet).toBeGreaterThan(r.clt.netMonthly);
    expect(r.betterAnnual).toBe('clt');
    expect(r.annualDifference).toBeGreaterThan(0);
  });

  it('reports FGTS 8% annual as employer benefit', () => {
    const r = brCltVsMeiEngine.calculate({ grossMonthly: 5000, meiActivity: 'servicos' }, {} as never, 2026);
    expect(r.clt.fgtsAnnual).toBeCloseTo(5000 * 0.08 * 12, 2);
  });

  it('flags revenue above the R$81k MEI limit', () => {
    const over = brCltVsMeiEngine.calculate({ grossMonthly: 7000, meiActivity: 'servicos' }, {} as never, 2026);
    expect(over.mei.annualRevenue).toBe(84000);
    expect(over.mei.exceedsRevenueLimit).toBe(true);

    const under = brCltVsMeiEngine.calculate({ grossMonthly: 6000, meiActivity: 'servicos' }, {} as never, 2026);
    expect(under.mei.annualRevenue).toBe(72000);
    expect(under.mei.exceedsRevenueLimit).toBe(false);
  });
});
