import { useState, useMemo } from 'preact/hooks';
import { brRescisaoEngine, type BrDismissalType } from '../../calculators/labor/engines/brRescisao';
import { ptBR } from '../../i18n/pt-BR';

export default function BrRescisaoCalculator({ locale }: { locale: string }) {
  const t = ptBR.labor.rescisao;
  const [grossMonthly, setGrossMonthly] = useState('3000');
  const [monthsWorked, setMonthsWorked] = useState('8');
  const [daysVacationPending, setDaysVacationPending] = useState('10');
  const [dismissalType, setDismissalType] = useState<BrDismissalType>('demissaoSemJustaCausa');

  const result = useMemo(() => {
    const input = {
      grossMonthly: parseFloat(grossMonthly),
      monthsWorked: parseInt(monthsWorked, 10),
      daysVacationPending: parseInt(daysVacationPending, 10) || 0,
      dismissalType,
    };
    const validation = brRescisaoEngine.validate(input);
    if (validation.valid) {
      return {
        data: brRescisaoEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [grossMonthly, monthsWorked, daysVacationPending, dismissalType]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div class="grid gap-8 lg:grid-cols-2">
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.grossMonthly}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={grossMonthly}
            onInput={(e) => setGrossMonthly((e.target as HTMLInputElement).value)}
            placeholder="Ex: 3000"
          />
          {result.error?.grossMonthly && <p class="mt-1 text-sm text-red-600">{result.error.grossMonthly}</p>}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.monthsWorked}</label>
          <input
            type="number"
            min="1"
            max="12"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={monthsWorked}
            onInput={(e) => setMonthsWorked((e.target as HTMLInputElement).value)}
            placeholder="Ex: 8"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.daysVacationPending}</label>
          <input
            type="number"
            min="0"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={daysVacationPending}
            onInput={(e) => setDaysVacationPending((e.target as HTMLInputElement).value)}
            placeholder="Ex: 10"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.dismissalType}</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={dismissalType}
            onChange={(e) => setDismissalType((e.target as HTMLSelectElement).value as BrDismissalType)}
          >
            {(Object.keys(t.dismissalTypes) as BrDismissalType[]).map((key) => (
              <option value={key}>{t.dismissalTypes[key]}</option>
            ))}
          </select>
        </div>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" role="region" aria-live="polite">
        {result.data ? (
          <div class="space-y-3">
            <div>
              <p class="text-sm text-slate-500">{t.results.totalRescisao}</p>
              <p class="text-4xl font-bold text-accent">{fmt(result.data.totalRescisao)}</p>
            </div>
            <dl class="mt-4 space-y-2 text-sm text-slate-700">
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.saldoSalario}</dt>
                <dd>{fmt(result.data.saldoSalario)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.feriasProporcionais}</dt>
                <dd>{fmt(result.data.feriasProporcionais)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.decimoTerceiroProportional}</dt>
                <dd>{fmt(result.data.decimoTerceiroProportional)}</dd>
              </div>
              {result.data.avisoPrevio > 0 && (
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.avisoPrevio}</dt>
                  <dd>{fmt(result.data.avisoPrevio)}</dd>
                </div>
              )}
              {result.data.multaFgts > 0 && (
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.multaFgts}</dt>
                  <dd>{fmt(result.data.multaFgts)}</dd>
                </div>
              )}
            </dl>
            <p class="mt-4 text-xs text-slate-500">{result.data.fgtsBalanceNote}</p>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">Preencha os campos ao lado para calcular sua rescisão.</p>
        )}
      </div>
    </div>
  );
}
