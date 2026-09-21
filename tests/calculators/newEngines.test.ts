import { describe, expect, it } from 'vitest';
import { brFeriasEngine } from '../../src/calculators/labor/engines/brFerias';
import { brHorasExtrasEngine } from '../../src/calculators/labor/engines/brHorasExtras';
import { dePartTimeSalaryEngine } from '../../src/calculators/salary/engines/dePartTimeSalary';
import { deMinijobEngine } from '../../src/calculators/salary/engines/deMinijob';
describe('new salary/labor engines',()=>{
  it('calculates Brazil vacation 1/3',()=>expect(brFeriasEngine.calculate({monthlySalary:3000,vacationDays:30}, {} as never, 2026).totalGross).toBe(4000));
  it('calculates overtime from an adjustable premium',()=>expect(brHorasExtrasEngine.calculate({monthlySalary:3000,monthlyHours:220,overtimeHours:10,premiumPercent:50}, {} as never, 2026).overtimePay).toBeCloseTo(204.55,1));
  it('scales German part-time salary proportionally',()=>expect(dePartTimeSalaryEngine.calculate({fullTimeMonthlyGross:4000,fullTimeHoursPerWeek:40,partTimeHoursPerWeek:20}, {} as never, 2026).partTimeMonthlyGross).toBe(2000));
  it('checks the 603 euro minijob threshold',()=>expect(deMinijobEngine.calculate({hourlyWage:13.9,hoursPerMonth:40}, {} as never, 2026).withinLimit).toBe(true));
});
