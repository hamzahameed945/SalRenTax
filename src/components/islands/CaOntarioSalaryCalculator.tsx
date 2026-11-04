import { useMemo, useState } from 'preact/hooks';
import PayBreakdownChart from './PayBreakdownChart';
import { calculateCaOntarioSalary } from '../../calculators/salary/engines/ca/canadaOntarioSalary';

const DEFAULT_GROSS_ANNUAL = '75000';
const SCOPE_NOTE =
  'Estimate only: includes federal and Ontario income tax (with basic personal amounts), CPP/CPP2 and EI. Excludes the Ontario Health Premium and other credits/deductions.';

export default function CaOntarioSalaryCalculator({ initialGross = Number(DEFAULT_GROSS_ANNUAL) }: { initialGross?: number }) {
  const initialGrossAnnual = String(initialGross);
  const [grossAnnual, setGrossAnnual] = useState(initialGrossAnnual);
  const [submitted, setSubmitted] = useState(initialGrossAnnual);

  const result = useMemo(() => calculateCaOntarioSalary(Number(submitted)), [submitted]);
  const format = (value: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
  const isValid = Number(submitted) > 0;

  const handleCalculate = (event: Event) => {
    event.preventDefault();
    setSubmitted(grossAnnual);
  };

  const handleReset = () => {
    setGrossAnnual(initialGrossAnnual);
    setSubmitted(initialGrossAnnual);
  };

  return (
    <div class="grid gap-8 md:grid-cols-2">
      <div class="space-y-6">
        <form onSubmit={handleCalculate} class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" htmlFor="ca-gross-annual">
              Gross annual salary (CAD)
            </label>
            <input
              id="ca-gross-annual"
              type="number"
              min="0"
              step="1"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              value={grossAnnual}
              onInput={(e) => setGrossAnnual((e.target as HTMLInputElement).value)}
              placeholder="e.g. 75000"
            />
          </div>
          <div class="flex gap-3">
            <button
              type="submit"
              class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            >
              Calculate
            </button>
            <button
              type="button"
              onClick={handleReset}
              class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </form>
        <p class="text-sm text-slate-600">{SCOPE_NOTE}</p>
      </div>
      <div class="space-y-6">
        {isValid ? (
          <>
            <div class="rounded-lg border border-slate-200 p-4">
              <p class="text-sm text-slate-600">Take-home pay (annual)</p>
              <p class="text-2xl font-bold text-slate-900">{format(result.netAnnual)}</p>
              <p class="text-sm text-slate-600">Take-home pay (monthly): {format(result.netMonthly)}</p>
            </div>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between"><dt>Gross annual salary</dt><dd>{format(result.grossAnnual)}</dd></div>
              <div class="flex justify-between"><dt>Federal tax</dt><dd>{format(result.federalTax)}</dd></div>
              <div class="flex justify-between"><dt>Ontario tax (including surtax)</dt><dd>{format(result.ontarioTax)}</dd></div>
              <div class="flex justify-between"><dt>Ontario surtax</dt><dd>{format(result.ontarioSurtax)}</dd></div>
              <div class="flex justify-between"><dt>CPP</dt><dd>{format(result.cpp)}</dd></div>
              <div class="flex justify-between"><dt>CPP2</dt><dd>{format(result.cpp2)}</dd></div>
              <div class="flex justify-between"><dt>EI</dt><dd>{format(result.ei)}</dd></div>
              <div class="flex justify-between font-semibold"><dt>Total deductions</dt><dd>{format(result.totalDeductions)}</dd></div>
            </dl>
            <PayBreakdownChart
              segments={[
                { label: 'Take-home pay', value: result.netAnnual, color: '#16a34a' },
                { label: 'Federal tax', value: result.federalTax, color: '#dc2626' },
                { label: 'Ontario tax', value: result.ontarioTax, color: '#ea580c' },
                { label: 'CPP/CPP2', value: result.cpp + result.cpp2, color: '#2563eb' },
                { label: 'EI', value: result.ei, color: '#7c3aed' },
              ]}
              format={format}
                          title="Annual pay breakdown"
            />
          </>
        ) : (
          <p class="text-sm text-red-600">Enter a gross annual salary greater than zero, then select Calculate.</p>
        )}
      </div>
    </div>
  );
}
