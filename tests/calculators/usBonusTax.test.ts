import { describe, expect, it } from 'vitest';
import {
  usBonusTaxEngine,
  US_BONUS_STATE_OPTIONS,
  FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026,
} from '../../src/calculators/salary/engines/us/usBonusTax';

const base = {
  bonusGross: 10_000,
  filingStatus: 'single' as const,
  stateCode: 'TX',
  annualSalary: 75_000,
};

describe('usBonusTax engine', () => {
  it('withholds 22% federal on a $10k bonus (Texas, single, $75k salary)', () => {
    const r = usBonusTaxEngine.calculate(base);
    expect(r.federalWithholding).toBe(2_200);
    expect(r.bonusWithheldAt22).toBe(10_000);
    expect(r.bonusWithheldAt37).toBe(0);
    expect(r.socialSecurity).toBe(620);
    expect(r.medicare).toBe(145);
    expect(r.additionalMedicare).toBe(0);
    expect(r.ficaTotal).toBe(765);
    expect(r.stateTax).toBe(0);
    expect(r.totalWithholding).toBe(2_965);
    expect(r.netBonus).toBe(7_035);
    expect(r.effectiveWithholdingRate).toBeCloseTo(0.2965, 4);
  });

  it('exposes the withholding-vs-actual-tax gap for a 12% bracket earner', () => {
    const r = usBonusTaxEngine.calculate({ ...base, annualSalary: 40_000 });
    expect(r.marginalRate).toBe(0.12);
    expect(r.actualFederalTaxOnBonus).toBe(1_200);
    expect(r.withholdingVsActual).toBe(1_000); // $2,200 withheld - $1,200 owed
    expect(r.netBonus).toBe(7_035);
  });

  it('uses 37% federal withholding on the bonus slice above $1M in supplemental wages', () => {
    const r = usBonusTaxEngine.calculate({
      ...base,
      ytdSupplementalWages: 995_000,
    });
    expect(r.bonusWithheldAt22).toBe(5_000);
    expect(r.bonusWithheldAt37).toBe(5_000);
    expect(r.federalWithholding).toBe(1_100 + 1_850); // $2,950
  });

  it('applies the Social Security wage base marginally and the 0.9% additional Medicare', () => {
    const nearCap = usBonusTaxEngine.calculate({ ...base, annualSalary: 180_000 });
    expect(nearCap.socialSecurity).toBeCloseTo(4_500 * 0.062, 2); // only $4,500 of bonus below the cap
    expect(nearCap.additionalMedicare).toBe(0);

    const overCap = usBonusTaxEngine.calculate({ ...base, annualSalary: 195_000 });
    expect(overCap.socialSecurity).toBe(0); // salary already above $184,500
    expect(overCap.additionalMedicare).toBe(45); // 0.9% on $5,000 above $200k total
  });

  it('computes a marginal state tax for California', () => {
    const r = usBonusTaxEngine.calculate({ ...base, stateCode: 'CA' });
    expect(r.stateTax).toBeCloseTo(887.57, 1);
    expect(r.netBonus).toBeCloseTo(7_035 - 887.57, 1);
  });

  it('validates inputs', () => {
    expect(usBonusTaxEngine.validate({ ...base, bonusGross: -100 }).valid).toBe(false);
    expect(usBonusTaxEngine.validate({ ...base, stateCode: 'XX' }).valid).toBe(false);
    expect(usBonusTaxEngine.validate({ ...base, annualSalary: -1 }).valid).toBe(false);
    expect(usBonusTaxEngine.validate({ ...base, filingStatus: 'headOfHousehold' as never }).valid).toBe(false);
    expect(usBonusTaxEngine.validate(base).valid).toBe(true);
  });

  it('offers all 50 states in the dropdown', () => {
    expect(US_BONUS_STATE_OPTIONS).toHaveLength(50);
    expect(US_BONUS_STATE_OPTIONS.map((s) => s.code)).toContain('TX');
    expect(US_BONUS_STATE_OPTIONS.find((s) => s.code === 'CA')?.name).toBe('California');
  });

  it('pins the 2026 federal supplemental rates (verified 2026-10-06)', () => {
    expect(FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026.flatRate).toBe(0.22);
    expect(FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026.overMillionRate).toBe(0.37);
    expect(FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026.millionThreshold).toBe(1_000_000);
  });
});
