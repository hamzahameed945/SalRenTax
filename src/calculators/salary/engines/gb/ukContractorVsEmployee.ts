import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { ukPaycheckEngine, type UkPaycheckInput, type UkRegion } from './ukPaycheck';
import { calculateProgressiveTax } from '../../../core/progressiveTax';
import {
  ukIncomeTaxBrackets2026,
  ukScottishIncomeTaxBrackets2026,
  ukWelshIncomeTaxBrackets2026,
  ukPersonalAllowance2026,
  ukNI2026,
} from '../../../../data/salary/gb/ukTaxData2026';

export interface UkContractorVsEmployeeInput {
  /** Annual income (gross for employee, day rate × days for contractor) */
  annualIncome: number;
  /** Region (affects income tax brackets) */
  region?: UkRegion;
  /** Age (affects NI) */
  age?: number;
  /** Contractor business expenses as percentage of income */
  contractorExpensesPercent?: number;
  /** Contractor dividend/salary split percentage (% taken as dividends) */
  contractorDividendPercent?: number;
}

export interface UkContractorVsEmployeeResult {
  /** Employee scenario */
  employee: {
    grossAnnual: number;
    incomeTax: number;
    nationalInsurance: number;
    netAnnual: number;
    netMonthly: number;
    effectiveTaxRate: number;
  };
  /** Contractor/Limited Company scenario */
  contractor: {
    grossAnnual: number;
    businessExpenses: number;
    salary: number;
    dividends: number;
    corporationTax: number;
    incomeTax: number;
    nationalInsurance: number;
    netAnnual: number;
    netMonthly: number;
    effectiveTaxRate: number;
  };
  /** Comparison */
  comparison: {
    /** Net difference (contractor minus employee) */
    netDifference: number;
    netDifferencePercent: number;
    /** Which option is better financially */
    betterOption: 'employee' | 'contractor' | 'equal';
    /** Tax saving from contractor route */
    taxSaving: number;
  };
}

export const ukContractorVsEmployeeEngine: CalculatorEngine<
  UkContractorVsEmployeeInput,
  UkContractorVsEmployeeResult,
  never
