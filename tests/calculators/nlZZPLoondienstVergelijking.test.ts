import { describe, expect, it } from 'vitest';
import { nlZZPLoondienstEngine } from '../../src/calculators/salary/engines/nl/nlZZPLoondienstVergelijking';
import { nlBruttoNettoEngine } from '../../src/calculators/salary/engines/nl/nlBruttoNetto';

/**
 * Verified 2026 figures used here:
 * - zelfstandigenaftrek €1.200 (Belastingdienst 2026, KVK)
 * - MKB-winstvrijstelling 12.70% (Knab, Rabobank, Informer)
 * - Zvw verlaagde bijdrage 4.85% over max. €79.409 (KVK)
 */

const baseInput = {
  hourlyRate: 75,
  billableHours: 1200,
  businessCosts: 5000,
  grossMonthlySalary: 3500,
};

describe('nlZZPLoondienst engine — validation', () => {
  it('rejects missing/zero inputs', () => {
    expect(nlZZPLoondienstEngine.validate({ ...baseInput, hourlyRate: 0 }).valid).toBe(false);
    expect(nlZZPLoondienstEngine.validate({ ...baseInput, billableHours: 0 }).valid).toBe(false);
    expect(nlZZPLoondienstEngine.validate({ ...baseInput, grossMonthlySalary: 0 }).valid).toBe(false);
  });

  it('rejects negative business costs', () => {
    const v = nlZZPLoondienstEngine.validate({ ...baseInput, businessCosts: -100 });
    expect(v.valid).toBe(false);
  });

  it('accepts a correct input', () => {
    const v = nlZZPLoondienstEngine.validate(baseInput);
    expect(v.valid).toBe(true);
  });
});

describe('nlZZPLoondienst engine — ZZP side (2026 figures)', () => {
  // 75 €/h × 1200 h = €90.000 omzet; − €5.000 kosten → €85.000 brutowinst
  // urencriterium: 1200 < 1225 → false by default → geen zelfstandigenaftrek
  it('computes the ZZP breakdown without zelfstandigenaftrek under 1225 hours', () => {
    const r = nlZZPLoondienstEngine.calculate(baseInput, {} as never, 2026);
    const z = r.zzp;

    expect(z.jaarOmzet).toBe(90_000);
    expect(z.brutoWinst).toBe(85_000);
    expect(z.urencriteriumMet).toBe(false);
    expect(z.zelfstandigenaftrek).toBe(0);
    expect(z.mkbWinstvrijstelling).toBeCloseTo(85_000 * 0.127, 2); // 12.70%
    expect(z.belastbareWinst).toBeCloseTo(85_000 * 0.873, 2);
    // Zvw: 4.85% of belastbare winst (< €79.409 cap)
    expect(z.zvwBijdrage).toBeCloseTo(z.belastbareWinst * 0.0485, 2);
    expect(z.nettoJaar).toBe(z.brutoWinst - z.inkomstenbelasting - z.zvwBijdrage);
    expect(z.nettoMaand).toBeCloseTo(z.nettoJaar / 12, 6);
    expect(z.nettoPerDeclarabelUur).toBeCloseTo(z.nettoJaar / 1200, 6);
    expect(z.effectiefTarief).toBeCloseTo((z.inkomstenbelasting + z.zvwBijdrage) / z.jaarOmzet, 6);
  });

  it('applies the €1.200 zelfstandigenaftrek when the 1225-hour criterion is met', () => {
    const r = nlZZPLoondienstEngine.calculate(
      { ...baseInput, billableHours: 1300, urencriteriumMet: true },
      {} as never,
      2026,
    );
    const z = r.zzp;

    expect(z.urencriteriumMet).toBe(true);
    expect(z.jaarOmzet).toBe(75 * 1300);          // 97.500
    expect(z.brutoWinst).toBe(97_500 - 5_000);    // 92.500
    expect(z.zelfstandigenaftrek).toBe(1_200);    // verified 2026 figure
    expect(z.winstNaOndernemersaftrek).toBe(91_300);
    expect(z.mkbWinstvrijstelling).toBeCloseTo(91_300 * 0.127, 2);
    expect(z.belastbareWinst).toBeCloseTo(91_300 * 0.873, 2);
  });

  it('lets an explicit override meet the criterion below 1225 billable hours', () => {
    const r = nlZZPLoondienstEngine.calculate(
      { ...baseInput, urencriteriumMet: true },
      {} as never,
      2026,
    );
    expect(r.zzp.urencriteriumMet).toBe(true);
    expect(r.zzp.zelfstandigenaftrek).toBe(1_200);
  });

  it('caps the zelfstandigenaftrek at the gross profit', () => {
    // €20/h × 200 h − €0 kosten = €4.000 profit, but criterion met manually → min(4000, 1200)
    const r = nlZZPLoondienstEngine.calculate(
      { hourlyRate: 20, billableHours: 200, businessCosts: 0, grossMonthlySalary: 2000, urencriteriumMet: true },
      {} as never,
      2026,
    );
    expect(r.zzp.zelfstandigenaftrek).toBe(1_200);
    expect(r.zzp.winstNaOndernemersaftrek).toBe(2_800);
  });

  it('caps the Zvw contribution at €79.409 × 4.85%', () => {
    const r = nlZZPLoondienstEngine.calculate(
      { hourlyRate: 300, billableHours: 1500, businessCosts: 0, grossMonthlySalary: 3000, urencriteriumMet: true },
      {} as never,
      2026,
    );
    // belastbare winst is well above the cap → fixed maximum contribution
    expect(r.zzp.zvwBijdrage).toBeCloseTo(79_409 * 0.0485, 2); // €3.851,34
  });

  it('spot-checks the full ZZP math against hand-computed 2026 values', () => {
    // 75 €/h × 1300 h = 97.500; −5.000 → 92.500 brutowinst; criterion met
    const r = nlZZPLoondienstEngine.calculate(
      { ...baseInput, billableHours: 1300, urencriteriumMet: true },
      {} as never,
      2026,
    );
    const z = r.zzp;

    // belastbare winst = 91.300 × 0.873 = 79.704,90
    // box 1: 38.883 × 0.3575 = 13.900,67; (78.426 − 38.883) × 0.3756 = 14.852,35;
    //        (79.704,90 − 78.426) × 0.495 = 633,06 → 29.386,08
    expect(z.box1TaxRaw).toBeCloseTo(29_386.08, 1);
    // AHK: 3.115 − 0.06398 × (79.704,90 − 29.736) = 3.115 − 3.197,21 → 0 (zeroAt 78.426 exceeded)
    expect(z.algemeenHeffingskorting).toBe(0);
    // AK phase-out: 5.685 − 0.06510 × (92.500 − 45.592) = 5.685 − 3.053,71 = 2.631,29
    expect(z.arbeidskorting).toBeCloseTo(2_631.29, 1);
    expect(z.inkomstenbelasting).toBeCloseTo(z.box1TaxRaw - z.arbeidskorting, 1);
    // Zvw on belastbare winst 79.704,90 capped at 79.409 → 3.851,34
    expect(z.zvwBijdrage).toBeCloseTo(3_851.34, 1);
    expect(z.nettoMaand).toBeCloseTo((92_500 - z.inkomstenbelasting - z.zvwBijdrage) / 12, 1);
  });
});

