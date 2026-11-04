import { useMemo, useState } from 'preact/hooks';
import { ngThirteenthMonthEngine } from '../../calculators/labor/engines/ngThirteenthMonth';
import PayBreakdownChart from './PayBreakdownChart';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

interface Props {
  initialSalary?: number;
}

export default function NgThirteenthMonthCalculator({ initialSalary }: Props) {
  const [monthlyGrossSalary, setMonthlyGrossSalary] = useState(String(initialSalary ?? 400000));
  const [annualGrossSalary, setAnnualGrossSalary] = useState(
    String((initialSalary ?? 400000) * 12),
  );
  const [submitted, setSubmitted] = useState({
    monthlyGrossSalary,
    annualGrossSalary,
  });

  const result = useMemo(() => {
    const validation = ngThirteenthMonthEngine.validate({
      monthlyGrossSalary: Number(submitted.monthlyGrossSalary),
      annualGrossSalary: Number(submitted.annualGrossSalary),
    });
    return validation.valid ? ngThirteenthMonthEngine.calculate(validation.data) : null;
  }, [submitted]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="ng-13m-sueldo">
          Monthly gross salary (₦)
          <input
            id="ng-13m-sueldo"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={monthlyGrossSalary}
            onInput={(e) => setMonthlyGrossSalary((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="ng-13m-annual">
          Annual gross salary excluding bonus (₦)
          <input
            id="ng-13m-annual"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={annualGrossSalary}
            onInput={(e) => setAnnualGrossSalary((e.target as HTMLInputElement).value)}
          />
        </label>
        <p class="text-xs text-slate-500">
          The marginal PAYE rate is worked out from your annual salary using the Nigeria Tax
          Act 2025 bands (first ₦800,000 at 0%, then 15%, 18%, 21%, 23%, and 25% above
          ₦50 million).
        </p>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() => setSubmitted({ monthlyGrossSalary, annualGrossSalary })}
          >
            Calculate
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setMonthlyGrossSalary(String(initialSalary ?? 400000));
              setAnnualGrossSalary(String((initialSalary ?? 400000) * 12));
              setSubmitted({ monthlyGrossSalary: String(initialSalary ?? 400000), annualGrossSalary: String((initialSalary ?? 400000) * 12) });
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Net 13th month bonus (estimate)</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.netBonus) : '—'}</p>
        {result && (
          <>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <dt>Gross 13th month bonus</dt>
                <dd>{formatCurrency(result.grossBonus)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Marginal PAYE rate</dt>
                <dd>{(result.marginalPayeRate * 100).toFixed(0)}%</dd>
              </div>
              <div class="flex justify-between">
                <dt>PAYE on bonus</dt>
                <dd>{formatCurrency(result.payeOnBonus)}</dd>
              </div>
            </dl>
            <PayBreakdownChart
              title="Gross bonus breakdown"
              format={formatCurrency}
              segments={[
                { label: 'Net 13th month bonus', value: result.netBonus, color: '#0d9488' },
                { label: 'PAYE on bonus', value: result.payeOnBonus, color: '#2563eb' },
              ]}
            />
          </>
        )}
        <p class="mt-4 text-xs text-slate-500">
          Estimate only. Not all employers pay a 13th month bonus, and the Nigeria Revenue
          Service applies the progressive PAYE bands annually, so the effective rate on a
          single bonus can differ.
        </p>
      </div>
    </div>
  );
}
