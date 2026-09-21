import { calculateProgressiveTax } from '../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../core/types';
import type { PayFrequency } from '../../core/frequency';
import { PERIODS_PER_YEAR } from '../../core/frequency';
import {
  federalBrackets2026MarriedJointly,
  federalBrackets2026Single,
  fica2026,
  standardDeduction2026,
} from '../../../data/salary/us/federalTax2026';

import { txStateEngine } from './usStates/tx';
import { ilStateEngine } from './usStates/il';
import { azStateEngine } from './usStates/az';
import { nyStateEngine } from './usStates/ny';
import { flStateEngine } from './usStates/fl';
import type { StateTaxEngine } from './usStates/types';

const stateEngines: Record<string, StateTaxEngine> = {
  TX: txStateEngine,
  IL: ilStateEngine,
  AZ: azStateEngine,
  NY: nyStateEngine,
  FL: flStateEngine,
};

export type FilingStatus = 'single' | 'marriedJointly' | 'marriedSeparately' | 'headOfHousehold';

export interface UsPaycheckInput {
  /** Gross pay for ONE pay period, in USD. */
  grossPayPerPeriod: number;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  /** Pre-tax deductions (e.g. 401k, HSA) for ONE pay period, in USD. */
  preTaxDeductionsPerPeriod: number;
  /** Optional 2-letter state code for state tax calculation. */
  stateCode?: string;
}

export interface UsPaycheckResult {
  grossPayPerPeriod: number;
  preTaxDeductionsPerPeriod: number;
  federalIncomeTaxPerPeriod: number;
  socialSecurityPerPeriod: number;
  medicarePerPeriod: number;
  stateIncomeTaxPerPeriod?: number;
  netPayPerPeriod: number;
  annualGrossPay: number;
  annualFederalIncomeTax: number;
  annualSocialSecurity: number;
  annualMedicare: number;
  annualStateIncomeTax?: number;
  effectiveFederalRate: number;
  effectiveStateRate?: number;
}

/** Country config placeholder — US paycheck engine currently uses only the 2026 data module directly. */
export interface UsCountryConfig {
  countryCode: 'US';
}

export const usPaycheckEngine: CalculatorEngine<
  UsPaycheckInput,
  UsPaycheckResult,
  UsCountryConfig
> = {
  validate(input: UsPaycheckInput): ValidationResult<UsPaycheckInput> {
    const errors: Partial<Record<keyof UsPaycheckInput, string>> = {};
    if (
      input.grossPayPerPeriod === undefined ||
      input.grossPayPerPeriod === null ||
      Number.isNaN(input.grossPayPerPeriod)
    ) {
      errors.grossPayPerPeriod = 'errors.invalidNumber';
    } else if (input.grossPayPerPeriod <= 0) {
      errors.grossPayPerPeriod = 'errors.mustBePositive';
    }
    if (
      input.preTaxDeductionsPerPeriod !== undefined &&
      input.preTaxDeductionsPerPeriod !== null &&
      (Number.isNaN(input.preTaxDeductionsPerPeriod) || input.preTaxDeductionsPerPeriod < 0)
    ) {
      errors.preTaxDeductionsPerPeriod = 'errors.invalidNumber';
    }
    if (input.stateCode && !stateEngines[input.stateCode.toUpperCase()]) {
      errors.stateCode = 'errors.unsupportedState';
    }
    if (input.filingStatus === 'marriedSeparately' || input.filingStatus === 'headOfHousehold') {
      errors.filingStatus = 'UNSUPPORTED_FILING_STATUS';
    }
    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UsPaycheckInput, _config: UsCountryConfig, year: number): UsPaycheckResult {
    if (year !== 2026) {
      throw new Error(`US paycheck engine only has verified data for tax year 2026 (got ${year}).`);
    }

    if (input.filingStatus === 'marriedSeparately' || input.filingStatus === 'headOfHousehold') {
      throw new Error('Married filing separately and Head of household are not supported yet.');
    }

    const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency];
    const preTax = Math.max(0, input.preTaxDeductionsPerPeriod || 0);
    const annualGrossPay = input.grossPayPerPeriod * periodsPerYear;
    const annualPreTaxDeductions = preTax * periodsPerYear;

    const standardDeduction =
      input.filingStatus === 'single'
        ? standardDeduction2026.single
        : standardDeduction2026.marriedJointly;

    const taxableIncome = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const brackets =
      input.filingStatus === 'single'
        ? federalBrackets2026Single
        : federalBrackets2026MarriedJointly;
    const { totalTax: annualFederalIncomeTax, effectiveRate } = calculateProgressiveTax(
      taxableIncome,
      brackets,
    );

    const ssTaxableAnnual = Math.min(annualGrossPay, fica2026.socialSecurityWageBase);
    const annualSocialSecurity = ssTaxableAnnual * fica2026.socialSecurityRate;

    let annualMedicare = annualGrossPay * fica2026.medicareRate;
    const additionalMedicareThreshold =
      input.filingStatus === 'single'
        ? fica2026.additionalMedicareThreshold.single
        : fica2026.additionalMedicareThreshold.marriedJointly;
    if (annualGrossPay > additionalMedicareThreshold) {
      annualMedicare +=
        (annualGrossPay - additionalMedicareThreshold) * fica2026.additionalMedicareRate;
    }

    const federalIncomeTaxPerPeriod = annualFederalIncomeTax / periodsPerYear;
    const socialSecurityPerPeriod = annualSocialSecurity / periodsPerYear;
    const medicarePerPeriod = annualMedicare / periodsPerYear;

    let stateIncomeTaxPerPeriod = 0;
    let annualStateIncomeTax = 0;
    let effectiveStateRate = 0;

    if (input.stateCode) {
      const stateEngine = stateEngines[input.stateCode.toUpperCase()];
      if (stateEngine) {
        const stateResult = stateEngine.calculate(input, annualGrossPay, annualPreTaxDeductions);
        annualStateIncomeTax = stateResult.annualStateIncomeTax;
        stateIncomeTaxPerPeriod = annualStateIncomeTax / periodsPerYear;
        effectiveStateRate = stateResult.effectiveStateRate;
      }
    }

    const netPayPerPeriod =
      input.grossPayPerPeriod -
      preTax -
      federalIncomeTaxPerPeriod -
      socialSecurityPerPeriod -
      medicarePerPeriod -
      stateIncomeTaxPerPeriod;

    return {
      grossPayPerPeriod: input.grossPayPerPeriod,
      preTaxDeductionsPerPeriod: preTax,
      federalIncomeTaxPerPeriod,
      socialSecurityPerPeriod,
      medicarePerPeriod,
      ...(input.stateCode ? { stateIncomeTaxPerPeriod } : {}),
      netPayPerPeriod,
      annualGrossPay,
      annualFederalIncomeTax,
      annualSocialSecurity,
      annualMedicare,
      ...(input.stateCode ? { annualStateIncomeTax } : {}),
      effectiveFederalRate: effectiveRate,
      ...(input.stateCode ? { effectiveStateRate } : {}),
    };
  },
};
