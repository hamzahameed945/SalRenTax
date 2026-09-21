import { calculateProgressiveTax } from '../../core/progressiveTax';
import type { TaxBracket } from '../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../core/types';
import type { PayFrequency } from '../../core/frequency';
import { PERIODS_PER_YEAR } from '../../core/frequency';
import {
  federalBrackets2026MarriedJointly,
  federalBrackets2026Single,
  federalBrackets2026MarriedSeparately,
  federalBrackets2026HeadOfHousehold,
  fica2026,
  standardDeduction2026,
} from '../../../data/salary/us/federalTax2026';

import { txStateEngine } from './usStates/tx';
import { ilStateEngine } from './usStates/il';
import { azStateEngine } from './usStates/az';
import { nyStateEngine } from './usStates/ny';
import { flStateEngine } from './usStates/fl';
import { caStateEngine } from './usStates/ca';
import { njStateEngine } from './usStates/nj';
import { paStateEngine } from './usStates/pa';
import { waStateEngine } from './usStates/wa';
import type { StateTaxEngine } from './usStates/types';

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
  /** Number of dependents (for future child tax credit calculations). */
  dependents?: number;
  /** Additional federal withholding per period (optional). */
  additionalFederalWithholding?: number;
}

export interface UsPaycheckResult {
  grossPayPerPeriod: number;
  preTaxDeductionsPerPeriod: number;
  federalIncomeTaxPerPeriod: number;
  socialSecurityPerPeriod: number;
  medicarePerPeriod: number;
  additionalMedicarePerPeriod?: number;
  stateIncomeTaxPerPeriod?: number;
  additionalFederalWithholdingPerPeriod?: number;
  netPayPerPeriod: number;
  annualGrossPay: number;
  annualFederalIncomeTax: number;
  annualSocialSecurity: number;
  annualMedicare: number;
  annualAdditionalMedicare?: number;
  annualStateIncomeTax?: number;
  annualAdditionalFederalWithholding?: number;
  effectiveFederalRate: number;
  effectiveStateRate?: number;
  effectiveTotalTaxRate: number;
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
    
    // Required field: grossPayPerPeriod
    if (
      input.grossPayPerPeriod === undefined ||
      input.grossPayPerPeriod === null ||
      Number.isNaN(input.grossPayPerPeriod) ||
      input.grossPayPerPeriod === 0
    ) {
      errors.grossPayPerPeriod = 'errors.invalidNumber';
    } else if (input.grossPayPerPeriod < 0) {
      errors.grossPayPerPeriod = 'errors.mustBePositive';
    }
    
    // Optional field: preTaxDeductionsPerPeriod
    if (
      input.preTaxDeductionsPerPeriod !== undefined &&
      input.preTaxDeductionsPerPeriod !== null &&
      !Number.isNaN(input.preTaxDeductionsPerPeriod) &&
      input.preTaxDeductionsPerPeriod < 0
    ) {
      errors.preTaxDeductionsPerPeriod = 'errors.mustBePositive';
    }
    
    // Optional field: stateCode
    if (input.stateCode && !stateEngines[input.stateCode.toUpperCase()]) {
      errors.stateCode = 'errors.unsupportedState';
    }
    
    // Optional field: dependents
    if (
      input.dependents !== undefined &&
      input.dependents !== null &&
      !Number.isNaN(input.dependents) &&
      (input.dependents < 0 || !Number.isInteger(input.dependents))
    ) {
      errors.dependents = 'errors.invalidNumber';
    }
    
