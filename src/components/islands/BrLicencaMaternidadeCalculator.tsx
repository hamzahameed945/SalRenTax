import { useMemo, useState } from 'preact/hooks';
import { brLicencaMaternidadeEngine } from '../../calculators/labor/engines/brLicencaMaternidade';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BrLicencaMaternidadeCalculator() {
  const [monthlySalary, setMonthlySalary] = useState('3000');

  const result = useMemo(() => {
    const validation = brLicencaMaternidadeEngine.validate({
      monthlySalary: Number(monthlySalary),
    });

    return validation.valid ? brLicencaMaternidadeEngine.calculate(validation.data, {} as never, 2026) : null;
  }, [monthlySalary]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="br-licenca-maternidade-salary">
          Salário mensal (CLT)
          <input
            id="br-licenca-maternidade-salary"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={monthlySalary}
            onInput={(event) => setMonthlySalary((event.target as HTMLInputElement).value)}
          />
        </label>
        <p class="text-xs text-slate-500">
          O benefício é de 100% do salário por 120 dias, limitado ao teto do INSS de 2026
          (R$ 8.475,55). Quem paga é a empresa, que compensa o valor na guia do INSS.
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Benefício mensal</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.monthlyBenefit) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Total da licença (4 parcelas)</dt>
              <dd class="font-semibold">{formatCurrency(result.totalBenefit)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Duração</dt>
              <dd>{result.leaveDays} dias</dd>
            </div>
            {result.isCapped && (
              <div class="flex justify-between text-amber-700">
                <dt>Acima do teto (não coberto)</dt>
                <dd>{formatCurrency(result.cappedAmount)}/mês</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
