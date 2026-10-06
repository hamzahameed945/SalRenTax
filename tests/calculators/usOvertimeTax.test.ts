import { describe, expect, it } from 'vitest';
import {
  usOvertimeTaxEngine,
  OBBBA_OVERTIME_2026,
} from '../../src/calculators/salary/engines/us/usOvertimeTax';

describe('usOvertimeTax engine', () => {
  it('computes overtime gross as rate x 1.5 x hours, split into base + premium', () => {
    // $20/h, 200 OT hours -> gross $6,000; base $4,000; premium $2,000
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 20, overtimeHours: 200, filingStatus: 'single', taxBracket: 0.22 },
      {} as never,
      2026,
    );
    expect(r.overtimeGross).toBe(6000);
    expect(r.baseComponent).toBe(4000);
    expect(r.premiumComponent).toBe(2000);
    expect(r.bracketDerived).toBe(false);
    expect(r.marginalRate).toBe(0.22);
  });

  it('taxes overtime at the same marginal rate (myth-busting: not a higher rate)', () => {
    // $30/h, 100 hours -> gross $4,500 at 22% -> $990
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 30, overtimeHours: 100, filingStatus: 'single', taxBracket: 0.22 },
      {} as never,
      2026,
    );
    expect(r.taxOnOvertime).toBe(990);
  });

  it('computes the OBBBA premium deduction and estimated tax savings', () => {
    // Premium $2,000 < $12,500 single cap; savings = $2,000 x 12% = $240
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 20, overtimeHours: 200, filingStatus: 'single', annualSalary: 60000 },
      {} as never,
      2026,
    );
    expect(r.deductiblePremium).toBe(2000);
    expect(r.marginalRate).toBe(0.12); // 60k - 16.1k std ded = 43.9k => 12% bracket
    expect(r.taxSavings).toBe(240);
  });

  it('caps the OBBBA deduction at $12,500 for single filers', () => {
    // Premium = 50 x 0.5 x 1000 = $25,000 -> capped at $12,500
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 50, overtimeHours: 1000, filingStatus: 'single', annualSalary: 80000 },
      {} as never,
      2026,
    );
    expect(r.deductiblePremium).toBe(OBBBA_OVERTIME_2026.singleCap);
  });

  it('uses the $25,000 cap for married filing jointly', () => {
    // Premium = $25,000 -> fully within the joint cap
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 50, overtimeHours: 1000, filingStatus: 'marriedJointly', annualSalary: 120000 },
      {} as never,
      2026,
    );
    expect(r.deductiblePremium).toBe(OBBBA_OVERTIME_2026.jointCap);
  });

  it('applies the MAGI phase-out above $150k single', () => {
    // MAGI 155k -> $5k over -> reduction $500; premium $10k -> deductible $9,500
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 50, overtimeHours: 400, filingStatus: 'single', annualSalary: 155000 },
      {} as never,
      2026,
    );
    expect(r.phaseOutApplied).toBe(true);
    expect(r.deductiblePremium).toBe(9500);
  });

  it('zeros the deduction when fully phased out', () => {
    // MAGI 275k single -> reduction floor(125k/1000)*100 = $12,500, fully erases a $2k premium
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 20, overtimeHours: 200, filingStatus: 'single', annualSalary: 275000 },
      {} as never,
      2026,
    );
    expect(r.deductiblePremium).toBe(0);
    expect(r.taxSavings).toBe(0);
  });

  it('derives the marginal bracket from annual salary when no bracket is given', () => {
    // 200k single -> taxable 183.9k -> 24% bracket
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 40, overtimeHours: 100, filingStatus: 'single', annualSalary: 200000 },
      {} as never,
      2026,
    );
    expect(r.bracketDerived).toBe(true);
    expect(r.marginalRate).toBe(0.24);
    expect(r.taxOnOvertime).toBe(1440); // 40*1.5*100=6000 x 24%
  });

  it('still charges FICA on overtime (OBBBA does not cover payroll tax)', () => {
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 20, overtimeHours: 200, filingStatus: 'single', annualSalary: 60000 },
      {} as never,
      2026,
    );
    expect(r.ficaOnOvertime).toBeCloseTo(459, 0); // 6000 x 7.65%
  });

  it('adds tax savings to the effective net', () => {
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 20, overtimeHours: 200, filingStatus: 'single', annualSalary: 60000 },
      {} as never,
      2026,
    );
    expect(r.effectiveNet).toBe(r.netAfterTax + r.taxSavings);
  });

  it('rejects invalid inputs', () => {
    expect(usOvertimeTaxEngine.validate({ hourlyRate: 0, overtimeHours: 10, filingStatus: 'single', taxBracket: 0.22 }).valid).toBe(false);
    expect(usOvertimeTaxEngine.validate({ hourlyRate: 20, overtimeHours: -1, filingStatus: 'single', taxBracket: 0.22 }).valid).toBe(false);
    expect(usOvertimeTaxEngine.validate({ hourlyRate: 20, overtimeHours: 10, filingStatus: 'single', taxBracket: 0.5 }).valid).toBe(false);
    // neither salary nor bracket supplied
    expect(usOvertimeTaxEngine.validate({ hourlyRate: 20, overtimeHours: 10, filingStatus: 'single' }).valid).toBe(false);
    // valid with salary
    expect(usOvertimeTaxEngine.validate({ hourlyRate: 20, overtimeHours: 10, filingStatus: 'single', annualSalary: 60000 }).valid).toBe(true);
    // valid with direct bracket
    expect(usOvertimeTaxEngine.validate({ hourlyRate: 20, overtimeHours: 10, filingStatus: 'marriedJointly', taxBracket: 0.24 }).valid).toBe(true);
  });

  it('returns zero premium and savings for zero overtime hours', () => {
    const r = usOvertimeTaxEngine.calculate(
      { hourlyRate: 20, overtimeHours: 0, filingStatus: 'single', annualSalary: 60000 },
      {} as never,
      2026,
    );
    expect(r.overtimeGross).toBe(0);
    expect(r.deductiblePremium).toBe(0);
    expect(r.taxSavings).toBe(0);
  });
});
