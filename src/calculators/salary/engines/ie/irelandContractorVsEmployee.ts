import type { CalculatorEngine, ValidationResult } from '../../../core/types';
import { irelandPaycheckEngine, type IrelandPaycheckInput } from './irelandPaycheck';
import { calculateProgressiveTax } from '../../../core/progressiveTax';
import {
  irelandIncomeTaxBrackets2026,
  irelandTaxCredits2026,
  irelandUSCBrackets2026,
  irelandUSCExemptionThreshold2026,
} from '../../../../data/salary/ie/irelandTaxData2026';

export interface IrelandContractorVsEmployeeInput {
  /** Annual income (gross for employee, contract value for contractor) */
  annualIncome: number;
  /** Marital status */
  maritalStatus: 'single' | 'married' | 'marriedOneIncome' | 'singleParent';
  /** Age (affects USC for 70+) */
  age?: number;
  /** Medical card holder (affects USC) */
  medicalCardHolder?: boolean;
  /** Contractor business expenses as percentage of income */
  contractorExpensesPercent?: number;
}

export interface IrelandContractorVsEmployeeResult {
  /** Employee scenario */
  employee: {
    grossAnnual: number;
    payeAnnual: number;
    uscAnnual: number;
    prsiAnnual: number;
    netAnnual: number;
    netMonthly: number;
    effectiveTaxRate: number;
  };
  /** Contractor/Self-employed scenario */
  contractor: {
    grossAnnual: number;
    businessExpenses: number;
    netBusinessIncome: number;
    incomeTax: number;
    usc: number;
    prsi: number;
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
    /** Break-even expense rate (% of income needed in expenses to make contractor equal) */
    breakEvenExpenseRate: number;
  };
}

export const irelandContractorVsEmployeeEngine: CalculatorEngine<
  IrelandContractorVsEmployeeInput,
  IrelandContractorVsEmployeeResult,
  never
> = {
  validate(input: IrelandContractorVsEmployeeInput): ValidationResult<IrelandContractorVsEmployeeInput> {
    const errors: Partial<Record<keyof IrelandContractorVsEmployeeInput, string>> = {};

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

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: IrelandContractorVsEmployeeInput, _config: never, year: number): IrelandContractorVsEmployeeResult {
    const age = input.age ?? 30;
    const maritalStatus = input.maritalStatus;
    const contractorExpensesPercent = input.contractorExpensesPercent ?? 15; // Default 15% expenses

    // Calculate as EMPLOYEE
    const employeeInput: IrelandPaycheckInput = {
      grossAnnual: input.annualIncome,
      payFrequency: 'annually',
      maritalStatus: maritalStatus,
      age: age,
      medicalCardHolder: input.medicalCardHolder,
    };
    const employeeResult = irelandPaycheckEngine.calculate(employeeInput, _config, year);

    // Calculate as CONTRACTOR/SELF-EMPLOYED
    const contractorGross = input.annualIncome;
    const businessExpenses = contractorGross * (contractorExpensesPercent / 100);
    const netBusinessIncome = contractorGross - businessExpenses;

    // Select appropriate tax brackets
    let incomeTaxBrackets = irelandIncomeTaxBrackets2026.single;
    if (maritalStatus === 'married' || maritalStatus === 'marriedOneIncome') {
      incomeTaxBrackets = irelandIncomeTaxBrackets2026.marriedOneIncome;
    } else if (maritalStatus === 'singleParent') {
      incomeTaxBrackets = irelandIncomeTaxBrackets2026.singleParent;
    }

    // Income tax on net business income
    const { totalTax: incomeTaxBeforeCredits } = calculateProgressiveTax(
      netBusinessIncome,
      incomeTaxBrackets,
    );

    // Tax credits for self-employed: Personal + Earned Income Credit (not PAYE credit)
    let taxCredits = irelandTaxCredits2026.personal + irelandTaxCredits2026.earnedIncome;
    if (maritalStatus === 'married' || maritalStatus === 'marriedOneIncome') {
      taxCredits = irelandTaxCredits2026.personal * 2 + irelandTaxCredits2026.earnedIncome;
    } else if (maritalStatus === 'singleParent') {
      taxCredits =
        irelandTaxCredits2026.personal +
        irelandTaxCredits2026.earnedIncome +
        irelandTaxCredits2026.singleParentChildCarer;
    }

    const contractorIncomeTax = Math.max(0, incomeTaxBeforeCredits - taxCredits);

    // USC for self-employed (on gross, not net income)
    let contractorUSC = 0;
    if (contractorGross > irelandUSCExemptionThreshold2026) {
      const { totalTax: uscBase } = calculateProgressiveTax(contractorGross, irelandUSCBrackets2026);

      // Self-employed pay 11% (not 8%) on income over €100,000
      if (contractorGross > 100_000) {
        const excessOver100k = contractorGross - 100_000;
        contractorUSC = uscBase - excessOver100k * 0.08 + excessOver100k * 0.11;
      } else {
        contractorUSC = uscBase;
      }
    }

    // PRSI for self-employed: 4.2375% on net business income (blended 2026 rate)
    // Minimum annual PRSI: €650
    const contractorPRSI = Math.max(650, netBusinessIncome * 0.042375);

    const contractorNet = netBusinessIncome - contractorIncomeTax - contractorUSC - contractorPRSI;

    // Comparison
    const netDifference = contractorNet - employeeResult.netAnnualPay;
    const netDifferencePercent = (netDifference / employeeResult.netAnnualPay) * 100;

    let betterOption: 'employee' | 'contractor' | 'equal' = 'equal';
    if (netDifference > 100) {
      betterOption = 'contractor';
    } else if (netDifference < -100) {
      betterOption = 'employee';
    }

    // Calculate break-even expense rate (simplified)
    const breakEvenExpenseRate = contractorExpensesPercent + (netDifference / contractorGross) * 100;

    return {
      employee: {
        grossAnnual: employeeResult.grossAnnualPay,
        payeAnnual: employeeResult.payeAnnual,
        uscAnnual: employeeResult.uscAnnual,
        prsiAnnual: employeeResult.prsiAnnual,
        netAnnual: employeeResult.netAnnualPay,
        netMonthly: employeeResult.netAnnualPay / 12,
        effectiveTaxRate: employeeResult.effectiveTotalRate,
      },
      contractor: {
        grossAnnual: contractorGross,
        businessExpenses,
        netBusinessIncome,
        incomeTax: contractorIncomeTax,
        usc: contractorUSC,
        prsi: contractorPRSI,
        netAnnual: contractorNet,
        netMonthly: contractorNet / 12,
        effectiveTaxRate: (contractorIncomeTax + contractorUSC + contractorPRSI) / contractorGross,
      },
      comparison: {
        netDifference,
        netDifferencePercent,
        betterOption,
        breakEvenExpenseRate: Math.max(0, Math.min(100, breakEvenExpenseRate)),
      },
    };
  },
};
