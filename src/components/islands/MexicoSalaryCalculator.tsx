import { useState, useMemo } from 'preact/hooks';
import { mexicoSalaryEngine } from '../../calculators/salary/engines/mx/mexicoSalary';
import { esMX } from '../../i18n/es-MX';

export default function MexicoSalaryCalculator({ locale }: { locale: string }) {
  const t = esMX.salary.isr;
  const [grossMonthly, setGrossMonthly] = useState('15000');

  const result = useMemo(() => {
    const input = { grossMonthly: parseFloat(grossMonthly) };
    const validation = mexicoSalaryEngine.validate(input);
    if (validation.valid) {
      return {
        data: mexicoSalaryEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [grossMonthly]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(v);

  return (
    <div class="space-y-6">
      <div class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="note">
        {t.imssNotice}
      </div>
      <div class="grid gap-8 md:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.grossMonthly}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={grossMonthly}
            onInput={(e) => setGrossMonthly((e.target as HTMLInputElement).value)}
            placeholder="p. ej. 15000"
          />
          {result.error?.grossMonthly && <p class="mt-1 text-sm text-red-600">{result.error.grossMonthly}</p>}
        </div>

        <div class="rounded-xl bg-slate-50 p-6" role="region" aria-live="polite">
          {result.data ? (
            <div class="space-y-4">
              <div>
                <p class="text-sm text-slate-500">{t.results.netMonthly}</p>
                <p class="text-3xl font-bold text-accent">{fmt(result.data.netMonthly)}</p>
              </div>
              <dl class="mt-4 space-y-2 text-sm text-slate-700">
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.grossMonthly}</dt>
                  <dd>{fmt(result.data.grossMonthly)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.isrMonthly}</dt>
                  <dd>-{fmt(result.data.isrMonthly)}</dd>
                </div>
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.imssCesantiaYVejez}</dt>
                  <dd>-{fmt(result.data.imssCesantiaYVejezEmployee)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p class="text-slate-500 text-sm">Ingresa tu sueldo mensual para calcular tu ISR.</p>
          )}
        </div>
      </div>
    </div>
  );
}
