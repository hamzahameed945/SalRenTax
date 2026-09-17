import { useState, useMemo } from 'preact/hooks';
import { bruttoNettoEngine } from '../../calculators/salary/engines/de/bruttoNetto';
import { deDE } from '../../i18n/de-DE';

export default function BruttoNettoCalculator({ locale }: { locale: string }) {
  const t = deDE.salary.bruttoNetto;
  const [grossMonthly, setGrossMonthly] = useState('3000');
  const [childless, setChildless] = useState(false);

  const result = useMemo(() => {
    const input = { grossMonthly: parseFloat(grossMonthly), childless };
    const validation = bruttoNettoEngine.validate(input);
    if (validation.valid) {
      return {
        data: bruttoNettoEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [grossMonthly, childless]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div class="space-y-6">
      <div class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="note">
        {t.incomeTaxNotice}
      </div>
      <div class="grid gap-8 md:grid-cols-2">
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.grossMonthly}</label>
            <input
              type="number"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              value={grossMonthly}
              onInput={(e) => setGrossMonthly((e.target as HTMLInputElement).value)}
              placeholder="z. B. 3000"
            />
            {result.error?.grossMonthly && <p class="mt-1 text-sm text-red-600">{result.error.grossMonthly}</p>}
          </div>
          <div class="flex items-center gap-2">
            <input
              id="childless"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300"
              checked={childless}
              onChange={(e) => setChildless((e.target as HTMLInputElement).checked)}
            />
            <label for="childless" class="text-sm font-medium text-slate-700">{t.fields.childless}</label>
          </div>
        </div>

        <div class="rounded-xl bg-slate-50 p-6" role="region" aria-live="polite">
          {result.data ? (
            <div class="space-y-3">
              <div>
                <p class="text-sm text-slate-500">{t.results.netAfterSocialInsurance}</p>
                <p class="text-3xl font-bold text-accent">{fmt(result.data.netAfterSocialInsuranceMonthly)}</p>
                <p class="text-xs text-slate-400 mt-1">⚠ Vor Lohnsteuer</p>
              </div>
              <dl class="mt-4 space-y-2 text-sm text-slate-700">
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.grossMonthly}</dt>
                  <dd>{fmt(result.data.grossMonthly)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.pensionInsurance}</dt>
                  <dd>-{fmt(result.data.pensionInsuranceEmployee)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.unemploymentInsurance}</dt>
                  <dd>-{fmt(result.data.unemploymentInsuranceEmployee)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.healthInsurance}</dt>
                  <dd>-{fmt(result.data.healthInsuranceEmployee)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.longTermCareInsurance}</dt>
                  <dd>-{fmt(result.data.longTermCareInsuranceEmployee)}</dd>
                </div>
                <div class="flex justify-between pt-1 font-medium">
                  <dt>{t.results.totalSocialInsurance}</dt>
                  <dd>-{fmt(result.data.totalSocialInsuranceEmployee)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p class="text-slate-500 text-sm">Geben Sie Ihr Bruttogehalt ein, um die Abzüge zu berechnen.</p>
          )}
        </div>
      </div>
    </div>
  );
}
