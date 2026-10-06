import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { roundToCents } from '../../../core/math';
import {
  federalBrackets2026Single,
  federalBrackets2026MarriedJointly,
  standardDeduction2026,
  fica2026,
} from '../../../../data/salary/us/federalTax2026';
import type { StateTaxEngine } from '../usStates/types';
import type { UsPaycheckInput } from '../usPaycheck';
import { txStateEngine } from '../usStates/tx';
import { ilStateEngine } from '../usStates/il';
import { azStateEngine } from '../usStates/az';
import { nyStateEngine } from '../usStates/ny';
import { flStateEngine } from '../usStates/fl';
import { caStateEngine } from '../usStates/ca';
import { njStateEngine } from '../usStates/nj';
import { paStateEngine } from '../usStates/pa';
import { waStateEngine } from '../usStates/wa';
import { alStateEngine } from '../usStates/al';
import { akStateEngine } from '../usStates/ak';
import { arStateEngine } from '../usStates/ar';
import { coStateEngine } from '../usStates/co';
import { ctStateEngine } from '../usStates/ct';
import { deStateEngine } from '../usStates/de';
import { gaStateEngine } from '../usStates/ga';
import { hiStateEngine } from '../usStates/hi';
import { idStateEngine } from '../usStates/id';
import { inStateEngine } from '../usStates/in';
import { iaStateEngine } from '../usStates/ia';
import { ksStateEngine } from '../usStates/ks';
import { kyStateEngine } from '../usStates/ky';
import { laStateEngine } from '../usStates/la';
import { meStateEngine } from '../usStates/me';
import { mdStateEngine } from '../usStates/md';
import { maStateEngine } from '../usStates/ma';
import { miStateEngine } from '../usStates/mi';
import { mnStateEngine } from '../usStates/mn';
import { msStateEngine } from '../usStates/ms';
import { moStateEngine } from '../usStates/mo';
import { mtStateEngine } from '../usStates/mt';
import { neStateEngine } from '../usStates/ne';
import { nvStateEngine } from '../usStates/nv';
import { nhStateEngine } from '../usStates/nh';
import { nmStateEngine } from '../usStates/nm';
import { ncStateEngine } from '../usStates/nc';
import { ndStateEngine } from '../usStates/nd';
import { ohStateEngine } from '../usStates/oh';
import { okStateEngine } from '../usStates/ok';
import { orStateEngine } from '../usStates/or';
import { riStateEngine } from '../usStates/ri';
import { scStateEngine } from '../usStates/sc';
import { sdStateEngine } from '../usStates/sd';
import { tnStateEngine } from '../usStates/tn';
import { utStateEngine } from '../usStates/ut';
import { vtStateEngine } from '../usStates/vt';
import { vaStateEngine } from '../usStates/va';
import { wvStateEngine } from '../usStates/wv';
import { wiStateEngine } from '../usStates/wi';
import { wyStateEngine } from '../usStates/wy';

// ─── 2026 federal supplemental-wage withholding (VERIFIED 2026-10-06) ───────
// IRS Publication 15 (2026): employers paying supplemental wages separately
// from regular wages may withhold federal income tax at a FLAT 22% (the
// "percentage method") provided supplemental wages for the year have not
// exceeded $1,000,000 and the employee had federal withholding on regular
// wages in the current or prior year. Above $1,000,000, the excess MUST be
// withheld at 37%. This is WITHHOLDING ONLY — the final liability is
// recomputed at filing time at the employee's actual marginal rate.
// Sources: IRS Pub 15-T (2026); wisemonk.io supplemental-pay 2026 guide;
// Economic Times 2026 withholding guidance.
export const FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026 = {
  flatRate: 0.22,
  overMillionRate: 0.37,
  millionThreshold: 1_000_000,
} as const;

/** State options for the calculator dropdown (code + display name). */
export const US_BONUS_STATE_OPTIONS: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const;

/**
 * The same 50 state engines as usPaycheck, imported individually (the
 * `stateEngines` map inside usPaycheck is not exported, and usPaycheck itself
 * must not be modified). Each state engine's `calculate` returns the ANNUAL
 * state liability, which we use for a marginal (difference) estimate of the
 * state tax attributable to the bonus.
 */
