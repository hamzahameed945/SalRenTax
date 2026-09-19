import { useState, useMemo } from 'preact/hooks';
import { irelandPaycheckEngine } from '../../calculators/salary/engines/ie/irelandPaycheck';
import { enIE } from '../../i18n/en-IE';

const PAY_FREQUENCIES = ['annually', 'monthly', 'biweekly', 'weekly'] as const;

export default function IrelandPaycheckCalculator({ locale }: { locale: string }) {
  const t = enIE.salary.takeHomePay;
  const [grossAnnual, setGrossAnnual] = useState('40000');
  const [payFrequency, setPayFrequency] = useState<'annually' | 'monthly' | 'biweekly' | 'weekly'>('monthly');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');

  const result = useMemo(() => {
    const input = { grossAnnual: parseFloat(grossAnnual), payFrequency, maritalStatus };
    const validation = irelandPaycheckEngine.validate(input);
    if (validation.valid) {
      return {
        data: irelandPaycheckEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [grossAnnual, payFrequency, maritalStatus]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);

  const fmtPct = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);

  const periods = payFrequency === 'annually' ? 1 : payFrequency === 'monthly' ? 12 : payFrequency === 'biweekly' ? 26 : 52;

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.grossAnnual}</label>
          <input
            type="number"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={grossAnnual}
            onInput={(e) => setGrossAnnual((e.target as HTMLInputElement).value)}
            placeholder="e.g. 40000"
          />
          {result.error?.grossAnnual && <p class="mt-1 text-sm text-red-600">{result.error.grossAnnual}</p>}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.maritalStatus}</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={maritalStatus}
            onChange={(e) => setMaritalStatus((e.target as HTMLSelectElement).value as 'single' | 'married')}
          >
            <option value="single">{t.maritalStatuses.single}</option>
            <option value="married">{t.maritalStatuses.married}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{t.fields.payFrequency}</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={payFrequency}
            onChange={(e) => setPayFrequency((e.target as HTMLSelectElement).value as typeof payFrequency)}
          >
            {PAY_FREQUENCIES.map((freq) => (
              <option value={freq}>{t.payFrequencies[freq]}</option>
            ))}
          </select>
        </div>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" role="region" aria-live="polite">
        {result.data ? (
          <div class="space-y-3">
            <div>
              <p class="text-sm text-slate-500">{t.results.netPay}</p>
              <p class="text-4xl font-bold text-accent">{fmt(result.data.netPayPerPeriod)}</p>
            </div>
            <dl class="mt-4 space-y-2 text-sm text-slate-700">
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.grossPay}</dt>
                <dd>{fmt(result.data.grossPayPerPeriod)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.incomeTax}</dt>
                <dd>-{fmt(result.data.payeAnnual / periods)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.usc}</dt>
                <dd>-{fmt(result.data.uscAnnual / periods)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.prsi}</dt>
                <dd>-{fmt(result.data.prsiAnnual / periods)}</dd>
              </div>
              <div class="flex justify-between pt-1 font-medium">
                <dt>{t.results.effectiveRate}</dt>
                <dd>{fmtPct(result.data.effectiveTotalRate)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p class="text-slate-500 text-sm">Enter your annual salary to calculate your take-home pay.</p>
        )}
      </div>
    </div>
  );
}
