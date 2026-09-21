import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  ukIncomeTaxBrackets2026,
  ukScottishIncomeTaxBrackets2026,
  ukWelshIncomeTaxBrackets2026,
  ukPersonalAllowance2026,
  ukNI2026,
  ukStudentLoan2026,
  ukBlindPersonAllowance2026,
  ukMarriageAllowance2026,
} from '../../../../data/salary/gb/ukTaxData2026';
import { PERIODS_PER_YEAR, type PayFrequency } from '../../../core/frequency';

export type UkRegion = 'england' | 'scotland' | 'wales' | 'northernIreland';
export type UkStudentLoanPlan = 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgraduate';

export interface UkPaycheckInput {
  /** Annual gross salary, GBP. */
  grossAnnual: number;
  /** Pay frequency (annual, monthly, weekly, etc.) */
  payFrequency: PayFrequency;
  /** Region (determines income tax rates - Scotland has different brackets) */
  region?: UkRegion;
  /** Age (affects state pension age for NI exemption) */
  age?: number;
  /** Whether claiming blind person's allowance (additional £3,070 tax-free) */
  blindPersonAllowance?: boolean;
  /** Whether married and transferring marriage allowance (£1,260 transfer) */
  marriageAllowanceTransfer?: boolean;
  /** Student loan plan (Plan 1, 2, 4, 5, or Postgraduate) */
  studentLoanPlan?: UkStudentLoanPlan;
  /** Whether also repaying postgraduate loan (in addition to undergraduate) */
  postgraduateLoan?: boolean;
  /** Pension contribution as percentage of gross (salary sacrifice, reduces NI too) */
  pensionContributionPercent?: number;
  /** Whether pension is salary sacrifice (true) or net pay arrangement (false) */
  pensionSalarySacrifice?: boolean;
}

export interface UkPaycheckResult {
  grossAnnualPay: number;
  /** Gross after salary sacrifice pension (if applicable) */
  grossAfterPensionSacrifice: number;
  /** Personal allowance (tapered for high earners) */
  personalAllowance: number;
  /** Additional allowances (blind person's allowance, marriage allowance) */
  additionalAllowances: number;
  /** Taxable income (after all allowances) */
  taxableIncome: number;
  /** Income tax */
  incomeTaxAnnual: number;
  /** National Insurance (employee) */
  nationalInsuranceAnnual: number;
  /** Student loan repayment (Plan 1, 2, 4, or 5) */
  studentLoanRepayment: number;
  /** Postgraduate loan repayment */
  postgraduateLoanRepayment: number;
  /** Pension contribution (employee) */
  pensionContribution: number;
  /** Employer NI saved through salary sacrifice (informational) */
  employerNISaving: number;
  /** Net annual take-home pay */
  netAnnualPay: number;
  /** Net pay per period */
  netPayPerPeriod: number;
  /** Gross pay per period */
  grossPayPerPeriod: number;
  /** Effective income tax rate */
  effectiveIncomeTaxRate: number;
  /** Effective NI rate */
  effectiveNIRate: number;
  /** Effective total deduction rate (tax + NI + loans) */
  effectiveTotalRate: number;
  /** Marginal tax rate (rate on next £1 earned) */
  marginalTaxRate: number;
  /** Marginal deduction rate (including NI and loan repayments) */
  marginalDeductionRate: number;
  /** Region used for calculation */
  regionUsed: UkRegion;
}

