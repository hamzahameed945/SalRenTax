import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { PERIODS_PER_YEAR } from '../../../core/frequency';
import { usPaycheckEngine, type UsPaycheckInput, type UsCountryConfig } from '../usPaycheck';

export interface UsYearComparisonInput {
  /** Current year calculation input */
  currentYear: UsPaycheckInput;
  /** Previous year gross pay per period */
  previousYearGrossPayPerPeriod: number;
  /** Previous year net pay per period (if known, otherwise will estimate using current rates) */
  previousYearNetPayPerPeriod?: number;
  /** Inflation rate for real terms calculation (optional, as percentage) */
  inflationRate?: number;
}

export interface UsYearComparisonResult {
  /** Previous year details */
  previousYear: {
    grossAnnual: number;
    grossPerPeriod: number;
    netAnnual: number;
    netPerPeriod: number;
  };
  /** Current year details */
  currentYear: {
    grossAnnual: number;
    grossPerPeriod: number;
    netAnnual: number;
    netPerPeriod: number;
    federalIncomeTaxAnnual: number;
    socialSecurityAnnual: number;
    medicareAnnual: number;
    additionalMedicareAnnual?: number;
    stateIncomeTaxAnnual?: number;
    effectiveFederalRate: number;
    effectiveStateRate?: number;
    effectiveTotalTaxRate: number;
  };
  /** Year-over-year comparison */
  comparison: {
    grossChange: number;
    netChange: number;
    grossPerPeriodChange: number;
    netPerPeriodChange: number;
    grossChangePercent: number;
    netChangePercent: number;
    /** Real terms change (accounting for inflation, if provided) */
    realTermsGrossChangePercent?: number;
    realTermsNetChangePercent?: number;
    /** Tax burden comparison */
    taxBurdenChange: {
      effectiveTaxRateChange: number;
      totalTaxChange: number;
    };
  };
}

export const usYearComparisonEngine: CalculatorEngine<
  UsYearComparisonInput,
  UsYearComparisonResult,
  UsCountryConfig
