import { describe, expect, it } from 'vitest';
import { usTaxRefundEngine } from '../../src/calculators/salary/engines/us/usTaxRefund';

describe('usTaxRefund engine', () => {
  it('computes refund for a single filer with no children', () => {
    // $75,000 - $16,100 std ded = $58,900 taxable
    // Tax: 10% x $12,400 ($1,240) + 12% x $38,000 ($4,560) + 22% x $8,500 ($1,870) = $7,670
    const r = usTaxRefundEngine.calculate({
      filingStatus: 'single',
      annualIncome: 75000,
      withholding: 9000,
      qualifyingChildren: 0,
    });
    expect(r.grossTax).toBe(7670);
    expect(r.marginalRate).toBe(0.22);
    expect(r.refund).toBe(1330);
    expect(r.amountOwed).toBe(0);
    expect(r.netTaxLiability).toBe(7670);
  });

  it('computes amount owed when withholding is short', () => {
    const r = usTaxRefundEngine.calculate({
      filingStatus: 'single',
      annualIncome: 75000,
      withholding: 5000,
      qualifyingChildren: 0,
    });
    expect(r.refund).toBe(0);
    expect(r.amountOwed).toBe(2670); // 7670 - 5000
  });

  it('applies the full $2,200/child CTC for a joint filer', () => {
    // $120,000 - $32,200 = $87,800 taxable
    // Tax: 10% x $24,800 ($2,480) + 12% x $63,000 ($7,560) = $10,040
    // CTC: 2 x $2,200 = $4,400 (no phase-out at $120k), net tax $5,640
    const r = usTaxRefundEngine.calculate({
      filingStatus: 'marriedJointly',
      annualIncome: 120000,
      withholding: 8000,
      qualifyingChildren: 2,
    });
    expect(r.grossTax).toBe(10040);
    expect(r.childTaxCredit).toBe(4400);
    expect(r.ctcNonRefundable).toBe(4400);
    expect(r.netTaxLiability).toBe(5640);
    expect(r.refund).toBe(2360); // 8000 - 5640
  });

  it('pays the refundable ACTC when liability is smaller than the credit', () => {
    // $20,000 - $16,100 = $3,900 taxable -> $390 tax
    // CTC $4,400; $390 non-refundable; ACTC = min($4,010, $3,400, 15% x $17,500 = $2,625)
    const r = usTaxRefundEngine.calculate({
      filingStatus: 'single',
      annualIncome: 20000,
      withholding: 500,
      qualifyingChildren: 2,
    });
    expect(r.grossTax).toBe(390);
    expect(r.ctcNonRefundable).toBe(390);
    expect(r.refundableCredit).toBe(2625);
    expect(r.netTaxLiability).toBe(0);
    expect(r.refund).toBe(3125); // 500 + 2625
  });

  it('caps the OBBBA overtime deduction at $12,500 single / $25,000 joint', () => {
    const single = usTaxRefundEngine.calculate({
      filingStatus: 'single',
      annualIncome: 100000,
      withholding: 12000,
      qualifyingChildren: 0,
      overtimePremiumDeduction: 15000,
    });
    expect(single.overtimeDeductionApplied).toBe(12500);
    // taxable = 100,000 - 16,100 - 12,500 = $71,400
    // Tax: $1,240 + $4,560 + 22% x $21,000 ($4,620) = $10,420
    expect(single.grossTax).toBe(10420);

    const joint = usTaxRefundEngine.calculate({
      filingStatus: 'marriedJointly',
      annualIncome: 100000,
      withholding: 12000,
      qualifyingChildren: 0,
      overtimePremiumDeduction: 30000,
    });
    expect(joint.overtimeDeductionApplied).toBe(25000);
  });

  it('phases out the OBBBA deduction above $150k single MAGI', () => {
    // $160,000 MAGI: excess $10,000 -> reduction floor(10) x $100 = $1,000
    const r = usTaxRefundEngine.calculate({
      filingStatus: 'single',
      annualIncome: 160000,
      withholding: 30000,
      qualifyingChildren: 0,
      overtimePremiumDeduction: 12500,
    });
    expect(r.overtimeDeductionApplied).toBe(11500);
    expect(r.obbbaPhaseOutApplied).toBe(true);
  });

  it('caps the tips deduction at $25,000', () => {
    const r = usTaxRefundEngine.calculate({
      filingStatus: 'single',
      annualIncome: 60000,
      withholding: 3000,
      qualifyingChildren: 0,
      tipsDeduction: 30000,
    });
    expect(r.tipsDeductionApplied).toBe(25000);
    // taxable = 60,000 - 16,100 - 25,000 = $18,900
    // Tax: $1,240 + 12% x $6,500 ($780) = $2,020
    expect(r.grossTax).toBe(2020);
  });

  it('phases out the CTC above $200k single MAGI', () => {
    // $210,000: excess $10,000 -> ceil(10) x $50 = $500 reduction
    const r = usTaxRefundEngine.calculate({
      filingStatus: 'single',
      annualIncome: 210000,
      withholding: 40000,
      qualifyingChildren: 1,
    });
    expect(r.childTaxCredit).toBe(1700); // 2200 - 500
    expect(r.ctcPhaseOutApplied).toBe(true);
  });

  it('rejects invalid inputs', () => {
    expect(
      usTaxRefundEngine.validate({
        filingStatus: 'single',
        annualIncome: -500,
        withholding: 0,
        qualifyingChildren: 0,
      }).valid,
    ).toBe(false);

    expect(
      usTaxRefundEngine.validate({
        filingStatus: 'single',
        annualIncome: 75000,
        withholding: 0,
        qualifyingChildren: 4,
      }).valid,
    ).toBe(false);

    expect(
      usTaxRefundEngine.validate({
        filingStatus: 'single',
        annualIncome: 75000,
        withholding: 9000,
        qualifyingChildren: 1,
        tipsDeduction: -100,
      }).valid,
    ).toBe(false);
  });

  it('accepts a valid input', () => {
    const v = usTaxRefundEngine.validate({
      filingStatus: 'marriedJointly',
      annualIncome: 95000,
      withholding: 11000,
      qualifyingChildren: 2,
      overtimePremiumDeduction: 3000,
    });
    expect(v.valid).toBe(true);
  });
});
