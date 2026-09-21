import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { PERIODS_PER_YEAR } from '../../../core/frequency';
import { usPaycheckEngine, type UsPaycheckInput, type UsCountryConfig } from '../usPaycheck';

export interface UsRaiseSimulatorInput extends UsPaycheckInput {
  /** Proposed raise amount (USD annual) or percentage */
  raiseAmount?: number;
  /** Raise percentage (alternative to raiseAmount) */
  raisePercent?: number;
}

export interface UsRaiseSimulatorResult {
  /** Current salary details */
  current: {
    grossAnnual: number;
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
  /** After raise salary details */
  afterRaise: {
    grossAnnual: number;
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
  /** Comparison metrics */
  comparison: {
    grossIncrease: number;
    netIncrease: number;
    netPerPeriodIncrease: number;
    grossIncreasePercent: number;
    netIncreasePercent: number;
    /** Percentage of raise kept after tax (take-home rate) */
    takeHomeRate: number;
    /** Amount lost to all taxes and deductions */
    lostToTaxes: number;
    /** Breakdown of what portion went to each tax */
    taxBreakdown: {
      federalIncomeTaxIncrease: number;
      socialSecurityIncrease: number;
      medicareIncrease: number;
      additionalMedicareIncrease?: number;
      stateIncomeTaxIncrease?: number;
    };
  };
}

export const usRaiseSimulatorEngine: CalculatorEngine<
  UsRaiseSimulatorInput,
  UsRaiseSimulatorResult,
  UsCountryConfig
> = {
  validate(input: UsRaiseSimulatorInput): ValidationResult<UsRaiseSimulatorInput> {
    // Use base validator from paycheck engine
    const baseValidation = usPaycheckEngine.validate(input);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors: Partial<Record<keyof UsRaiseSimulatorInput, string>> = {};

    // At least one of raiseAmount or raisePercent is required
    const hasRaiseAmount = input.raiseAmount !== undefined && 
                          input.raiseAmount !== null && 
                          !typeof input.raiseAmount === 'number' && Number.isNaN(input.raiseAmount);
    const hasRaisePercent = input.raisePercent !== undefined && 
                           input.raisePercent !== null && 
                           !typeof input.raisePercent === 'number' && Number.isNaN(input.raisePercent);

    if (!hasRaiseAmount && !hasRaisePercent) {
      errors.raiseAmount = 'errors.raiseAmountOrPercentRequired';
    }

    if (hasRaiseAmount && input.raiseAmount! < 0) {
      errors.raiseAmount = 'errors.mustBePositive';
    }

    if (hasRaisePercent && input.raisePercent! < 0) {
      errors.raisePercent = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(
    input: UsRaiseSimulatorInput,
    config: UsCountryConfig,
    year: number,
  ): UsRaiseSimulatorResult {
    // Calculate current salary
    const currentResult = usPaycheckEngine.calculate(input, config, year);
    const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency];

    // Calculate raise amount
    const currentAnnualGross = input.grossPayPerPeriod * periodsPerYear;
    let raiseAmount = input.raiseAmount ?? 0;
    if (input.raisePercent) {
      raiseAmount = currentAnnualGross * (input.raisePercent / 100);
    }

    // Calculate after-raise salary
    const newGrossAnnual = currentAnnualGross + raiseAmount;
    const newGrossPerPeriod = newGrossAnnual / periodsPerYear;

    const afterRaiseInput: UsPaycheckInput = {
      ...input,
      grossPayPerPeriod: newGrossPerPeriod,
    };
    const afterRaiseResult = usPaycheckEngine.calculate(afterRaiseInput, config, year);

    // Calculate comparison metrics
    const grossIncrease = afterRaiseResult.annualGrossPay - currentResult.annualGrossPay;
    const netIncrease =
      afterRaiseResult.netPayPerPeriod * periodsPerYear -
      currentResult.netPayPerPeriod * periodsPerYear;
    const netPerPeriodIncrease = afterRaiseResult.netPayPerPeriod - currentResult.netPayPerPeriod;
    const grossIncreasePercent = (grossIncrease / currentResult.annualGrossPay) * 100;
    const netIncreasePercent =
      (netIncrease / (currentResult.netPayPerPeriod * periodsPerYear)) * 100;
    const takeHomeRate = grossIncrease > 0 ? (netIncrease / grossIncrease) * 100 : 0;
    const lostToTaxes = grossIncrease - netIncrease;

    // Tax breakdown
    const federalIncomeTaxIncrease =
      afterRaiseResult.annualFederalIncomeTax - currentResult.annualFederalIncomeTax;
    const socialSecurityIncrease =
      afterRaiseResult.annualSocialSecurity - currentResult.annualSocialSecurity;
    const medicareIncrease = afterRaiseResult.annualMedicare - currentResult.annualMedicare;

    const additionalMedicareIncrease =
      (afterRaiseResult.annualAdditionalMedicare ?? 0) -
      (currentResult.annualAdditionalMedicare ?? 0);

    const stateIncomeTaxIncrease =
      (afterRaiseResult.annualStateIncomeTax ?? 0) - (currentResult.annualStateIncomeTax ?? 0);

    return {
      current: {
        grossAnnual: currentResult.annualGrossPay,
        netAnnual: currentResult.netPayPerPeriod * periodsPerYear,
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
      afterRaise: {
        grossAnnual: afterRaiseResult.annualGrossPay,
        netAnnual: afterRaiseResult.netPayPerPeriod * periodsPerYear,
        netPerPeriod: afterRaiseResult.netPayPerPeriod,
        federalIncomeTaxAnnual: afterRaiseResult.annualFederalIncomeTax,
        socialSecurityAnnual: afterRaiseResult.annualSocialSecurity,
        medicareAnnual: afterRaiseResult.annualMedicare,
        ...(afterRaiseResult.annualAdditionalMedicare
          ? { additionalMedicareAnnual: afterRaiseResult.annualAdditionalMedicare }
          : {}),
        ...(afterRaiseResult.annualStateIncomeTax
          ? { stateIncomeTaxAnnual: afterRaiseResult.annualStateIncomeTax }
          : {}),
        effectiveFederalRate: afterRaiseResult.effectiveFederalRate,
        ...(afterRaiseResult.effectiveStateRate
          ? { effectiveStateRate: afterRaiseResult.effectiveStateRate }
          : {}),
        effectiveTotalTaxRate: afterRaiseResult.effectiveTotalTaxRate,
      },
      comparison: {
        grossIncrease,
        netIncrease,
        netPerPeriodIncrease,
        grossIncreasePercent,
        netIncreasePercent,
        takeHomeRate,
        lostToTaxes,
        taxBreakdown: {
          federalIncomeTaxIncrease,
          socialSecurityIncrease,
          medicareIncrease,
          ...(additionalMedicareIncrease > 0 ? { additionalMedicareIncrease } : {}),
          ...(input.stateCode && stateIncomeTaxIncrease !== 0
            ? { stateIncomeTaxIncrease }
            : {}),
        },
      },
    };
  },
};
