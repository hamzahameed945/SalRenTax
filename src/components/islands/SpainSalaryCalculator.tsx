import { useState, useMemo } from 'preact/hooks';
import { spainSalaryEngine } from '../../calculators/salary/engines/es/spainSalary';
import { esES } from '../../i18n/es-ES';

export default function SpainSalaryCalculator({ locale }: { locale: string }) {
  const t = esES.salary.nomina;
  const [grossAnnual, setGrossAnnual] = useState('30000');
  const [paymentsPerYear, setPaymentsPerYear] = useState<'12' | '14'>('14');

  const result = useMemo(() => {
    const input = {
      grossAnnual: parseFloat(grossAnnual),
      paymentsPerYear: (paymentsPerYear === '14' ? 14 : 12) as 12 | 14,
    };
    const validation = spainSalaryEngine.validate(input);
    if (validation.valid) {
      return {
        data: spainSalaryEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [grossAnnual, paymentsPerYear]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div class="space-y-6">
      <div class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="note">
        {t.irpfNotice}
      </div>
      <div class="grid gap-8 md:grid-cols-2">
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.grossAnnual}</label>
            <input
              type="number"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              value={grossAnnual}
              onInput={(e) => setGrossAnnual((e.target as HTMLInputElement).value)}
              placeholder="p. ej. 30000"
            />
            {result.error?.grossAnnual && <p class="mt-1 text-sm text-red-600">{result.error.grossAnnual}</p>}
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.paymentsPerYear}</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              value={paymentsPerYear}
              onChange={(e) => setPaymentsPerYear((e.target as HTMLSelectElement).value as '12' | '14')}
            >
              <option value="14">{t.payments['14']}</option>
              <option value="12">{t.payments['12']}</option>
            </select>
          </div>
        </div>

        <div class="rounded-xl bg-slate-50 p-6" role="region" aria-live="polite">
          {result.data ? (
            <div class="space-y-4">
              <div>
                <p class="text-sm text-slate-500">{t.results.netPerPayment}</p>
                <p class="text-3xl font-bold text-accent">{fmt(result.data.netPerPayment)}</p>
              </div>
              <dl class="mt-4 space-y-2 text-sm text-slate-700">
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.grossAnnual}</dt>
                  <dd>{fmt(result.data.grossAnnual)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.irpfStateAnnual}</dt>
                  <dd>-{fmt(result.data.irpfStateAnnual)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.seguridadSocialAnnual}</dt>
                  <dd>-{fmt(result.data.seguridadSocialAnnual)}</dd>
                </div>
                <div class="flex justify-between pt-1 font-medium">
                  <dt>{t.results.netAnnual}</dt>
                  <dd>{fmt(result.data.netAnnual)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p class="text-slate-500 text-sm">Introduce tu salario bruto anual para calcular tu nómina.</p>
          )}
        </div>
      </div>
    </div>
  );
}