const stateEngines: Record<string, StateTaxEngine> = {
  TX: txStateEngine,
  IL: ilStateEngine,
  AZ: azStateEngine,
  NY: nyStateEngine,
  FL: flStateEngine,
  CA: caStateEngine,
  NJ: njStateEngine,
  PA: paStateEngine,
  WA: waStateEngine,
  AL: alStateEngine,
  AK: akStateEngine,
  AR: arStateEngine,
  CO: coStateEngine,
  CT: ctStateEngine,
  DE: deStateEngine,
  GA: gaStateEngine,
  HI: hiStateEngine,
  ID: idStateEngine,
  IN: inStateEngine,
  IA: iaStateEngine,
  KS: ksStateEngine,
  KY: kyStateEngine,
  LA: laStateEngine,
  ME: meStateEngine,
  MD: mdStateEngine,
  MA: maStateEngine,
  MI: miStateEngine,
  MN: mnStateEngine,
  MS: msStateEngine,
  MO: moStateEngine,
  MT: mtStateEngine,
  NE: neStateEngine,
  NV: nvStateEngine,
  NH: nhStateEngine,
  NM: nmStateEngine,
  NC: ncStateEngine,
  ND: ndStateEngine,
  OH: ohStateEngine,
  OK: okStateEngine,
  OR: orStateEngine,
  RI: riStateEngine,
  SC: scStateEngine,
  SD: sdStateEngine,
  TN: tnStateEngine,
  UT: utStateEngine,
  VT: vtStateEngine,
  VA: vaStateEngine,
  WV: wvStateEngine,
  WI: wiStateEngine,
  WY: wyStateEngine,
};

export type UsBonusTaxFilingStatus = 'single' | 'marriedJointly';

export interface UsBonusTaxInput {
  /** Gross bonus amount in USD (the supplemental wage being paid). */
  bonusGross: number;
  filingStatus: UsBonusTaxFilingStatus;
  /** 2-letter state code for the state tax estimate. */
  stateCode: string;
  /**
   * Other 2026 wages from the same employer (regular salary) in USD. Used to
   * (a) apply the 2026 Social Security wage base, (b) derive the federal
   * marginal rate, and (c) compute the state tax marginally (state tax on
   * salary + bonus minus state tax on salary).
   */
  annualSalary: number;
  /**
   * Supplemental wages already paid to this employee in 2026 (same employer).
   * Drives the 22%-vs-37% federal withholding split at the $1M threshold.
   * Defaults to 0.
   */
  ytdSupplementalWages?: number;
}

export interface UsBonusTaxResult {
  /** Gross bonus entered. */
  bonusGross: number;
  /** Portion of the bonus withheld at 22% (annual supplemental ≤ $1M). */
  bonusWithheldAt22: number;
  /** Portion of the bonus withheld at 37% (annual supplemental > $1M). */
  bonusWithheldAt37: number;
  /** Federal income tax WITHHELD from the bonus (22% / 37% split). */
  federalWithholding: number;
  /** Employee Social Security on the bonus (6.2%, only below the 2026 wage base). */
  socialSecurity: number;
  /** Employee Medicare on the bonus (1.45%, no cap). */
  medicare: number;
  /** Additional 0.9% Medicare on the bonus portion above $200k of total wages. */
  additionalMedicare: number;
  /** Total FICA withheld (Social Security + Medicare + additional Medicare). */
  ficaTotal: number;
  /**
   * Estimated state income tax attributable to the bonus, computed with the
   * state engine's marginal approach: annual state tax on (salary + bonus)
   * minus annual state tax on (salary alone).
   */
  stateTax: number;
  /** All withholding combined (federal + FICA + state). */
  totalWithholding: number;
  /** Bonus left after all withholding — the cheque amount. */
  netBonus: number;
  /** Effective withholding rate on the bonus (total withholding / bonus). */
  effectiveWithholdingRate: number;
  /** Federal marginal income tax rate derived from total wages (salary + bonus). */
  marginalRate: number;
  /**
   * Estimated ACTUAL federal income tax owed on the bonus at filing time:
   * bonus × marginal rate. This is the myth-busting number — usually differs
   * from the 22% withheld.
   */
  actualFederalTaxOnBonus: number;
  /**
   * Federal withholding minus actual federal tax on the bonus. Positive means
   * more was withheld than owed (expect it back in your refund); negative
   * means you will owe the difference at filing time.
   */
  withholdingVsActual: number;
}

// ─── Engine ──────────────────────────────────────────────────────────────────

function stateTaxOnAnnualGross(
  stateCode: string,
  filingStatus: UsBonusTaxFilingStatus,
  annualGross: number,
): number {
  const engine = stateEngines[stateCode.toUpperCase()];
  if (!engine) return 0;
  // State engines only read input.filingStatus; the gross/deduction figures
  // are passed positionally. This mirrors how usPaycheck invokes them.
  const minimalInput = { filingStatus, stateCode: stateCode.toUpperCase() } as UsPaycheckInput;
  const result = engine.calculate(minimalInput, annualGross, 0);
  return result.annualStateIncomeTax ?? 0;
}