> = {
  validate(input: UsYearComparisonInput): ValidationResult<UsYearComparisonInput> {
    // Validate current year input
    const currentValidation = usPaycheckEngine.validate(input.currentYear);
    if (!currentValidation.valid) {
      return {
        valid: false,
        errors: { currentYear: 'errors.invalidCurrentYear' } as Partial<
          Record<keyof UsYearComparisonInput, string>
        >,
      };
    }

    const errors: Partial<Record<keyof UsYearComparisonInput, string>> = {};

    if (
      !input.previousYearGrossPayPerPeriod || 
      input.previousYearGrossPayPerPeriod <= 0 ||
      typeof input.previousYearGrossPayPerPeriod === 'number' && Number.isNaN(input.previousYearGrossPayPerPeriod)
    ) {
      errors.previousYearGrossPayPerPeriod = 'errors.mustBePositive';
    }

    if (
      input.previousYearNetPayPerPeriod !== undefined &&
      input.previousYearNetPayPerPeriod !== null &&
      !typeof input.previousYearNetPayPerPeriod === 'number' && Number.isNaN(input.previousYearNetPayPerPeriod) &&
      input.previousYearNetPayPerPeriod < 0
    ) {
      errors.previousYearNetPayPerPeriod = 'errors.mustBePositive';
    }

    if (
      input.inflationRate !== undefined &&
      input.inflationRate !== null &&
      !typeof input.inflationRate === 'number' && Number.isNaN(input.inflationRate) &&
      input.inflationRate < 0
    ) {
      errors.inflationRate = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(
    input: UsYearComparisonInput,
    config: UsCountryConfig,
    year: number,
  ): UsYearComparisonResult {
    // Calculate current year
    const currentResult = usPaycheckEngine.calculate(input.currentYear, config, year);
    const periodsPerYear = PERIODS_PER_YEAR[input.currentYear.payFrequency];

    // Estimate previous year net pay if not provided
    // (using current tax rates as approximation)
    let previousYearNetPayPerPeriod = input.previousYearNetPayPerPeriod;
    if (!previousYearNetPayPerPeriod) {
      const previousYearInput: UsPaycheckInput = {
        ...input.currentYear,
        grossPayPerPeriod: input.previousYearGrossPayPerPeriod,
      };
      const previousResult = usPaycheckEngine.calculate(previousYearInput, config, year);
      previousYearNetPayPerPeriod = previousResult.netPayPerPeriod;
    }

    const previousYearGrossAnnual = input.previousYearGrossPayPerPeriod * periodsPerYear;
    const previousYearNetAnnual = previousYearNetPayPerPeriod * periodsPerYear;
    const currentYearNetAnnual = currentResult.netPayPerPeriod * periodsPerYear;

    // Calculate comparison metrics
    const grossChange = currentResult.annualGrossPay - previousYearGrossAnnual;
    const netChange = currentYearNetAnnual - previousYearNetAnnual;
    const grossPerPeriodChange =
      currentResult.grossPayPerPeriod - input.previousYearGrossPayPerPeriod;
    const netPerPeriodChange = currentResult.netPayPerPeriod - previousYearNetPayPerPeriod;
    const grossChangePercent = (grossChange / previousYearGrossAnnual) * 100;
    const netChangePercent = (netChange / previousYearNetAnnual) * 100;

    // Real terms calculation (inflation-adjusted)
    let realTermsGrossChangePercent: number | undefined;
    let realTermsNetChangePercent: number | undefined;
    if (input.inflationRate !== undefined) {
      realTermsGrossChangePercent = grossChangePercent - input.inflationRate;
      realTermsNetChangePercent = netChangePercent - input.inflationRate;
    }

    // Tax burden comparison
    const previousYearTotalTax = previousYearGrossAnnual - previousYearNetAnnual;
    const currentYearTotalTax = currentResult.annualGrossPay - currentYearNetAnnual;
    const previousYearEffectiveTaxRate =
      previousYearGrossAnnual > 0 ? (previousYearTotalTax / previousYearGrossAnnual) * 100 : 0;
    const effectiveTaxRateChange =
      currentResult.effectiveTotalTaxRate * 100 - previousYearEffectiveTaxRate;
    const totalTaxChange = currentYearTotalTax - previousYearTotalTax;

    return {
      previousYear: {
        grossAnnual: previousYearGrossAnnual,
        grossPerPeriod: input.previousYearGrossPayPerPeriod,
        netAnnual: previousYearNetAnnual,
        netPerPeriod: previousYearNetPayPerPeriod,
      },
      currentYear: {
        grossAnnual: currentResult.annualGrossPay,
        grossPerPeriod: currentResult.grossPayPerPeriod,
        netAnnual: currentYearNetAnnual,
        netPerPeriod: currentResult.netPayPerPeriod,
        federalIncomeTaxAnnual: currentResult.annualFederalIncomeTax,
        socialSecurityAnnual: currentResult.annualSocialSecurity,
        medicareAnnual: currentResult.annualMedicare,
        ...(currentResult.annualAdditionalMedicare
          ? { additionalMedicareAnnual: currentResult.annualAdditionalMedicare }
          : {}),
        ...(currentResult.annualStateIncomeTax
          ? { stateIncomeTaxAnnual: currentResult.annualStateIncomeTax }
          : {}),
        effectiveFederalRate: currentResult.effectiveFederalRate,
        ...(currentResult.effectiveStateRate
          ? { effectiveStateRate: currentResult.effectiveStateRate }
          : {}),
        effectiveTotalTaxRate: currentResult.effectiveTotalTaxRate,
      },
      comparison: {
        grossChange,
        netChange,
        grossPerPeriodChange,
        netPerPeriodChange,
        grossChangePercent,
        netChangePercent,
        ...(realTermsGrossChangePercent !== undefined
          ? { realTermsGrossChangePercent }
          : {}),
        ...(realTermsNetChangePercent !== undefined ? { realTermsNetChangePercent } : {}),
        taxBurdenChange: {
          effectiveTaxRateChange,
          totalTaxChange,
        },
      },
    };
  },
};
