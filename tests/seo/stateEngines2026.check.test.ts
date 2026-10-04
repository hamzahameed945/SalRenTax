import { describe, expect, it } from 'vitest';
import { caStateEngine } from '../../src/calculators/salary/engines/usStates/ca';
import { wiStateEngine } from '../../src/calculators/salary/engines/usStates/wi';
import { txStateEngine } from '../../src/calculators/salary/engines/usStates/tx';
import { coStateEngine } from '../../src/calculators/salary/engines/usStates/co';
import { alStateEngine } from '../../src/calculators/salary/engines/usStates/al';

const single = { filingStatus: 'single' } as any;
const mfj = { filingStatus: 'marriedJointly' } as any;

describe('2026 state engines sanity', () => {
  it('CA $100k single', () => {
    const r = caStateEngine.calculate(single, 100000, 0);
    const expected = 11079*0.01 + 15185*0.02 + 15188*0.04 + 16090*0.06 + 15182*0.08 + 21736*0.093;
    expect(r.annualStateIncomeTax).toBeCloseTo(expected, 0);
  });
  it('WI $80k single = $2,896.58', () => {
    expect(wiStateEngine.calculate(single, 80000, 0).annualStateIncomeTax).toBeCloseTo(2896.58, 1);
  });
  it('TX is zero', () => {
    expect(txStateEngine.calculate(single, 100000, 0).annualStateIncomeTax).toBe(0);
  });
  it('CO $100k single = 4.4% of (100000-16100)', () => {
    expect(coStateEngine.calculate(single, 100000, 0).annualStateIncomeTax).toBeCloseTo(83900 * 0.044, 2);
  });
  it('AL $50k single = $2,310', () => {
    expect(alStateEngine.calculate(single, 50000, 0).annualStateIncomeTax).toBeCloseTo(2310, 2);
  });
  it('CA married uses MFJ brackets', () => {
    const r = caStateEngine.calculate(mfj, 100000, 0);
    const expected = 22158*0.01 + 30370*0.02 + 30376*0.04 + 6016*0.06; // taxable = 88920
    expect(r.annualStateIncomeTax).toBeCloseTo(expected, 0);
  });
});