export const usBonusTaxEngine: CalculatorEngine<UsBonusTaxInput, UsBonusTaxResult, never> = {
  validate(input: UsBonusTaxInput): ValidationResult<UsBonusTaxInput> {
    const errors: Partial<Record<keyof UsBonusTaxInput, string>> = {};

    if (input.bonusGross === undefined || Number.isNaN(input.bonusGross) || input.bonusGross <= 0) {
      errors.bonusGross = 'errors.mustBePositive';
    }
    if (input.bonusGross > 100_000_000) {
      errors.bonusGross = 'errors.tooLarge';
    }

    if (input.filingStatus !== 'single' && input.filingStatus !== 'marriedJointly') {
      errors.filingStatus = 'errors.invalidNumber';
    }

    if (!input.stateCode || !stateEngines[input.stateCode.toUpperCase()]) {
      errors.stateCode = 'errors.unsupportedState';
    }

    if (input.annualSalary === undefined || Number.isNaN(input.annualSalary) || input.annualSalary < 0) {
      errors.annualSalary = 'errors.invalidNumber';
    }

    if (
      input.ytdSupplementalWages !== undefined &&
      (Number.isNaN(input.ytdSupplementalWages) || input.ytdSupplementalWages < 0)
    ) {
      errors.ytdSupplementalWages = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UsBonusTaxInput): UsBonusTaxResult {
    const bonus = input.bonusGross;
    const salary = Math.max(0, input.annualSalary ?? 0);
    const ytdSupp = Math.max(0, input.ytdSupplementalWages ?? 0);

    // ── Federal withholding: 22% up to $1M of annual supplemental wages,
    //    37% on everything above. ────────────────────────────────────────────
    const roomUnderMillion = Math.max(0, FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026.millionThreshold - ytdSupp);
    const bonusWithheldAt22 = roundToCents(Math.min(bonus, roomUnderMillion));
    const bonusWithheldAt37 = roundToCents(bonus - bonusWithheldAt22);
    const federalWithholding = roundToCents(
      bonusWithheldAt22 * FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026.flatRate +
        bonusWithheldAt37 * FEDERAL_SUPPLEMENTAL_WITHHOLDING_2026.overMillionRate,
    );

    // ── FICA: Social Security 6.2% only on wages below the 2026 wage base
    //    ($184,500); Medicare 1.45% uncapped; additional 0.9% Medicare on the
    //    bonus slice above $200k of total wages (employer withholding rule). ─
    const ssRoom = Math.max(0, fica2026.socialSecurityWageBase - salary);
    const socialSecurity = roundToCents(Math.min(bonus, ssRoom) * fica2026.socialSecurityRate);
    const medicare = roundToCents(bonus * fica2026.medicareRate);
    const medicareThreshold = 200_000; // employer withholding rule: per-employee, not status-dependent
    const bonusAboveThreshold = Math.max(0, Math.min(bonus, salary + bonus - medicareThreshold));
    const additionalMedicare = roundToCents(bonusAboveThreshold * fica2026.additionalMedicareRate);
    const ficaTotal = roundToCents(socialSecurity + medicare + additionalMedicare);

    // ── State: marginal estimate from the usPaycheck state engines ─────────
    // State withholding methods vary by state (flat supplemental rates vs.
    // aggregate method), so we report the true LIABILITY attributable to the
    // bonus: state tax on (salary + bonus) minus state tax on (salary).
    const stateTaxWithBonus = stateTaxOnAnnualGross(input.stateCode, input.filingStatus, salary + bonus);
    const stateTaxWithoutBonus = stateTaxOnAnnualGross(input.stateCode, input.filingStatus, salary);
    const stateTax = roundToCents(Math.max(0, stateTaxWithBonus - stateTaxWithoutBonus));

    // ── Actual tax vs withholding (the misconception-buster) ──────────────
    const standardDeduction =
      input.filingStatus === 'marriedJointly'
        ? standardDeduction2026.marriedJointly
        : standardDeduction2026.single;
    const totalTaxable = Math.max(0, salary + bonus - standardDeduction);
    const brackets =
      input.filingStatus === 'marriedJointly'
        ? federalBrackets2026MarriedJointly
        : federalBrackets2026Single;
    const topBracket = brackets.find((b) => b.max === null || totalTaxable < b.max) ?? brackets[brackets.length - 1];
    const marginalRate = topBracket.rate;
    const actualFederalTaxOnBonus = roundToCents(bonus * marginalRate);
    const withholdingVsActual = roundToCents(federalWithholding - actualFederalTaxOnBonus);

    const totalWithholding = roundToCents(federalWithholding + ficaTotal + stateTax);
    const netBonus = roundToCents(bonus - totalWithholding);

    return {
      bonusGross: roundToCents(bonus),
      bonusWithheldAt22,
      bonusWithheldAt37,
      federalWithholding,
      socialSecurity,
      medicare,
      additionalMedicare,
      ficaTotal,
      stateTax,
      totalWithholding,
      netBonus,
      effectiveWithholdingRate: bonus > 0 ? totalWithholding / bonus : 0,
      marginalRate,
      actualFederalTaxOnBonus,
      withholdingVsActual,
    };
  },
};