describe('nlZZPLoondienst engine — loondienst side (reuses nlBruttoNetto)', () => {
  it('matches the nlBruttoNetto engine for the same salary', () => {
    const r = nlZZPLoondienstEngine.calculate(baseInput, {} as never, 2026);
    const direct = nlBruttoNettoEngine.calculate(
      { grossAnnual: 3500 * 12, includeVakantiegeld: true, payPeriod: 'monthly' },
      {} as never,
      2026,
    );
    const l = r.loondienst;

    expect(l.brutoMaand).toBe(3500);
    expect(l.vakantiegeld).toBe(42_000 * 0.08); // 8%
    expect(l.brutoJaar).toBe(45_360);
    expect(l.nettoJaar).toBe(direct.netAnnual);
    expect(l.nettoMaand).toBe(direct.netMonthly);
    expect(l.loonheffing).toBe(direct.incomeTaxAnnual);
    expect(l.nettoPerUur).toBeCloseTo(l.nettoJaar / 2080, 6);
  });

  it('honours includeVakantiegeld=false', () => {
    const r = nlZZPLoondienstEngine.calculate(
      { ...baseInput, includeVakantiegeld: false },
      {} as never,
      2026,
    );
    expect(r.loondienst.vakantiegeld).toBe(0);
    expect(r.loondienst.brutoJaar).toBe(42_000);
  });
});

describe('nlZZPLoondienst engine — comparison', () => {
  it('declares a winner and a signed difference', () => {
    const r = nlZZPLoondienstEngine.calculate(baseInput, {} as never, 2026);
    // €75/h × 1200 h vs €3.500/mo → ZZP clearly ahead
    expect(r.winner).toBe('zzp');
    expect(r.verschilNettoMaand).toBeGreaterThan(0);
    expect(r.verschilNettoJaar).toBeCloseTo(r.verschilNettoMaand * 12, 2);
  });

  it('declares loondienst the winner when the rate is too low', () => {
    const r = nlZZPLoondienstEngine.calculate(
      { ...baseInput, hourlyRate: 30 },
      {} as never,
      2026,
    );
    expect(r.winner).toBe('loondienst');
    expect(r.verschilNettoMaand).toBeLessThan(0);
  });

  it('solves a breakeven hourly rate that zeroes the difference', () => {
    const r = nlZZPLoondienstEngine.calculate(baseInput, {} as never, 2026);
    const breakeven = r.breakevenUurtarief;

    expect(breakeven).not.toBeNull();
    expect(breakeven!).toBeGreaterThan(0);
    expect(breakeven!).toBeLessThan(75); // current rate already beats loondienst

    // Re-run at the breakeven rate → difference should vanish
    const check = nlZZPLoondienstEngine.calculate(
      { ...baseInput, hourlyRate: breakeven! },
      {} as never,
      2026,
    );
    expect(Math.abs(check.verschilNettoMaand)).toBeLessThan(1);
  });

  it('reports the ZZP rate as a multiple of the employee gross hourly wage', () => {
    const r = nlZZPLoondienstEngine.calculate(baseInput, {} as never, 2026);
    // bruto jaar 45.360 / 2080 = €21,81/uur → 75 / 21,81 ≈ 3,44×
    expect(r.zzpTariefMultiplier).toBeCloseTo(75 / (45_360 / 2080), 4);
  });
});
