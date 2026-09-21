import { calculateProgressiveTax } from '../../../core/progressiveTax';
import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import {
  irelandIncomeTaxBrackets2026,
  irelandTaxCredits2026,
  irelandUSCBrackets2026,
  irelandUSCExemptionThreshold2026,
  irelandUSCReducedRate2026,
  irelandUSCReducedRateIncomeLimit2026,
  irelandPRSI2026,
  irelandAutoEnrolment2026,
} from '../../../../data/salary/ie/irelandTaxData2026';
import { PERIODS_PER_YEAR, type PayFrequency } from '../../../core/frequency';

export type IrelandMaritalStatus = 'single' | 'married' | 'marriedOneIncome' | 'singleParent';

export interface IrelandPaycheckInput {
  /** Annual gross salary, EUR. */
  grossAnnual: number;
  /** Pay frequency (annual, monthly, weekly, etc.) */
  payFrequency: PayFrequency;
  /** Marital/family status */
  maritalStatus: IrelandMaritalStatus;
  /** Age (affects USC rates for 70+, PRSI exemption for 70+, auto-enrolment eligibility) */
  age?: number;
  /** Number of dependent children (affects home carer credit calculation) */
  dependentChildren?: number;
  /** Whether claiming home carer credit (spouse/civil partner income ≤ €7,200) */
  homeCarerCredit?: boolean;
  /** Home carer's annual income (if applicable, for credit calculation) */
  homeCarerIncome?: number;
  /** Whether claiming rent tax credit (private rented sector, no other housing support) */
  rentTaxCredit?: boolean;
  /** Number of incapacitated children (for tax credit) */
  incapacitatedChildren?: number;
  /** Pension contribution as percentage of gross (tax relief at marginal rate) */
  pensionContributionPercent?: number;
  /** Whether enrolled in auto-enrolment pension scheme (My Future Fund) */
  autoEnrolment?: boolean;
  /** Whether holder of full medical card (affects USC rate if income ≤ €60,000) */
  medicalCardHolder?: boolean;
}

export interface IrelandPaycheckResult {
  grossAnnualPay: number;
  /** Gross income after pension contributions (taxable income for PAYE) */
  taxableIncomeForPAYE: number;
  /** Gross income (used for USC and PRSI calculation, not reduced by pension) */
  taxableIncomeForUSCAndPRSI: number;
  /** PAYE (Income Tax) before credits */
  payeBeforeCredits: number;
  /** Total tax credits applied */
  totalTaxCredits: number;
  /** PAYE (Income Tax) after credits */
  payeAnnual: number;
  /** Universal Social Charge */
  uscAnnual: number;
  /** PRSI (Pay Related Social Insurance) */
  prsiAnnual: number;
  /** Employee pension contribution */
  pensionContribution: number;
  /** Auto-enrolment employee contribution (if applicable) */
  autoEnrolmentContribution: number;
  /** Auto-enrolment employer contribution (informational, not deducted from employee) */
  autoEnrolmentEmployerContribution: number;
  /** Auto-enrolment government contribution (informational) */
  autoEnrolmentGovernmentContribution: number;
  /** Net annual take-home pay */
  netAnnualPay: number;
  /** Net pay per period */
  netPayPerPeriod: number;
  /** Gross pay per period */
  grossPayPerPeriod: number;
  /** Effective PAYE rate (after credits) */
  effectivePAYERate: number;
  /** Effective USC rate */
  effectiveUSCRate: number;
  /** Effective PRSI rate */
  effectivePRSIRate: number;
  /** Effective total tax rate (PAYE + USC + PRSI) */
  effectiveTotalRate: number;
  /** Marginal tax rate (rate on next euro earned) */
  marginalTaxRate: number;
  /** Breakdown of tax credits applied */
  taxCreditsBreakdown: {
    personal: number;
    employee: number;
    singleParentChildCarer: number;
    homeCarer: number;
    incapacitatedChild: number;
    rentCredit: number;
  };
}

