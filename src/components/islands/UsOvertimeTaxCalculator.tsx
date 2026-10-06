import { useMemo, useState } from 'preact/hooks';
import {
  usOvertimeTaxEngine,
  FEDERAL_BRACKET_OPTIONS_2026,
} from '../../calculators/salary/engines/us/usOvertimeTax';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(value);

interface Props {
  initialHourlyRate?: number;
  initialOvertimeHours?: number;
  initialSalary?: number;
}

export default function UsOvertimeTaxCalculator({
  initialHourlyRate = 25,
  initialOvertimeHours = 200,
  initialSalary = 60000,
}: Props) {
  const [hourlyRate, setHourlyRate] = useState(String(initialHourlyRate));
  const [overtimeHours, setOvertimeHours] = useState(String(initialOvertimeHours));
  const [filingStatus, setFilingStatus] = useState<'single' | 'marriedJointly'>('single');
  const [useBracket, setUseBracket] = useState(false);
  const [annualSalary, setAnnualSalary] = useState(String(initialSalary));
  const [taxBracket, setTaxBracket] = useState('0.22');

  const result = useMemo(() => {
    const validation = usOvertimeTaxEngine.validate({
      hourlyRate: Number(hourlyRate),
      overtimeHours: Number(overtimeHours),
      filingStatus,
      annualSalary: useBracket ? undefined : Number(annualSalary),
      taxBracket: useBracket ? Number(taxBracket) : undefined,
    });
    return validation.valid ? usOvertimeTaxEngine.calculate(validation.data) : null;
  }, [hourlyRate, overtimeHours, filingStatus, useBracket, annualSalary, taxBracket]);

  const inputClass = 'mt-1 w-full rounded border p-2';

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="us-ot-rate">
          Regular hourly rate ($)
          <input
            id="us-ot-rate"
            class={inputClass}
            type="number"
            min="1"
            step="0.5"
            value={hourlyRate}
            onInput={(e) => setHourlyRate((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-ot-hours">
          Overtime hours in 2026
          <input
            id="us-ot-hours"
            class={inputClass}
            type="number"
            min="0"
            step="1"
            value={overtimeHours}
            onInput={(e) => setOvertimeHours((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="us-ot-status">
          Filing status
          <select
            id="us-ot-status"
            class={inputClass}
            value={filingStatus}
            onChange={(e) => setFilingStatus((e.target as HTMLSelectElement).value as 'single' | 'marriedJointly')}
          >
            <option value="single">Single</option>
            <option value="marriedJointly">Married filing jointly</option>
          </select>
        </label>
        <fieldset class="block text-sm font-medium">
          <legend>How to work out your tax bracket</legend>
          <label class="mt-1 flex items-center gap-2 font-normal">
            <input
              type="radio"
              name="us-ot-mode"
              checked={!useBracket}
              onChange={() => setUseBracket(false)}
            />
            Estimate it from my salary
          </label>
          <label class="mt-1 flex items-center gap-2 font-normal">
            <input
              type="radio"
              name="us-ot-mode"
              checked={useBracket}
              onChange={() => setUseBracket(true)}
            />
            I know my marginal bracket
          </label>
        </fieldset>
        {!useBracket ? (
          <label class="block text-sm font-medium" for="us-ot-salary">
            Estimated total 2026 wages ($), overtime included
            <input
              id="us-ot-salary"
              class={inputClass}
              type="number"
              min="1"
              step="1000"
              value={annualSalary}
              onInput={(e) => setAnnualSalary((e.target as HTMLInputElement).value)}
            />
          </label>
        ) : (
          <label class="block text-sm font-medium" for="us-ot-bracket">
            Your 2026 federal marginal tax bracket
            <select
              id="us-ot-bracket"
              class={inputClass}
              value={taxBracket}
              onChange={(e) => setTaxBracket((e.target as HTMLSelectElement).value)}
            >
              {FEDERAL_BRACKET_OPTIONS_2026.map((b) => (
                <option key={b} value={b}>
                  {formatPercent(b)}
                </option>
              ))}
            </select>
          </label>
        )}
        <p class="text-xs text-slate-500">
          Overtime is taxed at the <strong>same marginal rate</strong> as your regular pay — not a
          higher one. The OBBBA deduction estimate assumes your overtime is FLSA-mandated
          (non-exempt, over 40 hours a week).
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Overtime gross pay (2026)</p>
        <p class="text-3xl font-bold text-accent">
          {result ? formatCurrency(result.overtimeGross) : '—'}
        </p>
        {result && (
          <>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <dt>Straight-time component (rate × hours)</dt>
                <dd>{formatCurrency(result.baseComponent)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Premium component ("the half" × hours)</dt>
                <dd>{formatCurrency(result.premiumComponent)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>
                  Federal income tax on overtime
                  <span class="block text-xs text-slate-500">
                    at your {result.bracketDerived ? 'estimated' : 'chosen'} marginal rate of{' '}
                    {formatPercent(result.marginalRate)} — the same rate as regular pay
                  </span>
                </dt>
                <dd>{formatCurrency(result.taxOnOvertime)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>
                  Social Security + Medicare (FICA)
                  <span class="block text-xs text-slate-500">
                    OBBBA does not cover payroll tax
                  </span>
                </dt>
                <dd>{formatCurrency(result.ficaOnOvertime)}</dd>
              </div>
              <div class="flex justify-between font-semibold">
                <dt>Overtime pay after tax &amp; FICA</dt>
                <dd>{formatCurrency(result.netAfterTax)}</dd>
              </div>
              <hr class="border-slate-200" />
              <div class="flex justify-between">
                <dt>
                  OBBBA "no tax on overtime" deduction
                  <span class="block text-xs text-slate-500">
                    premium only{result.phaseOutApplied ? ', reduced by income phase-out' : ''}
                  </span>
                </dt>
                <dd>{formatCurrency(result.deductiblePremium)}</dd>
              </div>
              <div class="flex justify-between font-semibold text-emerald-700">
                <dt>
                  Estimated tax savings
                  <span class="block text-xs text-slate-500 font-normal">
                    arrives as a larger refund or smaller bill at filing time — not in your paycheck
                  </span>
                </dt>
                <dd>{formatCurrency(result.taxSavings)}</dd>
              </div>
              <div class="flex justify-between font-semibold">
                <dt>Effective overtime take-home (incl. savings)</dt>
                <dd>{formatCurrency(result.effectiveNet)}</dd>
              </div>
            </dl>
            <p class="mt-4 text-xs text-slate-500">
              Estimate only. The OBBBA deduction covers the premium portion of FLSA-mandated
              overtime for tax years 2025–2028, capped at $12,500 (single) or $25,000 (joint),
              phasing out above $150,000 / $300,000 MAGI. Your pay stub is definitive.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
