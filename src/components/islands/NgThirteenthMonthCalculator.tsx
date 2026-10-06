import { useMemo, useState } from 'preact/hooks';
import { ngThirteenthMonthEngine } from '../../calculators/labor/engines/ngThirteenthMonth';

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

  const result = useMemo(() => {
    const validation = ngThirteenthMonthEngine.validate({
      monthlyGrossSalary: Number(monthlyGrossSalary),
      annualGrossSalary: Number(annualGrossSalary),
    });
    return validation.valid ? ngThirteenthMonthEngine.calculate(validation.data) : null;
  }, [monthlyGrossSalary, annualGrossSalary]);

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
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Net 13th month bonus (estimate)</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.netBonus) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Gross 13th month (1 × monthly salary)</dt>
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
        )}
        <p class="mt-4 text-xs text-slate-500">
          2026 estimate under the Nigeria Tax Act 2025 bands. The 13th month is customary in
          Nigeria — not legally required — so check what your employer actually pays.
        </p>
      </div>
    </div>
  );
}
