import { describe, expect, it } from 'vitest';
import {
  nlHypotheekEngine,
  nibudFinancieringslastPercentage2026,
  annuityFactor,
  NHG_GRENS_2026,
  NIBUD_ALLEENSTAANDE_EXTRA_2026,
} from '../../src/calculators/salary/engines/nl/nlHypotheek';

describe('Nibud 2026 financieringslastpercentages', () => {
  it('applies 19.30% below €30.000', () => {
    expect(nibudFinancieringslastPercentage2026(25000)).toBe(19.30);
  });
  it('applies 20.20% at €30.000–€31.000', () => {
    expect(nibudFinancieringslastPercentage2026(30000)).toBe(20.20);
    expect(nibudFinancieringslastPercentage2026(30500)).toBe(20.20);
  });
  it('applies 21.70% across the wide €33.000–€60.000 band', () => {
    expect(nibudFinancieringslastPercentage2026(38880)).toBe(21.70);
    expect(nibudFinancieringslastPercentage2026(51840)).toBe(21.70);
    expect(nibudFinancieringslastPercentage2026(60000)).toBe(21.70);
  });
  it('applies 22.00% at €64.000–€65.000', () => {
    expect(nibudFinancieringslastPercentage2026(64800)).toBe(22.00);
  });
  it('applies 24.40% at €82.000–€84.000 (homefinance cross-check)', () => {
    expect(nibudFinancieringslastPercentage2026(83000)).toBe(24.40);
  });
  it('caps at 26.50% above €125.000', () => {
    expect(nibudFinancieringslastPercentage2026(125000)).toBe(26.50);
    expect(nibudFinancieringslastPercentage2026(250000)).toBe(26.50);
  });
});

describe('annuityFactor', () => {
  it('matches the known 4%/30y factor', () => {
    expect(annuityFactor(0.04, 30)).toBeCloseTo(209.4612, 3);
  });
  it('grows with lower rates and longer terms', () => {
    expect(annuityFactor(0.03, 30)).toBeGreaterThan(annuityFactor(0.04, 30));
    expect(annuityFactor(0.04, 30)).toBeGreaterThan(annuityFactor(0.04, 20));
  });
});

describe('nlHypotheekEngine — €4.000/month scenario', () => {
  const r = nlHypotheekEngine.calculate({ grossMonthly: 4000 }, {} as never, 2026);
  it('builds toetsinkomen incl. 8% vakantiegeld', () => {
    expect(r.toetsinkomenAnnual).toBeCloseTo(51840, 2);
  });
  it('computes max bruto maandlast from the Nibud percentage', () => {
    expect(r.financieringslastPercentage).toBe(21.70);
    expect(r.maxBrutoMaandlast).toBeCloseTo(937.44, 2);
  });
  it('converts monthly capacity to a max mortgage via the annuity formula', () => {
    expect(r.maxHypotheek).toBeCloseTo(196357, 0);
  });
  it('splits the first month into interest and repayment', () => {
    expect(r.eersteMaandRente).toBeCloseTo(196357 * 0.04 / 12, 0);
    expect(r.eersteMaandAflossing).toBeCloseTo(r.maxBrutoMaandlast - r.eersteMaandRente, 2);
  });
  it('flags NHG eligibility against the 2026 grens', () => {
    expect(NHG_GRENS_2026).toBe(470000);
    expect(r.pastBinnenNHG).toBe(true);
  });
});

describe('nlHypotheekEngine — variants', () => {
  it('€3.000/month → ~€147.268', () => {
    const r = nlHypotheekEngine.calculate({ grossMonthly: 3000 }, {} as never, 2026);
    expect(r.maxHypotheek).toBeCloseTo(147268, 0);
  });
  it('€5.000/month → ~€248.840 (22.00% band)', () => {
    const r = nlHypotheekEngine.calculate({ grossMonthly: 5000 }, {} as never, 2026);
    expect(r.financieringslastPercentage).toBe(22.00);
    expect(r.maxHypotheek).toBeCloseTo(248840, 0);
  });
  it('partner income counts fully (Nibud: 100% since 2023)', () => {
    const single = nlHypotheekEngine.calculate({ grossMonthly: 4000 }, {} as never, 2026);
    const dual = nlHypotheekEngine.calculate({ grossMonthly: 4000, partnerGrossMonthly: 2000 }, {} as never, 2026);
    expect(dual.toetsinkomenAnnual).toBeCloseTo(single.toetsinkomenAnnual * 1.5, 2);
    expect(dual.maxHypotheek).toBeGreaterThan(single.maxHypotheek);
  });
  it('single applicant gets the €17.000 Nibud 2026 bonus', () => {
    const base = nlHypotheekEngine.calculate({ grossMonthly: 4000 }, {} as never, 2026);
    const single = nlHypotheekEngine.calculate({ grossMonthly: 4000, singleApplicant: true }, {} as never, 2026);
    expect(single.singleBonus).toBe(NIBUD_ALLEENSTAANDE_EXTRA_2026);
    expect(single.maxHypotheek).toBeCloseTo(base.maxHypotheek + 17000, 0);
  });
  it('other monthly debts reduce the max mortgage', () => {
    const base = nlHypotheekEngine.calculate({ grossMonthly: 4000 }, {} as never, 2026);
    const indebted = nlHypotheekEngine.calculate({ grossMonthly: 4000, otherMonthlyDebts: 135 }, {} as never, 2026);
    expect(indebted.maxHypotheek).toBeLessThan(base.maxHypotheek);
    expect(indebted.maxHypotheek).toBeCloseTo(base.maxHypotheek - 135 * annuityFactor(0.04, 30), 0);
  });
  it('higher interest rate lowers the max mortgage', () => {
    const low = nlHypotheekEngine.calculate({ grossMonthly: 4000, annualInterestRate: 0.035 }, {} as never, 2026);
    const high = nlHypotheekEngine.calculate({ grossMonthly: 4000, annualInterestRate: 0.05 }, {} as never, 2026);
    expect(high.maxHypotheek).toBeLessThan(low.maxHypotheek);
  });
  it('net monthly estimate applies the 2026 marginal box-1 rate', () => {
    const r = nlHypotheekEngine.calculate({ grossMonthly: 4000 }, {} as never, 2026);
    // €51.840 falls in schijf 2 (37,56%)
    expect(r.marginalBox1Rate).toBe(0.3756);
    expect(r.nettoMaandlastIndicatie).toBeCloseTo(
      r.maxBrutoMaandlast - r.eersteMaandRente * 0.3756, 2);
  });
});

describe('nlHypotheekEngine validation', () => {
  it('rejects non-positive salary', () => {
    const v = nlHypotheekEngine.validate({ grossMonthly: 0 });
    expect(v.valid).toBe(false);
  });
  it('rejects absurd interest rates and terms', () => {
    expect(nlHypotheekEngine.validate({ grossMonthly: 4000, annualInterestRate: 0.5 }).valid).toBe(false);
    expect(nlHypotheekEngine.validate({ grossMonthly: 4000, loanTermYears: 50 }).valid).toBe(false);
  });
  it('accepts a minimal valid input', () => {
    expect(nlHypotheekEngine.validate({ grossMonthly: 3000 }).valid).toBe(true);
  });
});
