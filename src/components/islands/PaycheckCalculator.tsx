import { useMemo, useState } from 'preact/hooks';
import { usPaycheckEngine, type FilingStatus } from '../../calculators/salary/engines/usPaycheck';
import type { PayFrequency } from '../../calculators/core/frequency';
import { getLocaleConfig } from '../../data/locales';
import { formatCurrency, formatPercent } from '../../lib/formatting/format';
import { enUS } from '../../i18n/en-US';

const config = getLocaleConfig('en-US');
const t = enUS.salary.paycheck;
const tErrors = enUS.errors;

const PAY_FREQUENCIES: PayFrequency[] = [
  'weekly',
  'biweekly',
  'semimonthly',
  'monthly',
  'annually',
];
const FILING_STATUSES: FilingStatus[] = ['single', 'marriedJointly'];

export default function PaycheckCalculator() {
  const [grossPay, setGrossPay] = useState('2500');
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('biweekly');
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [preTaxDeductions, setPreTaxDeductions] = useState('0');
  const [touched, setTouched] = useState(false);

  const input = {
    grossPayPerPeriod: Number(grossPay),
    payFrequency,
    filingStatus,
    preTaxDeductionsPerPeriod: Number(preTaxDeductions) || 0,
  };

  const validation = usPaycheckEngine.validate(input);

  const result = useMemo(() => {
    if (!validation.valid) return null;
    return usPaycheckEngine.calculate(input, { countryCode: 'US' }, 2026);
  }, [grossPay, payFrequency, filingStatus, preTaxDeductions]);

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <form
        class="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
        }}
      >
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="grossPay">
            {t.fields.grossPay}
          </label>
          <input
            id="grossPay"
            type="number"
            min="0"
            step="0.01"
            value={grossPay}
            onInput={(e) => setGrossPay((e.target as HTMLInputElement).value)}
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            aria-invalid={touched && !validation.valid && !!validation.errors.grossPayPerPeriod}
            aria-describedby="grossPay-error"
          />
          {touched && !validation.valid && validation.errors.grossPayPerPeriod && (
            <p id="grossPay-error" class="mt-1 text-sm text-red-600">
              {tErrors[validation.errors.grossPayPerPeriod.split('.')[1] as keyof typeof tErrors]}
            </p>
          )}
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="payFrequency">
            {t.fields.payFrequency}
          </label>
          <select
            id="payFrequency"
            value={payFrequency}
            onChange={(e) => setPayFrequency((e.target as HTMLSelectElement).value as PayFrequency)}
            class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {PAY_FREQUENCIES.map((freq) => (
              <option value={freq}>
                {t.payFrequencies[freq as keyof typeof t.payFrequencies]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="filingStatus">
            {t.fields.filingStatus}
          </label>
          <select
            id="filingStatus"
            value={filingStatus}
            onChange={(e) => setFilingStatus((e.target as HTMLSelectElement).value as FilingStatus)}
            class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {FILING_STATUSES.map((status) => (
              <option value={status}>
                {t.filingStatuses[status as keyof typeof t.filingStatuses]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="preTaxDeductions">
            {t.fields.preTaxDeductions}
          </label>
          <input
            id="preTaxDeductions"
            type="number"
            min="0"
            step="0.01"
            value={preTaxDeductions}
            onInput={(e) => setPreTaxDeductions((e.target as HTMLInputElement).value)}
            class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
          >
            {t.calculate}
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setGrossPay('2500');
              setPayFrequency('biweekly');
              setFilingStatus('single');
              setPreTaxDeductions('0');
              setTouched(false);
            }}
          >
            {t.reset}
          </button>
        </div>
      </form>

      <div
        class="rounded-xl border border-slate-200 bg-slate-50 p-6"
        role="region"
        aria-live="polite"
        aria-label={t.title}
      >
        {result ? (
          <div class="space-y-3">
            <p class="text-sm font-medium uppercase tracking-wide text-slate-500">
              {t.results.netPay}
            </p>
            <p class="text-4xl font-bold text-accent">
              {formatCurrency(result.netPayPerPeriod, config)}
            </p>
            <dl class="mt-4 space-y-2 text-sm text-slate-700">
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.grossPay}</dt>
                <dd>{formatCurrency(result.grossPayPerPeriod, config)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.federalIncomeTax}</dt>
                <dd>-{formatCurrency(result.federalIncomeTaxPerPeriod, config)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.socialSecurity}</dt>
                <dd>-{formatCurrency(result.socialSecurityPerPeriod, config)}</dd>
              </div>
              <div class="flex justify-between border-b border-slate-200 pb-1">
                <dt>{t.results.medicare}</dt>
                <dd>-{formatCurrency(result.medicarePerPeriod, config)}</dd>
              </div>
              {result.preTaxDeductionsPerPeriod > 0 && (
                <div class="flex justify-between border-b border-slate-200 pb-1">
                  <dt>{t.results.preTaxDeductions}</dt>
                  <dd>-{formatCurrency(result.preTaxDeductionsPerPeriod, config)}</dd>
                </div>
              )}
              <div class="flex justify-between pt-1 font-medium">
                <dt>{t.results.effectiveRate}</dt>
                <dd>{formatPercent(result.effectiveFederalRate, config)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p class="text-sm text-slate-500">{tErrors.invalidNumber}</p>
        )}
      </div>
    </div>
  );
}
