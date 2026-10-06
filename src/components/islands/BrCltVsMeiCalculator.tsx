import { useState, useMemo } from 'preact/hooks';
import { brCltVsMeiEngine } from '../../calculators/labor/engines/brCltVsMei';
import type { MeiActivity } from '../../data/labor/br/brMei2026';
import { ptBR } from '../../i18n/pt-BR';

export default function BrCltVsMeiCalculator({ locale }: { locale: string }) {
  const t = ptBR.labor.cltVsMei;
  const [grossMonthly, setGrossMonthly] = useState('5000');
  const [meiActivity, setMeiActivity] = useState<MeiActivity>('servicos');

  const result = useMemo(() => {
    const input = {
      grossMonthly: parseFloat(grossMonthly),
      meiActivity,
    };
    const validation = brCltVsMeiEngine.validate(input);
    if (validation.valid) {
      return {
        data: brCltVsMeiEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [grossMonthly, meiActivity]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(v);

  const fmtSigned = (v: number) =>
    (v >= 0 ? '+' : '−') + fmt(Math.abs(v)).replace('R$', 'R$ ');

  return (
    <div class="grid gap-8 lg:grid-cols-2">
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.grossMonthly}</label>
          <input
            type="number"
            min="1"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={grossMonthly}
            onInput={(e) => setGrossMonthly((e.target as HTMLInputElement).value)}
            placeholder="Ex: 5000"
          />
          {result.error?.grossMonthly && <p class="mt-1 text-sm text-red-600">{result.error.grossMonthly}</p>}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.meiActivity}</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={meiActivity}
            onChange={(e) => setMeiActivity((e.target as HTMLSelectElement).value as MeiActivity)}
          >
            {(Object.keys(t.activityTypes) as MeiActivity[]).map((key) => (
              <option value={key}>{t.activityTypes[key]}</option>
            ))}
          </select>
        </div>
        <p class="text-xs text-slate-500">
          O comparativo usa o mesmo valor bruto para os dois lados: salário (CLT) ou receita de serviços/comércio (MEI).
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" role="region" aria-live="polite">
        {result.data ? (
          <div class="space-y-6">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{t.results.monthlyComparison}</h3>
              <div class="mt-3 grid grid-cols-2 gap-3">
                <div class="rounded-lg border border-slate-200 bg-white p-4">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.results.clt}</p>
                  <p class="mt-1 text-2xl font-bold text-slate-900">{fmt(result.data.clt.netMonthly)}</p>
                  <p class="mt-1 text-xs text-slate-500">
                    {t.results.inss}: {fmt(result.data.clt.inss)} · {t.results.irrf}: {fmt(result.data.clt.irrf)}
                  </p>
                </div>
                <div class="rounded-lg border border-slate-200 bg-white p-4">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.results.mei}</p>
                  <p class="mt-1 text-2xl font-bold text-slate-900">{fmt(result.data.mei.netMonthly)}</p>
                  <p class="mt-1 text-xs text-slate-500">
                    {t.results.das}: {fmt(result.data.mei.das)}
                  </p>
                </div>
              </div>
              <p class="mt-2 text-sm text-slate-600">
                {t.results.monthlyDifference}: <span class="font-semibold">{fmtSigned(result.data.monthlyDifference)}</span>{' '}
                · {t.results.betterMonthly}: <span class="font-semibold">{result.data.betterMonthly === 'tie' ? t.results.tie : result.data.betterMonthly === 'clt' ? t.results.clt : t.results.mei}</span>
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-slate-900">{t.results.annualComparison}</h3>
              <dl class="mt-3 space-y-2 text-sm text-slate-700">
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.clt} — {t.results.annualNet} <span class="text-xs text-slate-400">(11× líquido + 13º + férias)</span></dt>
                  <dd class="font-semibold">{fmt(result.data.clt.annualNet)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.mei} — {t.results.annualNet} <span class="text-xs text-slate-400">(12× líquido)</span></dt>
                  <dd class="font-semibold">{fmt(result.data.mei.annualNet)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.decimoTerceiroNet} (CLT)</dt>
                  <dd>{fmt(result.data.clt.decimoTerceiroNet)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.feriasNet} (CLT)</dt>
                  <dd>{fmt(result.data.clt.feriasNet)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.fgtsAnnual} (CLT)</dt>
                  <dd>{fmt(result.data.clt.fgtsAnnual)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.annualDifference}</dt>
                  <dd class="font-semibold">{fmtSigned(result.data.annualDifference)}</dd>
                </div>
              </dl>
              <p class="mt-2 text-sm text-slate-600">
                {t.results.betterAnnual}: <span class="font-semibold">{result.data.betterAnnual === 'tie' ? t.results.tie : result.data.betterAnnual === 'clt' ? t.results.clt : t.results.mei}</span>
              </p>
              {result.data.mei.exceedsRevenueLimit && (
                <p class="mt-2 text-sm font-medium text-amber-700">{t.results.revenueLimitWarning}</p>
              )}
            </div>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">Preencha o valor bruto para ver o comparativo CLT × MEI.</p>
        )}
      </div>
    </div>
  );
}
