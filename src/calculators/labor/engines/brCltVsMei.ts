import type { CalculatorEngine, ValidationResult } from '../../core/types';
import { roundToCents } from '../../core/math';
import { brSalarioLiquidoEngine } from '../../salary/engines/brSalarioLiquido';
import { brMei2026, type MeiActivity } from '../../../data/labor/br/brMei2026';

/**
 * CLT vs MEI side-by-side comparison for 2026.
 *
 * CLT side: reuses the verified brSalarioLiquido engine (progressive INSS +
 * IRRF with the Lei 15.270/2025 reduction) for the monthly net. The 13º salário
 * and férias (+1/3) are modelled as separate taxable events using the same
 * monthly logic — 13º is paid once, férias replace one salary month, hence
 * annual = 11 × net + 13º net + férias net. FGTS is an employer-paid 8% benefit,
 * reported separately (it is not cash in pocket).
 *
 * MEI side: fixed monthly DAS (2026 values) is the only tax. MEI has no 13º,
 * no férias, no FGTS and no seguro-desemprego — the annual gap quantifies this.
 * Inputs above the R$ 81k annual revenue limit are flagged.
 */
export interface BrCltVsMeiInput {
  /** Monthly gross amount, BRL — salary (CLT) or service revenue (MEI). */
  grossMonthly: number;
  /** MEI activity, selects the correct 2026 DAS value. */
  meiActivity: MeiActivity;
}

export interface BrCltVsMeiResult {
  clt: {
    grossMonthly: number;
    inss: number;
    irrf: number;
    netMonthly: number;
    decimoTerceiroGross: number;
    decimoTerceiroNet: number;
    feriasGross: number;
    feriasNet: number;
    annualNet: number;
    fgtsAnnual: number;
    effectiveTaxRate: number;
  };
  mei: {
    grossMonthly: number;
    activity: MeiActivity;
    das: number;
    dasBreakdown: string;
    netMonthly: number;
    annualNet: number;
    annualRevenue: number;
    revenueLimit: number;
    exceedsRevenueLimit: boolean;
  };
  monthlyDifference: number; // clt.netMonthly - mei.netMonthly
  annualDifference: number; // clt.annualNet - mei.annualNet
  betterMonthly: 'clt' | 'mei' | 'tie';
  betterAnnual: 'clt' | 'mei' | 'tie';
}

const TOLERANCE = 0.005;

function winner(a: number, b: number): 'clt' | 'mei' | 'tie' {
  if (Math.abs(a - b) < TOLERANCE) return 'tie';
  return a > b ? 'clt' : 'mei';
}

const DAS_BREAKDOWN: Record<MeiActivity, string> = {
  comercio: 'INSS R$ 81,05 + ICMS R$ 1,00',
  servicos: 'INSS R$ 81,05 + ISS R$ 5,00',
  ambos: 'INSS R$ 81,05 + ICMS R$ 1,00 + ISS R$ 5,00',
};

const ACTIVITIES: MeiActivity[] = ['comercio', 'servicos', 'ambos'];

export const brCltVsMeiEngine: CalculatorEngine<BrCltVsMeiInput, BrCltVsMeiResult, never> = {
  validate(input): ValidationResult<BrCltVsMeiInput> {
    const errors: Partial<Record<keyof BrCltVsMeiInput, string>> = {};
    if (input.grossMonthly === undefined || (typeof input.grossMonthly === 'number' && Number.isNaN(input.grossMonthly))) {
      errors.grossMonthly = 'errors.invalidNumber';
    } else if (input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.mustBePositive';
    }

    if (!ACTIVITIES.includes(input.meiActivity)) {
      errors.meiActivity = 'errors.invalidNumber';
    }

    return Object.keys(errors).length ? { valid: false, errors } : { valid: true, data: input };
  },

  calculate(input): BrCltVsMeiResult {
    const { grossMonthly, meiActivity } = input;

    // CLT monthly net — reuse the verified salary engine (INSS 2026 + IRRF 2026)
    const monthly = brSalarioLiquidoEngine.calculate({ grossMonthly, dependents: 0 }, {} as never, 2026);

    // 13º salário: taxed as a separate event on the gross base
    const decimoTerceiroNet = brSalarioLiquidoEngine.calculate({ grossMonthly, dependents: 0 }, {} as never, 2026).netMonthly;

    // Férias: base + 1/3 constitutional bonus, replaces one salary month
    const feriasGross = grossMonthly * (4 / 3);
    const feriasNet = brSalarioLiquidoEngine.calculate({ grossMonthly: feriasGross, dependents: 0 }, {} as never, 2026).netMonthly;

    const cltAnnualNet = monthly.netMonthly * 11 + decimoTerceiroNet + feriasNet;
    const fgtsAnnual = grossMonthly * 0.08 * 12;

    // MEI side
    const das = brMei2026.das[meiActivity];
    const meiNetMonthly = grossMonthly - das;
    const annualRevenue = grossMonthly * 12;

    const cltNetMonthly = roundToCents(monthly.netMonthly);
    const meiNetMonthlyRounded = roundToCents(meiNetMonthly);
    const cltAnnualRounded = roundToCents(cltAnnualNet);
    const meiAnnualRounded = roundToCents(meiNetMonthly * 12);

    return {
      clt: {
        grossMonthly: roundToCents(grossMonthly),
        inss: roundToCents(monthly.inss),
        irrf: roundToCents(monthly.irrf),
        netMonthly: cltNetMonthly,
        decimoTerceiroGross: roundToCents(grossMonthly),
        decimoTerceiroNet: roundToCents(decimoTerceiroNet),
        feriasGross: roundToCents(feriasGross),
        feriasNet: roundToCents(feriasNet),
        annualNet: cltAnnualRounded,
        fgtsAnnual: roundToCents(fgtsAnnual),
        effectiveTaxRate: grossMonthly > 0 ? (monthly.inss + monthly.irrf) / grossMonthly : 0,
      },
      mei: {
        grossMonthly: roundToCents(grossMonthly),
        activity: meiActivity,
        das: roundToCents(das),
        dasBreakdown: DAS_BREAKDOWN[meiActivity],
        netMonthly: meiNetMonthlyRounded,
        annualNet: meiAnnualRounded,
        annualRevenue: roundToCents(annualRevenue),
        revenueLimit: brMei2026.revenueLimit,
        exceedsRevenueLimit: annualRevenue > brMei2026.revenueLimit,
      },
      monthlyDifference: roundToCents(cltNetMonthly - meiNetMonthlyRounded),
      annualDifference: roundToCents(cltAnnualRounded - meiAnnualRounded),
      betterMonthly: winner(cltNetMonthly, meiNetMonthlyRounded),
      betterAnnual: winner(cltAnnualRounded, meiAnnualRounded),
    };
  },
};