export const ukPaycheckEngine: CalculatorEngine<UkPaycheckInput, UkPaycheckResult, never> = {
  validate(input: UkPaycheckInput): ValidationResult<UkPaycheckInput> {
    const errors: Partial<Record<keyof UkPaycheckInput, string>> = {};

    if (!input.grossAnnual || typeof input.grossAnnual === 'number' && Number.isNaN(input.grossAnnual)) {
      errors.grossAnnual = 'errors.invalidNumber';
    } else if (input.grossAnnual <= 0) {
      errors.grossAnnual = 'errors.mustBePositive';
    }

    if (input.age !== undefined && (input.age < 16 || input.age > 100)) {
      errors.age = 'errors.invalidAge';
    }

    if (input.pensionContributionPercent !== undefined) {
      if (input.pensionContributionPercent < 0 || input.pensionContributionPercent > 100) {
        errors.pensionContributionPercent = 'errors.invalidPercentage';
      }
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UkPaycheckInput, _config: never, _year: number): UkPaycheckResult {
    const gross = input.grossAnnual;
    const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency];
    const age = input.age ?? 30;
    const region = input.region ?? 'england';
    const pensionSalarySacrifice = input.pensionSalarySacrifice ?? true;

    // Pension contribution
    const pensionPercent = input.pensionContributionPercent ?? 0;
    const pensionContribution = gross * (pensionPercent / 100);

    // Salary sacrifice reduces gross for tax and NI; net pay arrangement only reduces taxable income
    const grossAfterPensionSacrifice = pensionSalarySacrifice
      ? gross - pensionContribution
      : gross;

    // Personal allowance (tapers by £1 per £2 above £100,000)
    let personalAllowance = ukPersonalAllowance2026;
    if (grossAfterPensionSacrifice > 100_000) {
      const reduction = Math.floor((grossAfterPensionSacrifice - 100_000) / 2);
      personalAllowance = Math.max(0, personalAllowance - reduction);
    }

    // Additional allowances
    let additionalAllowances = 0;

    // Blind person's allowance
    if (input.blindPersonAllowance) {
      additionalAllowances += ukBlindPersonAllowance2026;
    }

    // Marriage allowance transfer (receiving spouse gets extra allowance)
    if (input.marriageAllowanceTransfer) {
      additionalAllowances += ukMarriageAllowance2026;
    }

    // Total tax-free allowance
    const totalAllowance = personalAllowance + additionalAllowances;

    // Taxable income
    const taxableIncome = Math.max(0, grossAfterPensionSacrifice - totalAllowance);

    // Select tax brackets based on region
    let incomeTaxBrackets = ukIncomeTaxBrackets2026;
    if (region === 'scotland') {
      incomeTaxBrackets = ukScottishIncomeTaxBrackets2026;
    } else if (region === 'wales') {
      incomeTaxBrackets = ukWelshIncomeTaxBrackets2026;
    }
    // England and Northern Ireland use the same brackets

    // Income tax
    const { totalTax: incomeTaxAnnual, marginalRate: incomeTaxMarginalRate } = calculateProgressiveTax(
      taxableIncome,
      incomeTaxBrackets,
    );

    // National Insurance (Class 1 employee)
    // State pension age exempts from NI (approximately 66-67 for most people in 2026)
    const statePensionAge = 66;
    let nationalInsuranceAnnual = 0;
    let niMarginalRate = 0;

    if (age < statePensionAge) {
      if (grossAfterPensionSacrifice > ukNI2026.primaryThresholdAnnual) {
        // Main rate: 8% between primary threshold and upper earnings limit
        const mainNIBase =
          Math.min(grossAfterPensionSacrifice, ukNI2026.upperEarningsLimitAnnual) -
          ukNI2026.primaryThresholdAnnual;
        nationalInsuranceAnnual += Math.max(0, mainNIBase) * ukNI2026.mainRate;

        // Additional rate: 2% above upper earnings limit
        if (grossAfterPensionSacrifice > ukNI2026.upperEarningsLimitAnnual) {
          nationalInsuranceAnnual +=
            (grossAfterPensionSacrifice - ukNI2026.upperEarningsLimitAnnual) * ukNI2026.additionalRate;
          niMarginalRate = ukNI2026.additionalRate;
        } else {
          niMarginalRate = ukNI2026.mainRate;
        }
      }
    }

    // Employer NI saving from salary sacrifice (informational)
    let employerNISaving = 0;
    if (pensionSalarySacrifice && pensionContribution > 0) {
      // Employer saves 15% NI on the sacrificed amount (if above secondary threshold)
      const sacrificedAmountAboveThreshold = Math.max(
        0,
        Math.min(pensionContribution, gross - ukNI2026.secondaryThresholdAnnual),
      );
      employerNISaving = sacrificedAmountAboveThreshold * ukNI2026.employerRate;
    }

    // Student Loan Repayments
    let studentLoanRepayment = 0;
    let studentLoanMarginalRate = 0;
    const studentLoanPlan = input.studentLoanPlan ?? 'none';

    if (studentLoanPlan !== 'none' && studentLoanPlan !== 'postgraduate') {
      let threshold = 0;
      switch (studentLoanPlan) {
        case 'plan1':
          threshold = ukStudentLoan2026.plan1Threshold;
          break;
        case 'plan2':
          threshold = ukStudentLoan2026.plan2Threshold;
          break;
        case 'plan4':
          threshold = ukStudentLoan2026.plan4Threshold;
          break;
        case 'plan5':
          threshold = ukStudentLoan2026.plan5Threshold;
          break;
      }

      if (grossAfterPensionSacrifice > threshold) {
        studentLoanRepayment = (grossAfterPensionSacrifice - threshold) * ukStudentLoan2026.deductionRate;
        studentLoanMarginalRate = ukStudentLoan2026.deductionRate;
      }
    }

    // Postgraduate Loan Repayment
    let postgraduateLoanRepayment = 0;
    let postgraduateMarginalRate = 0;

    if (input.postgraduateLoan || studentLoanPlan === 'postgraduate') {
      if (grossAfterPensionSacrifice > ukStudentLoan2026.postgraduateThreshold) {
        postgraduateLoanRepayment =
          (grossAfterPensionSacrifice - ukStudentLoan2026.postgraduateThreshold) *
          ukStudentLoan2026.postgraduateRate;
        postgraduateMarginalRate = ukStudentLoan2026.postgraduateRate;
      }
    }

    // Calculate marginal rates
    const marginalTaxRate = incomeTaxMarginalRate;
    const marginalDeductionRate =
      incomeTaxMarginalRate + niMarginalRate + studentLoanMarginalRate + postgraduateMarginalRate;

    // Net pay calculation
    const totalDeductions =
      incomeTaxAnnual +
      nationalInsuranceAnnual +
      studentLoanRepayment +
      postgraduateLoanRepayment +
      pensionContribution;
    const netAnnualPay = gross - totalDeductions;

    return {
      grossAnnualPay: gross,
      grossAfterPensionSacrifice,
      personalAllowance,
      additionalAllowances,
      taxableIncome,
      incomeTaxAnnual,
      nationalInsuranceAnnual,
      studentLoanRepayment,
      postgraduateLoanRepayment,
      pensionContribution,
      employerNISaving,
      netAnnualPay,
      netPayPerPeriod: netAnnualPay / periodsPerYear,
      grossPayPerPeriod: gross / periodsPerYear,
      effectiveIncomeTaxRate: gross > 0 ? incomeTaxAnnual / gross : 0,
      effectiveNIRate: gross > 0 ? nationalInsuranceAnnual / gross : 0,
      effectiveTotalRate:
        gross > 0
          ? (incomeTaxAnnual + nationalInsuranceAnnual + studentLoanRepayment + postgraduateLoanRepayment) /
            gross
          : 0,
      marginalTaxRate,
      marginalDeductionRate,
      regionUsed: region,
    };
  },
};
