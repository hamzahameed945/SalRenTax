import { describe, expect, it } from 'vitest';
import {
  ieChristmasBonusEngine,
  type IeChristmasBonusInput,
} from '../../src/calculators/labor/engines/ieChristmasBonus';

const calc = (input: IeChristmasBonusInput) =>
  ieChristmasBonusEngine.calculate(input, {} as never, 2026);

describe('ieChristmasBonus engine', () => {
  it('qualifies a State Pension (Contributory) pensioner with bonus = weekly payment', () => {
    const r = calc({ paymentType: 'statePensionContributory', duration: '12plus', weeklyAmount: 289.3 });
    expect(r.qualifies).toBe(true);
    expect(r.rule).toBe('long-term');
    expect(r.bonusAmount).toBe(289.3);
    expect(r.minimumApplied).toBe(false);
  });

  it('qualifies long-term schemes regardless of duration', () => {
    for (const paymentType of [
      'statePensionNonContributory',
      'disabilityAllowance',
      'oneParentFamilyPayment',
      'invalidityPension',
      'carersAllowance',
      'bereavedPartnersPension',
      'farmAssist',
    ] as const) {
      const r = calc({ paymentType, duration: 'under12', weeklyAmount: 254 });
      expect(r.qualifies).toBe(true);
      expect(r.rule).toBe('long-term');
      expect(r.bonusAmount).toBe(254);
    }
  });

  it('does not qualify a short-duration Jobseeker\'s Allowance claim', () => {
    const r = calc({ paymentType: 'jobseekersAllowance', duration: 'under12', weeklyAmount: 244 });
    expect(r.qualifies).toBe(false);
    expect(r.rule).toBe('needs-12-months');
    expect(r.durationRequirementMet).toBe(false);
    expect(r.bonusAmount).toBe(0);
  });

  it('qualifies a Jobseeker\'s Allowance claim of 12+ months with bonus = weekly payment', () => {
    const r = calc({ paymentType: 'jobseekersAllowance', duration: '12plus', weeklyAmount: 244 });
    expect(r.qualifies).toBe(true);
    expect(r.rule).toBe('needs-12-months');
    expect(r.durationRequirementMet).toBe(true);
    expect(r.bonusAmount).toBe(244);
  });

  it('applies the 12-month rule to Illness Benefit and Supplementary Welfare Allowance', () => {
    const under = calc({ paymentType: 'illnessBenefit', duration: 'under12', weeklyAmount: 200 });
    expect(under.qualifies).toBe(false);
    expect(under.bonusAmount).toBe(0);

    const over = calc({ paymentType: 'illnessBenefit', duration: '12plus', weeklyAmount: 200 });
    expect(over.qualifies).toBe(true);
    expect(over.bonusAmount).toBe(200);

    const swaUnder = calc({ paymentType: 'supplementaryWelfareAllowance', duration: 'under12', weeklyAmount: 200 });
    expect(swaUnder.qualifies).toBe(false);

    const swaOver = calc({ paymentType: 'supplementaryWelfareAllowance', duration: '12plus', weeklyAmount: 200 });
    expect(swaOver.qualifies).toBe(true);
    expect(swaOver.bonusAmount).toBe(200);
  });

  it('never qualifies Jobseeker\'s Benefit (short-term scheme)', () => {
    const r = calc({ paymentType: 'jobseekersBenefit', duration: '12plus', weeklyAmount: 244 });
    expect(r.qualifies).toBe(false);
    expect(r.rule).toBe('short-term-excluded');
    expect(r.bonusAmount).toBe(0);
  });

  it('applies the €20 statutory minimum when the weekly payment is lower', () => {
    const r = calc({ paymentType: 'disabilityAllowance', duration: '12plus', weeklyAmount: 15 });
    expect(r.qualifies).toBe(true);
    expect(r.bonusAmount).toBe(20);
    expect(r.minimumApplied).toBe(true);
  });

  it('carries the UI copy keys for timing and rule source', () => {
    const r = calc({ paymentType: 'carersAllowance', duration: '12plus', weeklyAmount: 270 });
    expect(r.timingNoteKey).toBe('ieChristmasBonus.timingNote');
    expect(r.ruleSourceKey).toBe('ieChristmasBonus.ruleSource');
  });

  it('rejects invalid inputs', () => {
    const badAmount = ieChristmasBonusEngine.validate({
      paymentType: 'disabilityAllowance',
      duration: '12plus',
      weeklyAmount: -5,
    });
    expect(badAmount.valid).toBe(false);

    const badType = ieChristmasBonusEngine.validate({
      paymentType: 'childBenefit' as never,
      duration: '12plus',
      weeklyAmount: 100,
    });
    expect(badType.valid).toBe(false);

    const badDuration = ieChristmasBonusEngine.validate({
      paymentType: 'disabilityAllowance',
      duration: '6months' as never,
      weeklyAmount: 100,
    });
    expect(badDuration.valid).toBe(false);

    const ok = ieChristmasBonusEngine.validate({
      paymentType: 'disabilityAllowance',
      duration: '12plus',
      weeklyAmount: 254,
    });
    expect(ok.valid).toBe(true);
  });
});