    // Optional field: additionalFederalWithholding
    if (
      input.additionalFederalWithholding !== undefined &&
      input.additionalFederalWithholding !== null &&
      !Number.isNaN(input.additionalFederalWithholding) &&
      input.additionalFederalWithholding < 0
    ) {
      errors.additionalFederalWithholding = 'errors.mustBePositive';
    }
    
    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UsPaycheckInput, _config: UsCountryConfig, year: number): UsPaycheckResult {
    if (year !== 2026) {
      throw new Error(`US paycheck engine only has verified data for tax year 2026 (got ${year}).`);
    }

    const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency];
    const preTax = Math.max(0, input.preTaxDeductionsPerPeriod || 0);
    const annualGrossPay = input.grossPayPerPeriod * periodsPerYear;
    const annualPreTaxDeductions = preTax * periodsPerYear;

    // Select standard deduction based on filing status
    let standardDeduction: number;
    let brackets: TaxBracket[];
    
    switch (input.filingStatus) {
      case 'single':
        standardDeduction = standardDeduction2026.single;
        brackets = federalBrackets2026Single;
        break;
      case 'marriedJointly':
        standardDeduction = standardDeduction2026.marriedJointly;
        brackets = federalBrackets2026MarriedJointly;
        break;
      case 'marriedSeparately':
        standardDeduction = standardDeduction2026.marriedSeparately;
        brackets = federalBrackets2026MarriedSeparately;
        break;
      case 'headOfHousehold':
        standardDeduction = standardDeduction2026.headOfHousehold;
        brackets = federalBrackets2026HeadOfHousehold;
        break;
      default:
        throw new Error(`Unsupported filing status: ${input.filingStatus}`);
    }

    const taxableIncome = Math.max(0, annualGrossPay - annualPreTaxDeductions - standardDeduction);
    const { totalTax: annualFederalIncomeTax, effectiveRate } = calculateProgressiveTax(
      taxableIncome,
      brackets,
    );

    // Social Security calculation
    const ssTaxableAnnual = Math.min(annualGrossPay, fica2026.socialSecurityWageBase);
    const annualSocialSecurity = ssTaxableAnnual * fica2026.socialSecurityRate;

    // Medicare calculation (base rate)
    let annualMedicare = annualGrossPay * fica2026.medicareRate;
    let annualAdditionalMedicare = 0;
    
    // Additional Medicare tax threshold
    const additionalMedicareThreshold =
      input.filingStatus === 'marriedJointly'
        ? fica2026.additionalMedicareThreshold.marriedJointly
        : fica2026.additionalMedicareThreshold.single;
        
    if (annualGrossPay > additionalMedicareThreshold) {
      annualAdditionalMedicare =
        (annualGrossPay - additionalMedicareThreshold) * fica2026.additionalMedicareRate;
    }

    const federalIncomeTaxPerPeriod = annualFederalIncomeTax / periodsPerYear;
    const socialSecurityPerPeriod = annualSocialSecurity / periodsPerYear;
    const medicarePerPeriod = annualMedicare / periodsPerYear;
    const additionalMedicarePerPeriod = annualAdditionalMedicare / periodsPerYear;

    // State tax calculation
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

    // Additional federal withholding
    const additionalFederalWithholding = input.additionalFederalWithholding || 0;
    const annualAdditionalFederalWithholding = additionalFederalWithholding * periodsPerYear;

    // Calculate total taxes
    const totalAnnualTaxes =
      annualFederalIncomeTax +
      annualSocialSecurity +
      annualMedicare +
      annualAdditionalMedicare +
      annualStateIncomeTax +
      annualAdditionalFederalWithholding;
    
    const effectiveTotalTaxRate = annualGrossPay > 0 ? totalAnnualTaxes / annualGrossPay : 0;

    const netPayPerPeriod =
      input.grossPayPerPeriod -
      preTax -
      federalIncomeTaxPerPeriod -
      socialSecurityPerPeriod -
      medicarePerPeriod -
      additionalMedicarePerPeriod -
      stateIncomeTaxPerPeriod -
      additionalFederalWithholding;

    return {
      grossPayPerPeriod: input.grossPayPerPeriod,
      preTaxDeductionsPerPeriod: preTax,
      federalIncomeTaxPerPeriod,
      socialSecurityPerPeriod,
      medicarePerPeriod,
      ...(annualAdditionalMedicare > 0 ? { additionalMedicarePerPeriod } : {}),
      ...(input.stateCode ? { stateIncomeTaxPerPeriod } : {}),
      ...(additionalFederalWithholding > 0 ? { additionalFederalWithholdingPerPeriod: additionalFederalWithholding } : {}),
      netPayPerPeriod,
      annualGrossPay,
      annualFederalIncomeTax,
      annualSocialSecurity,
      annualMedicare,
      ...(annualAdditionalMedicare > 0 ? { annualAdditionalMedicare } : {}),
      ...(input.stateCode ? { annualStateIncomeTax } : {}),
      ...(annualAdditionalFederalWithholding > 0 ? { annualAdditionalFederalWithholding } : {}),
      effectiveFederalRate: effectiveRate,
      ...(input.stateCode ? { effectiveStateRate } : {}),
      effectiveTotalTaxRate,
    };
  },
};