> = {
  validate(input: UkContractorVsEmployeeInput): ValidationResult<UkContractorVsEmployeeInput> {
    const errors: Partial<Record<keyof UkContractorVsEmployeeInput, string>> = {};

    if (!input.annualIncome || input.annualIncome <= 0) {
      errors.annualIncome = 'errors.mustBePositive';
    }

    if (input.age !== undefined && (input.age < 16 || input.age > 100)) {
      errors.age = 'errors.invalidAge';
    }

    if (
      input.contractorExpensesPercent !== undefined &&
      (input.contractorExpensesPercent < 0 || input.contractorExpensesPercent > 100)
    ) {
      errors.contractorExpensesPercent = 'errors.invalidPercentage';
    }

    if (
      input.contractorDividendPercent !== undefined &&
      (input.contractorDividendPercent < 0 || input.contractorDividendPercent > 100)
    ) {
      errors.contractorDividendPercent = 'errors.invalidPercentage';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: UkContractorVsEmployeeInput, _config: never, year: number): UkContractorVsEmployeeResult {
    const age = input.age ?? 30;
    const region = input.region ?? 'england';
    const contractorExpensesPercent = input.contractorExpensesPercent ?? 10; // Default 10% expenses
    const contractorDividendPercent = input.contractorDividendPercent ?? 80; // Default 80% dividends, 20% salary

    // Calculate as EMPLOYEE
    const employeeInput: UkPaycheckInput = {
      grossAnnual: input.annualIncome,
      payFrequency: 'annually',
      region: region,
      age: age,
    };
    const employeeResult = ukPaycheckEngine.calculate(employeeInput, _config, year);

    // Calculate as CONTRACTOR (Limited Company)
    const contractorGross = input.annualIncome;
    const businessExpenses = contractorGross * (contractorExpensesPercent / 100);
    const profitBeforeSalary = contractorGross - businessExpenses;

    // Optimal salary: usually personal allowance to minimize NI
    // const optimalSalary = Math.min(ukPersonalAllowance2026, profitBeforeSalary);
    const salary = profitBeforeSalary * ((100 - contractorDividendPercent) / 100);

    // Company profit after salary (and employer NI on salary)
    const employerNI = Math.max(
      0,
      (salary - ukNI2026.secondaryThresholdAnnual) * ukNI2026.employerRate,
    );
    const profitAfterSalary = profitBeforeSalary - salary - employerNI;

    // Corporation tax (25% for 2026, or 19% for profits under £50k)
    const corporationTaxRate = profitAfterSalary > 50_000 ? 0.25 : 0.19;
    const corporationTax = profitAfterSalary * corporationTaxRate;

    // Dividends available after corporation tax
    const dividendsAvailable = profitAfterSalary - corporationTax;

    // Personal income tax and NI on salary (none if below personal allowance)
    let salaryIncomeTax = 0;
    let salaryNI = 0;

    if (salary > ukPersonalAllowance2026) {
      const taxableSalary = salary - ukPersonalAllowance2026;
      let brackets = ukIncomeTaxBrackets2026;
      if (region === 'scotland') {
        brackets = ukScottishIncomeTaxBrackets2026;
      } else if (region === 'wales') {
        brackets = ukWelshIncomeTaxBrackets2026;
      }
      const { totalTax } = calculateProgressiveTax(taxableSalary, brackets);
      salaryIncomeTax = totalTax;
    }

    const statePensionAge = 66;
    if (age < statePensionAge && salary > ukNI2026.primaryThresholdAnnual) {
      const niableAmount = Math.min(salary, ukNI2026.upperEarningsLimitAnnual) - ukNI2026.primaryThresholdAnnual;
      salaryNI = niableAmount * ukNI2026.mainRate;
      if (salary > ukNI2026.upperEarningsLimitAnnual) {
        salaryNI += (salary - ukNI2026.upperEarningsLimitAnnual) * ukNI2026.additionalRate;
      }
    }

    // Dividend tax (2026-27 rates: 8.75% basic, 33.75% higher, 39.35% additional)
    // Dividend allowance: £500
    const dividendAllowance = 500;
    const taxableDividends = Math.max(0, dividendsAvailable - dividendAllowance);

    // Calculate which tax band dividends fall into
    const totalIncome = salary + dividendsAvailable;
    let dividendTax = 0;

    if (taxableDividends > 0) {
      const basicRateLimit = ukPersonalAllowance2026 + 37_700;
      const higherRateLimit = ukPersonalAllowance2026 + 112_570;

      if (totalIncome <= basicRateLimit) {
        // All dividends at basic rate (8.75%)
        dividendTax = taxableDividends * 0.0875;
      } else if (salary < basicRateLimit) {
        // Some at basic, rest at higher
        const basicRateDividends = Math.max(0, basicRateLimit - salary);
        const higherRateDividends = taxableDividends - basicRateDividends;
        dividendTax = basicRateDividends * 0.0875 + higherRateDividends * 0.3375;
      } else if (totalIncome <= higherRateLimit) {
        // All dividends at higher rate (33.75%)
        dividendTax = taxableDividends * 0.3375;
      } else {
        // Some at higher, rest at additional rate (39.35%)
        const higherRateDividends = Math.max(0, higherRateLimit - salary);
        const additionalRateDividends = taxableDividends - higherRateDividends;
        dividendTax = higherRateDividends * 0.3375 + additionalRateDividends * 0.3935;
      }
    }

    const totalPersonalTax = salaryIncomeTax + salaryNI + dividendTax;
    const netSalary = salary - salaryIncomeTax - salaryNI;
    const netDividends = dividendsAvailable - dividendTax;
    const contractorNet = netSalary + netDividends;

    // Comparison
    const netDifference = contractorNet - employeeResult.netAnnualPay;
    const netDifferencePercent = (netDifference / employeeResult.netAnnualPay) * 100;

    let betterOption: 'employee' | 'contractor' | 'equal' = 'equal';
    if (netDifference > 100) {
      betterOption = 'contractor';
    } else if (netDifference < -100) {
      betterOption = 'employee';
    }

    const employeeTotalTax =
      employeeResult.incomeTaxAnnual + employeeResult.nationalInsuranceAnnual;
    const contractorTotalTax = corporationTax + totalPersonalTax + employerNI;
    const taxSaving = employeeTotalTax - contractorTotalTax;

    return {
      employee: {
        grossAnnual: employeeResult.grossAnnualPay,
        incomeTax: employeeResult.incomeTaxAnnual,
        nationalInsurance: employeeResult.nationalInsuranceAnnual,
        netAnnual: employeeResult.netAnnualPay,
        netMonthly: employeeResult.netAnnualPay / 12,
        effectiveTaxRate: employeeResult.effectiveTotalRate,
      },
      contractor: {
        grossAnnual: contractorGross,
        businessExpenses,
        salary,
        dividends: dividendsAvailable,
        corporationTax,
        incomeTax: salaryIncomeTax + dividendTax,
        nationalInsurance: salaryNI,
        netAnnual: contractorNet,
        netMonthly: contractorNet / 12,
        effectiveTaxRate: contractorTotalTax / contractorGross,
      },
      comparison: {
        netDifference,
        netDifferencePercent,
        betterOption,
        taxSaving,
      },
    };
  },
};
