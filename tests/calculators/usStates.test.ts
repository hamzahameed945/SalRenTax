import { describe, expect, it } from 'vitest';
import { usPaycheckEngine } from '../../src/calculators/salary/engines/usPaycheck';
describe('US state paycheck wiring',()=>{
  const base={grossPayPerPeriod:2000,payFrequency:'monthly' as const,filingStatus:'single' as const,preTaxDeductionsPerPeriod:0};
  it('passes Illinois state tax into the result',()=>{const r=usPaycheckEngine.calculate({...base,stateCode:'IL'},{countryCode:'US'},2026);expect(r.annualStateIncomeTax).toBeGreaterThan(0);});
  it('keeps Florida state income tax at zero',()=>{const r=usPaycheckEngine.calculate({...base,stateCode:'FL'},{countryCode:'US'},2026);expect(r.annualStateIncomeTax).toBe(0);});
  it('keeps Texas state income tax at zero',()=>{const r=usPaycheckEngine.calculate({...base,stateCode:'TX'},{countryCode:'US'},2026);expect(r.annualStateIncomeTax).toBe(0);});
  it('passes New York state tax into the result',()=>{const r=usPaycheckEngine.calculate({...base,stateCode:'NY'},{countryCode:'US'},2026);expect(r.annualStateIncomeTax).toBeGreaterThan(0);});
});
