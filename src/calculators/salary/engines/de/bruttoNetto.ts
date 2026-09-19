import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { socialInsurance2026 } from '../../../../data/salary/de/germanPayrollData2026';

export interface BruttoNettoInput {
  /** Monthly gross salary, EUR. */
  grossMonthly: number;
  /** True if employee has no children (adds the Pflegeversicherung childless surcharge). */
  childless: boolean;
}

export interface BruttoNettoResult {
  grossMonthly: number;
  pensionInsuranceEmployee: number;
  unemploymentInsuranceEmployee: number;
  healthInsuranceEmployee: number;
  longTermCareInsuranceEmployee: number;
  totalSocialInsuranceEmployee: number;
  netAfterSocialInsuranceMonthly: number;
  /** Always false — income tax (Lohnsteuer) is not yet implemented. */
  incomeTaxIncluded: false;
}

export const bruttoNettoEngine: CalculatorEngine<BruttoNettoInput, BruttoNettoResult, never> = {
  validate(input: BruttoNettoInput): ValidationResult<BruttoNettoInput> {
    const errors: Partial<Record<keyof BruttoNettoInput, string>> = {};

    if (!input.grossMonthly || Number.isNaN(input.grossMonthly)) {
      errors.grossMonthly = 'errors.invalidNumber';
    } else if (input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: BruttoNettoInput): BruttoNettoResult {
    const gross = input.grossMonthly;

    const pensionUnemploymentBase = Math.min(gross, socialInsurance2026.pensionUnemploymentCeilingMonthly);
    const healthCareBase = Math.min(gross, socialInsurance2026.healthCareCeilingMonthly);

    const pensionInsuranceEmployee = pensionUnemploymentBase * (socialInsurance2026.pensionInsuranceRate / 2);
    const unemploymentInsuranceEmployee = pensionUnemploymentBase * (socialInsurance2026.unemploymentInsuranceRate / 2);
    const healthInsuranceEmployee =
      healthCareBase *
      ((socialInsurance2026.healthInsuranceGeneralRate + socialInsurance2026.healthInsuranceAverageSupplementRate) / 2);

    const careEmployeeBaseRate =
      socialInsurance2026.longTermCareInsuranceRateWithChildren - socialInsurance2026.employerLongTermCareShare;
    const careEmployeeRate =
      careEmployeeBaseRate + (input.childless ? socialInsurance2026.longTermCareInsuranceChildlessSurcharge : 0);
    const longTermCareInsuranceEmployee = healthCareBase * careEmployeeRate;

    const totalSocialInsuranceEmployee =
      pensionInsuranceEmployee + unemploymentInsuranceEmployee + healthInsuranceEmployee + longTermCareInsuranceEmployee;

    return {
      grossMonthly: gross,
      pensionInsuranceEmployee,
      unemploymentInsuranceEmployee,
      healthInsuranceEmployee,
      longTermCareInsuranceEmployee,
      totalSocialInsuranceEmployee,
      netAfterSocialInsuranceMonthly: gross - totalSocialInsuranceEmployee,
      incomeTaxIncluded: false,
    };
  },
};