export const irelandPaycheckEngine: CalculatorEngine<IrelandPaycheckInput, IrelandPaycheckResult, never> = {
  validate(input: IrelandPaycheckInput): ValidationResult<IrelandPaycheckInput> {
    const errors: Partial<Record<keyof IrelandPaycheckInput, string>> = {};

    if (!input.grossAnnual || Number.isNaN(input.grossAnnual)) {
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

    if (input.homeCarerIncome !== undefined && input.homeCarerIncome < 0) {
      errors.homeCarerIncome = 'errors.mustBePositive';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: IrelandPaycheckInput, _config: never, _year: number): IrelandPaycheckResult {
    const gross = input.grossAnnual;
    const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency];
    const age = input.age ?? 30;
    const maritalStatus = input.maritalStatus;

    // Pension contribution (reduces taxable income for PAYE, but not for USC/PRSI)
    const pensionPercent = input.pensionContributionPercent ?? 0;
    const pensionContribution = gross * (pensionPercent / 100);
    const taxableIncomeForPAYE = gross - pensionContribution;
    const taxableIncomeForUSCAndPRSI = gross;

    // Select appropriate tax brackets based on marital status
    let incomeTaxBrackets = irelandIncomeTaxBrackets2026.single;
    if (maritalStatus === 'married' || maritalStatus === 'marriedOneIncome') {
      incomeTaxBrackets = irelandIncomeTaxBrackets2026.marriedOneIncome;
    } else if (maritalStatus === 'singleParent') {
      incomeTaxBrackets = irelandIncomeTaxBrackets2026.singleParent;
    }

    // PAYE — progressive tax on taxable income (after pension deduction)
    const { totalTax: payeBeforeCredits, marginalRate: marginalTaxRate } = calculateProgressiveTax(
      taxableIncomeForPAYE,
      incomeTaxBrackets,
    );

    // Calculate Tax Credits
    const taxCreditsBreakdown = {
      personal: 0,
      employee: 0,
      singleParentChildCarer: 0,
      homeCarer: 0,
      incapacitatedChild: 0,
      rentCredit: 0,
    };

    // Personal tax credit
    if (maritalStatus === 'married' || maritalStatus === 'marriedOneIncome') {
      taxCreditsBreakdown.personal = irelandTaxCredits2026.personal * 2; // €4,000 for married
    } else {
      taxCreditsBreakdown.personal = irelandTaxCredits2026.personal; // €2,000 for single
    }

    // Employee (PAYE) tax credit
    taxCreditsBreakdown.employee = irelandTaxCredits2026.employee; // €2,000

    // Single Parent Child Carer Credit
    if (maritalStatus === 'singleParent') {
      taxCreditsBreakdown.singleParentChildCarer = irelandTaxCredits2026.singleParentChildCarer; // €1,900
    }

    // Home Carer Credit
    if (input.homeCarerCredit) {
      const homeCarerIncome = input.homeCarerIncome ?? 0;
      if (homeCarerIncome <= 7_200) {
        // Full credit if carer's income ≤ €7,200
        taxCreditsBreakdown.homeCarer = irelandTaxCredits2026.homeCarer; // €1,950
      } else {
        // No credit if income > €7,200 (in reality, standard rate band is increased instead)
        taxCreditsBreakdown.homeCarer = 0;
      }
    }

    // Incapacitated Child Tax Credit (per child)
    if (input.incapacitatedChildren && input.incapacitatedChildren > 0) {
      taxCreditsBreakdown.incapacitatedChild =
        irelandTaxCredits2026.incapacitatedChild * input.incapacitatedChildren;
    }

    // Rent Tax Credit
    if (input.rentTaxCredit) {
      if (maritalStatus === 'married' || maritalStatus === 'marriedOneIncome') {
        taxCreditsBreakdown.rentCredit = irelandTaxCredits2026.rentCreditMarried; // €2,000
      } else {
        taxCreditsBreakdown.rentCredit = irelandTaxCredits2026.rentCreditSingle; // €1,000
      }
    }

    const totalTaxCredits =
      taxCreditsBreakdown.personal +
      taxCreditsBreakdown.employee +
      taxCreditsBreakdown.singleParentChildCarer +
      taxCreditsBreakdown.homeCarer +
      taxCreditsBreakdown.incapacitatedChild +
      taxCreditsBreakdown.rentCredit;

    const payeAnnual = Math.max(0, payeBeforeCredits - totalTaxCredits);

    // USC (Universal Social Charge) — calculated on gross (not reduced by pension)
    let uscAnnual = 0;
    if (taxableIncomeForUSCAndPRSI > irelandUSCExemptionThreshold2026) {
      // Check if reduced rate applies (age 70+ or medical card holder with income ≤ €60,000)
      const qualifiesForReducedUSC =
        (age >= 70 || input.medicalCardHolder) &&
        taxableIncomeForUSCAndPRSI <= irelandUSCReducedRateIncomeLimit2026;

      if (qualifiesForReducedUSC) {
        // Apply reduced 2% rate on all income
        uscAnnual = taxableIncomeForUSCAndPRSI * irelandUSCReducedRate2026;
      } else {
        // Apply standard progressive USC rates
        const { totalTax } = calculateProgressiveTax(taxableIncomeForUSCAndPRSI, irelandUSCBrackets2026);
        uscAnnual = totalTax;
      }
    }

    // PRSI (Pay Related Social Insurance) — calculated on gross
    let prsiAnnual = 0;
    if (age < 70 && taxableIncomeForUSCAndPRSI > irelandPRSI2026.annualThreshold) {
      // Employees aged 70+ are exempt from employee PRSI
      prsiAnnual = taxableIncomeForUSCAndPRSI * irelandPRSI2026.employeeRateBlended;
    }

    // Auto-enrolment pension (My Future Fund) — separate from voluntary pension
    let autoEnrolmentContribution = 0;
    let autoEnrolmentEmployerContribution = 0;
    let autoEnrolmentGovernmentContribution = 0;

    if (input.autoEnrolment) {
      const qualifiesForAutoEnrolment =
        age >= irelandAutoEnrolment2026.minAge &&
        age <= irelandAutoEnrolment2026.maxAge &&
        gross >= irelandAutoEnrolment2026.minSalary;

      if (qualifiesForAutoEnrolment) {
        const qualifyingSalary = Math.min(gross, irelandAutoEnrolment2026.maxQualifyingSalary);
        autoEnrolmentContribution = qualifyingSalary * irelandAutoEnrolment2026.employeeContributionRate;
        autoEnrolmentEmployerContribution =
          qualifyingSalary * irelandAutoEnrolment2026.employerContributionRate;
        autoEnrolmentGovernmentContribution =
          qualifyingSalary * irelandAutoEnrolment2026.governmentContributionRate;
      }
    }

    // Calculate net pay
    const netAnnualPay =
      gross - payeAnnual - uscAnnual - prsiAnnual - pensionContribution - autoEnrolmentContribution;

    return {
      grossAnnualPay: gross,
      taxableIncomeForPAYE,
      taxableIncomeForUSCAndPRSI,
      payeBeforeCredits,
      totalTaxCredits,
      payeAnnual,
      uscAnnual,
      prsiAnnual,
      pensionContribution,
      autoEnrolmentContribution,
      autoEnrolmentEmployerContribution,
      autoEnrolmentGovernmentContribution,
      netAnnualPay,
      netPayPerPeriod: netAnnualPay / periodsPerYear,
      grossPayPerPeriod: gross / periodsPerYear,
      effectivePAYERate: gross > 0 ? payeAnnual / gross : 0,
      effectiveUSCRate: gross > 0 ? uscAnnual / gross : 0,
      effectivePRSIRate: gross > 0 ? prsiAnnual / gross : 0,
      effectiveTotalRate: gross > 0 ? (payeAnnual + uscAnnual + prsiAnnual) / gross : 0,
      marginalTaxRate,
      taxCreditsBreakdown,
    };
  },
};
