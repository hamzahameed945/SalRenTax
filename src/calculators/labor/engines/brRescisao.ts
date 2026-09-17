import type { CalculatorEngine, ValidationResult } from '../../core/types';

export type BrDismissalType =
  | 'pedidoDeExoneracao'
  | 'demissaoSemJustaCausa'
  | 'demissaoPorJustaCausa'
  | 'rescisaoAcordada';

export interface BrRescisaoInput {
  /** Monthly gross salary, BRL. */
  grossMonthly: number;
  /** Months worked in the current year (1–11) for proportional 13th salary. */
  monthsWorked: number;
  /** Vacation days pending (unpaid). */
  daysVacationPending: number;
  dismissalType: BrDismissalType;
}

export interface BrRescisaoResult {
  /** Remaining salary for days worked in the last month (approximate: full month here). */
  saldoSalario: number;
  /** Proportional vacation pay + 1/3 vacation bonus. */
  feriasProporcionais: number;
  /** Proportional 13th salary for months worked. */
  decimoTerceiroProportional: number;
  /** Aviso prévio if applicable. */
  avisoPrevio: number;
  /** FGTS fine 40% — only for unjustified dismissal. */
  multaFgts: number;
  /** Estimated total rescisão (gross, before IR/FGTS deductions). */
  totalRescisao: number;
  /** Monthly FGTS deposit balance is NOT computed — show note. */
  fgtsBalanceNote: string;
}

/**
 * Brazilian CLT termination payment (rescisão) estimator.
 * NOTE: FGTS actual balance is not computable without employment history.
 * The 40% fine is calculated on a notional 8%/month deposit = grossMonthly × 0.08 × yearsWorked × 12.
 * Source: Consolidação das Leis do Trabalho (CLT) — Arts. 477, 478, 487.
 */
export const brRescisaoEngine: CalculatorEngine<BrRescisaoInput, BrRescisaoResult, never> = {
  validate(input: BrRescisaoInput): ValidationResult<BrRescisaoInput> {
    const errors: Partial<Record<keyof BrRescisaoInput, string>> = {};

    if (!input.grossMonthly || Number.isNaN(input.grossMonthly)) {
      errors.grossMonthly = 'errors.invalidNumber';
    } else if (input.grossMonthly <= 0) {
      errors.grossMonthly = 'errors.mustBePositive';
    }

    if (
      input.monthsWorked === undefined ||
      Number.isNaN(input.monthsWorked) ||
      input.monthsWorked < 1 ||
      input.monthsWorked > 12
    ) {
      errors.monthsWorked = 'errors.invalidNumber';
    }

    return Object.keys(errors).length === 0
      ? { valid: true, data: input }
      : { valid: false, errors };
  },

  calculate(input: BrRescisaoInput): BrRescisaoResult {
    const { grossMonthly, monthsWorked, daysVacationPending, dismissalType } = input;
    const dailyRate = grossMonthly / 30;

    const saldoSalario = grossMonthly; // full month approximation

    // Proportional vacation: (daysVacationPending / 30) * grossMonthly + 1/3 bonus
    const feriasBase = (daysVacationPending / 30) * grossMonthly;
    const feriasProporcionais = feriasBase + feriasBase / 3;

    // Proportional 13th salary: (monthsWorked / 12) * grossMonthly
    const decimoTerceiroProportional = (monthsWorked / 12) * grossMonthly;

    // Aviso prévio: 30 days base — only for demissaoSemJustaCausa or rescisaoAcordada
    const avisoPrevio =
      dismissalType === 'demissaoSemJustaCausa' || dismissalType === 'rescisaoAcordada'
        ? dailyRate * 30
        : 0;

    // FGTS 40% fine — only for demissaoSemJustaCausa
    // Approximate FGTS balance: 8% monthly deposit × 12 × years ≈ grossMonthly × 0.08 × 12 × (monthsWorked / 12)
    // We use a simplified single-year deposit here
    const estimatedFgtsBalance = grossMonthly * 0.08 * monthsWorked;
    const multaFgts = dismissalType === 'demissaoSemJustaCausa' ? estimatedFgtsBalance * 0.4 : 0;

    const totalRescisao =
      saldoSalario + feriasProporcionais + decimoTerceiroProportional + avisoPrevio + multaFgts;

    return {
      saldoSalario,
      feriasProporcionais,
      decimoTerceiroProportional,
      avisoPrevio,
      multaFgts,
      totalRescisao,
      fgtsBalanceNote: 'O saldo do FGTS é estimado com base em 8%/mês. Consulte seu extrato FGTS real.',
    };
  },
};
