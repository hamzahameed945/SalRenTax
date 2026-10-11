import { describe, expect, it } from 'vitest';
import { scStateEngine, calculateSciad } from '../../src/calculators/salary/engines/usStates/sc';
import { nyStateEngine } from '../../src/calculators/salary/engines/usStates/ny';

const single = { filingStatus: 'single' } as any;
const mfj = { filingStatus: 'marriedJointly' } as any;

describe('SC 2026 engine (Act 110: 1.99% to $30k, 5.21% above + SCIAD)', () => {
  it('SCIAD is full below the phase-out start', () => {
    expect(calculateSciad(40000, 'single')).toBe(15000);
    expect(calculateSciad(80000, 'marriedJointly')).toBe(30000);
    expect(calculateSciad(60000, 'headOfHousehold')).toBe(22500);
  });
  it('SCIAD is zero at/above the phase-out end', () => {
    expect(calculateSciad(95000, 'single')).toBe(0);
    expect(calculateSciad(200000, 'marriedJointly')).toBe(0);
  });
  it('SCIAD phases out linearly, reduction floored to $10s', () => {
    // single $50k AGI: fraction 10000/55000 -> reduction floor(15000*0.181818/10)*10 = 2720
    expect(calculateSciad(50000, 'single')).toBe(12280);
    // MFJ $100k AGI: fraction 20000/110000 -> reduction floor(30000*0.181818/10)*10 = 5450
    expect(calculateSciad(100000, 'marriedJointly')).toBe(24550);
  });
  it('SC $40k single = 1.99% of (40000-15000)', () => {
    expect(scStateEngine.calculate(single, 40000, 0).annualStateIncomeTax).toBeCloseTo(497.5, 2);
  });
  it('SC $50k single = 1.99% of 30000 + 5.21% of (37720-30000)', () => {
    expect(scStateEngine.calculate(single, 50000, 0).annualStateIncomeTax).toBeCloseTo(999.21, 1);
  });
  it('SC $100k single, SCIAD fully phased out = 597 + 70000*5.21%', () => {
    expect(scStateEngine.calculate(single, 100000, 0).annualStateIncomeTax).toBeCloseTo(4244, 1);
  });
  it('SC $100k MFJ = 597 + 45450*5.21%', () => {
    expect(scStateEngine.calculate(mfj, 100000, 0).annualStateIncomeTax).toBeCloseTo(2964.95, 1);
  });
  it('SC same schedule for every filing status', () => {
    const mfs = { filingStatus: 'marriedSeparately' } as any;
    expect(scStateEngine.calculate(mfs, 100000, 0).annualStateIncomeTax).toBeCloseTo(4244, 1);
  });
});

describe('NY 2026 engine (statutory 3.9%-10.9% schedule)', () => {
  it('NY $100k single = $4,859.75', () => {
    // taxable 92000: 4190.10 + 11350*5.9%
    expect(nyStateEngine.calculate(single, 100000, 0).annualStateIncomeTax).toBeCloseTo(4859.75, 1);
  });
  it('NY $150k single = $7,809.75', () => {
    expect(nyStateEngine.calculate(single, 150000, 0).annualStateIncomeTax).toBeCloseTo(7809.75, 1);
  });
  it('NY $200k single = $10,759.75', () => {
    expect(nyStateEngine.calculate(single, 200000, 0).annualStateIncomeTax).toBeCloseTo(10759.75, 1);
  });
  it('NY $250k single crosses $215,400 into the 6.85% bracket = $13,962.45', () => {
    expect(nyStateEngine.calculate(single, 250000, 0).annualStateIncomeTax).toBeCloseTo(13962.45, 1);
  });
  it('NY $100k MFJ = $4,200.80', () => {
    // taxable 83950: 1174.10 + 56050*5.4%
    expect(nyStateEngine.calculate(mfj, 100000, 0).annualStateIncomeTax).toBeCloseTo(4200.8, 1);
  });
  it('NY $500k single uses the 9.65% bracket', () => {
    // taxable 492000: 12140.35 + 276600*6.85% = 31087.45
    expect(nyStateEngine.calculate(single, 500000, 0).annualStateIncomeTax).toBeCloseTo(31087.45, 0);
  });
});
