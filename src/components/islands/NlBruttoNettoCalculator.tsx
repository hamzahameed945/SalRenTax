import { useState, useMemo } from 'preact/hooks';
import { nlBruttoNettoEngine } from '../../calculators/salary/engines/nl/nlBruttoNetto';
import { nlNL } from '../../i18n/nl-NL';

export default function NlBruttoNettoCalculator({ locale }: { locale: string }) {
  const t = nlNL.salary.bruttoNetto;
  const [grossAnnual, setGrossAnnual] = useState('45000');

  const result = useMemo(() => {
    const input = { grossAnnual: parseFloat(grossAnnual) };
    const validation = nlBruttoNettoEngine.validate(input);
    if (validation.valid) {
      return {
        data: nlBruttoNettoEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [grossAnnual]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);

  const fmtPct = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);

  return (
    <div class="space-y-6">
      <div class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="note">
        {t.notice}
      </div>
      <div class="grid gap-8 md:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.grossAnnual}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={grossAnnual}
            onInput={(e) => setGrossAnnual((e.target as HTMLInputElement).value)}
            placeholder="bijv. 45000"
          />
          {result.error?.grossAnnual && <p class="mt-1 text-sm text-red-600">{result.error.grossAnnual}</p>}
        </div>

        <div class="rounded-xl bg-slate-50 p-6" role="region" aria-live="polite">
          {result.data ? (
            <div class="space-y-4">
              <div>
                <p class="text-sm text-slate-500">{t.results.netMonthly}</p>
                <p class="text-4xl font-bold text-accent">{fmt(result.data.netMonthly)}</p>
                <p class="text-sm text-slate-500 mt-1">per maand (geschat)</p>
              </div>
              <dl class="mt-4 space-y-2 text-sm text-slate-700">
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.grossAnnual}</dt>
                  <dd>{fmt(result.data.grossAnnual)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.incomeTax}</dt>
                  <dd>-{fmt(result.data.incomeTaxAnnual)}</dd>
                </div>
                <div class="flex justify-between pt-1 font-medium">
                  <dt>{t.results.netAnnual}</dt>
                  <dd>{fmt(result.data.netAnnual)}</dd>
                </div>
              </dl>
              <p class="text-sm text-slate-500">Effectief tarief: {fmtPct(result.data.effectiveRate)}</p>
            </div>
          ) : (
            <p class="text-slate-500 text-sm">Voer uw bruto jaarsalaris in om uw netto salaris te berekenen.</p>
          )}
        </div>
      </div>
    </div>
  );
}
