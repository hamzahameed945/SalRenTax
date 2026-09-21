import { useMemo, useState } from 'preact/hooks';
import { brSalarioLiquidoEngine } from '../../calculators/salary/engines/brSalarioLiquido';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export default function BrSalarioLiquidoCalculator() {
  const [grossMonthly, setGrossMonthly] = useState('4000');
  const [dependents, setDependents] = useState('0');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const result = useMemo(() => {
    const validation = brSalarioLiquidoEngine.validate({ 
      grossMonthly: Number(grossMonthly),
      dependents: Number(dependents),
    });
    return validation.valid
      ? brSalarioLiquidoEngine.calculate(validation.data, {} as never, 2026)
      : null;
  }, [grossMonthly, dependents]);

  return (
    <div class="space-y-6">
      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-4">
          <label class="block text-sm font-medium" for="br-net-gross">
            Salário bruto mensal (R$)
            <input
              id="br-net-gross"
              class="mt-1 w-full rounded border border-slate-300 p-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              type="number"
              min="0"
              step="0.01"
              value={grossMonthly}
              onInput={(event) => setGrossMonthly((event.target as HTMLInputElement).value)}
            />
          </label>
          
          <label class="block text-sm font-medium" for="br-net-dependents">
            Número de dependentes
            <input
              id="br-net-dependents"
              class="mt-1 w-full rounded border border-slate-300 p-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              type="number"
              min="0"
              step="1"
              value={dependents}
              onInput={(event) => setDependents((event.target as HTMLInputElement).value)}
            />
          </label>
          
          <p class="text-xs text-slate-500">
            Cálculo com INSS e IRRF 2026. Dedução de R$ 189,59 por dependente aplicada.
          </p>
        </div>

        <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
          <p class="text-sm text-slate-500">Salário líquido mensal</p>
          <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.netMonthly) : '—'}</p>
          {result && (
            <>
              <p class="mt-2 text-sm text-slate-600">
                Você leva {formatPercent(result.takeHomePercentage)} do bruto
              </p>
              <dl class="mt-4 space-y-2 text-sm">
                <div class="flex justify-between border-t border-slate-200 pt-2">
                  <dt class="font-medium">Salário bruto</dt>
                  <dd>{formatCurrency(result.grossMonthly)}</dd>
                </div>
                <div class="flex justify-between text-red-600">
                  <dt>− INSS</dt>
                  <dd>{formatCurrency(result.inss)}</dd>
                </div>
                {result.dependents > 0 && (
                  <div class="flex justify-between text-green-600">
                    <dt>− Dedução dependentes ({result.dependents})</dt>
                    <dd>{formatCurrency(result.dependentDeduction)}</dd>
                  </div>
                )}
                <div class="flex justify-between text-red-600">
                  <dt>− IRRF</dt>
                  <dd>{formatCurrency(result.irrf)}</dd>
                </div>
                <div class="flex justify-between border-t border-slate-200 pt-2 font-medium">
                  <dt>Salário líquido</dt>
                  <dd class="text-accent">{formatCurrency(result.netMonthly)}</dd>
                </div>
              </dl>
              
              <button
                class="mt-4 w-full text-sm text-accent hover:underline"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                {showBreakdown ? '− Ocultar detalhes' : '+ Ver detalhamento completo'}
              </button>
            </>
          )}
        </div>
      </div>

      {result && showBreakdown && (
        <div class="rounded-xl border border-slate-200 bg-white p-6">
          <h3 class="text-lg font-semibold">Detalhamento INSS por faixa</h3>
          <table class="mt-3 w-full text-sm">
            <thead class="border-b">
              <tr class="text-left">
                <th class="py-2">Faixa</th>
                <th class="py-2 text-right">Base</th>
                <th class="py-2 text-right">Alíquota</th>
                <th class="py-2 text-right">INSS</th>
              </tr>
            </thead>
            <tbody>
              {result.inssPerBracket.map((bracket) => (
                <tr class="border-b border-slate-100">
                  <td class="py-2">{bracket.bracketLabel}</td>
                  <td class="py-2 text-right">{formatCurrency(bracket.taxableAmount)}</td>
                  <td class="py-2 text-right">{formatPercent(bracket.rate)}</td>
                  <td class="py-2 text-right">{formatCurrency(bracket.inssOwed)}</td>
                </tr>
              ))}
              <tr class="font-medium">
                <td class="py-2" colSpan={3}>Total INSS</td>
                <td class="py-2 text-right">{formatCurrency(result.inss)}</td>
              </tr>
            </tbody>
          </table>

          <h3 class="mt-6 text-lg font-semibold">Detalhamento IRRF</h3>
          <dl class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Base de cálculo</dt>
              <dd>{formatCurrency(result.taxableIncome)}</dd>
            </div>
            {result.irrfPerBracket.length > 0 && (
              <>
                <div class="flex justify-between">
                  <dt>Imposto antes da dedução</dt>
                  <dd>{formatCurrency(result.irrfBeforeReduction)}</dd>
                </div>
                {result.irrfReduction > 0 && (
                  <div class="flex justify-between text-green-600">
                    <dt>Redução (isenção até R$ 5.000)</dt>
                    <dd>−{formatCurrency(result.irrfReduction)}</dd>
                  </div>
                )}
              </>
            )}
            <div class="flex justify-between border-t border-slate-200 pt-2 font-medium">
              <dt>IRRF final</dt>
              <dd>{formatCurrency(result.irrf)}</dd>
            </div>
          </dl>

          <div class="mt-6 rounded-lg bg-blue-50 p-4 text-sm">
            <p class="font-medium text-blue-900">Taxa efetiva: {formatPercent(result.effectiveTaxRate)}</p>
            <p class="mt-1 text-blue-700">
              Você paga {formatPercent(result.effectiveTaxRate)} do salário bruto em impostos (INSS + IRRF).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
