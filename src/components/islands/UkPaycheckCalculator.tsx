import { useState, useMemo } from 'preact/hooks';
import PayBreakdownChart from './PayBreakdownChart';
import { ukPaycheckEngine } from '../../calculators/salary/engines/gb/ukPaycheck';
import { enGB } from '../../i18n/en-GB';

const PAY_FREQUENCIES = ['annually', 'monthly', 'biweekly', 'weekly'] as const;

export default function UkPaycheckCalculator({
  locale,
  initialGrossAnnual,
}: {
  locale: string;
  initialGrossAnnual?: string;
}) {
  const t = enGB.salary.takeHomePay;
  const [grossAnnual, setGrossAnnual] = useState(initialGrossAnnual ?? '35000');
  const [payFrequency, setPayFrequency] = useState<'annually' | 'monthly' | 'biweekly' | 'weekly'>('monthly');
  const [submitted, setSubmitted] = useState({
    grossAnnual,
    payFrequency,
  });

  const result = useMemo(() => {
    const input = {
      grossAnnual: parseFloat(submitted.grossAnnual),
      payFrequency: submitted.payFrequency,
    };
    const validation = ukPaycheckEngine.validate(input);
    if (validation.valid) {
      return {
        data: ukPaycheckEngine.calculate(validation.data, {} as never, 2026),
        error: null,
      };
    }
    return { data: null, error: validation.errors };
  }, [submitted]);

  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'GBP' }).format(v);

  const fmtPct = (v: number) =>
    new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);

  const periods = submitted.payFrequency === 'annually' ? 1 : submitted.payFrequency === 'monthly' ? 12 : submitted.payFrequency === 'biweekly' ? 26 : 52;

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
            placeholder="e.g. 35000"
          />
          {result.error?.grossAnnual && <p class="mt-1 text-sm text-red-600">{result.error.grossAnnual}</p>}
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

        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() => setSubmitted({ grossAnnual, payFrequency })}
          >
            Calculate
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setGrossAnnual(initialGrossAnnual ?? '35000');
              setPayFrequency('monthly');
              setSubmitted({ grossAnnual: initialGrossAnnual ?? '35000', payFrequency: 'monthly' });
            }}
          >
            Reset
          </button>
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
                <dd>-{fmt(result.data.incomeTaxAnnual / periods)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.nationalInsurance}</dt>
                <dd>-{fmt(result.data.nationalInsuranceAnnual / periods)}</dd>
              </div>
              <div class="flex justify-between pt-1 font-medium">
                <dt>{t.results.effectiveRate}</dt>
                <dd>{fmtPct(result.data.effectiveTotalRate)}</dd>
              </div>
            </dl>
            <PayBreakdownChart
              title="Pay breakdown"
              format={(value) => fmt(value)}
              segments={[
                { label: t.results.netPay, value: result.data.netPayPerPeriod, color: '#0d9488' },
                { label: t.results.incomeTax, value: result.data.incomeTaxAnnual / periods, color: '#2563eb' },
                { label: t.results.nationalInsurance, value: result.data.nationalInsuranceAnnual / periods, color: '#7c3aed' },
              ]}
            />
          </div>
        ) : (
          <p class="text-slate-500 text-sm">Enter your annual salary to calculate your take-home pay.</p>
        )}
      </div>
    </div>
  );
}
