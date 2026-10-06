import { useMemo, useState } from 'preact/hooks';
import { usTaxRefundEngine } from '../../calculators/salary/engines/us/usTaxRefund';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(value);

interface Props {
  initialIncome?: number;
  initialWithholding?: number;
  initialChildren?: number;
}

export default function UsTaxRefundCalculator({
  initialIncome = 75000,
  initialWithholding = 9000,
  initialChildren = 0,
}: Props) {
  const [filingStatus, setFilingStatus] = useState<'single' | 'marriedJointly'>('single');
  const [annualIncome, setAnnualIncome] = useState(String(initialIncome));
  const [withholding, setWithholding] = useState(String(initialWithholding));
  const [qualifyingChildren, setQualifyingChildren] = useState(String(initialChildren));
  const [overtimePremium, setOvertimePremium] = useState('');
  const [tips, setTips] = useState('');

  const result = useMemo(() => {
    const validation = usTaxRefundEngine.validate({
      filingStatus,
      annualIncome: Number(annualIncome),
      withholding: Number(withholding),
      qualifyingChildren: Number(qualifyingChildren),
      overtimePremiumDeduction: overtimePremium.trim() === '' ? undefined : Number(overtimePremium),
      tipsDeduction: tips.trim() === '' ? undefined : Number(tips),
    });
    return validation.valid ? usTaxRefundEngine.calculate(validation.data) : null;
  }, [filingStatus, annualIncome, withholding, qualifyingChildren, overtimePremium, tips]);

  const inputClass = 'mt-1 w-full rounded border p-2';
  const isRefund = result !== null && result.refund > 0;
  const headlineAmount = result ? (isRefund ? result.refund : result.amountOwed) : 0;

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="us-tr-status">
          Filing status
          <select
            id="us-tr-status"
            class={inputClass}
            value={filingStatus}
            onChange={(e) =>
              setFilingStatus((e.target as HTMLSelectElement).value as 'single' | 'marriedJointly')
            }
          >
            <option value="single">Single</option>
            <option value="marriedJointly">Married filing jointly</option>
          </select>
        </label>
        <label class="block text-sm font-medium" for="us-tr-income">
          2026 gross income ($)
          <input
            id="us-tr-income"
            class={inputClass}
            type="number"
            min="1"
            step="1000"
            value={annualIncome}
            onInput={(e) => setAnnualIncome((e.target as HTMLInputElement).value)}
          />
          <span class="mt-1 block text-xs font-normal text-slate-500">
            Your total 2026 wages; used as a proxy for AGI/MAGI. Do not subtract pre-tax
            401(k) contributions here — this is a simplified estimate.
          </span>
        </label>
        <label class="block text-sm font-medium" for="us-tr-withholding">
          Federal income tax already withheld ($)
          <input
            id="us-tr-withholding"
            class={inputClass}
            type="number"
            min="0"
            step="100"
            value={withholding}
            onInput={(e) => setWithholding((e.target as HTMLInputElement).value)}
          />
          <span class="mt-1 block text-xs font-normal text-slate-500">
            What your employer has withheld so far this year (your pay stubs or last W-2).
          </span>
        </label>
        <label class="block text-sm font-medium" for="us-tr-children">
          Qualifying children under 17
          <select
            id="us-tr-children"
            class={inputClass}
            value={qualifyingChildren}
            onChange={(e) => setQualifyingChildren((e.target as HTMLSelectElement).value)}
          >
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
          <span class="mt-1 block text-xs font-normal text-slate-500">
            For the 2026 Child Tax Credit ($2,200 per child, up to $1,700 refundable).
          </span>
        </label>
        <details class="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <summary class="cursor-pointer font-medium">
            Optional: OBBBA deductions (overtime premium &amp; tips)
          </summary>
          <label class="mt-3 block text-sm font-medium" for="us-tr-overtime">
            Qualified overtime premium ($)
            <input
              id="us-tr-overtime"
              class={inputClass}
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 2000"
              value={overtimePremium}
              onInput={(e) => setOvertimePremium((e.target as HTMLInputElement).value)}
            />
            <span class="mt-1 block text-xs font-normal text-slate-500">
              The "half" in time-and-a-half, 2025–2028. Caps at $12,500 (single) / $25,000
              (joint), phases out above $150k / $300k MAGI.
            </span>
          </label>
          <label class="mt-3 block text-sm font-medium" for="us-tr-tips">
            Qualified tips received ($)
            <input
              id="us-tr-tips"
              class={inputClass}
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 3000"
              value={tips}
              onInput={(e) => setTips((e.target as HTMLInputElement).value)}
            />
            <span class="mt-1 block text-xs font-normal text-slate-500">
              Tips in traditionally tipped jobs, 2025–2028. Deductible up to $25,000, same
              phase-out as overtime.
            </span>
          </label>
        </details>
        <p class="text-xs text-slate-500">
          Income-tax only: Social Security and Medicare are excluded because they are not
          refunded on your return. State tax, EITC, and itemized deductions are not modelled
          here — this is an estimate, not tax advice.
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">
          {result ? (isRefund ? 'Estimated 2026 federal refund' : 'Estimated 2026 amount owed') : 'Result'}
        </p>
        <p class={`text-3xl font-bold ${result && isRefund ? 'text-emerald-600' : 'text-rose-600'}`}>
          {result ? formatCurrency(headlineAmount) : '—'}
        </p>
        {result && (
          <>
            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <dt>2026 standard deduction</dt>
                <dd>{formatCurrency(result.standardDeduction)}</dd>
              </div>
              {(result.overtimeDeductionApplied > 0 || result.tipsDeductionApplied > 0) && (
                <>
                  <div class="flex justify-between">
                    <dt>OBBBA overtime deduction</dt>
                    <dd>{formatCurrency(result.overtimeDeductionApplied)}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt>OBBBA tips deduction</dt>
                    <dd>{formatCurrency(result.tipsDeductionApplied)}</dd>
                  </div>
                </>
              )}
              <div class="flex justify-between">
                <dt>Estimated taxable income</dt>
                <dd>{formatCurrency(result.taxableIncome)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Federal tax before credits</dt>
                <dd>{formatCurrency(result.grossTax)}</dd>
              </div>
              {result.childTaxCredit > 0 && (
                <div class="flex justify-between">
                  <dt>Child Tax Credit (2026)</dt>
                  <dd>−{formatCurrency(result.ctcNonRefundable + result.refundableCredit)}</dd>
                </div>
              )}
              {result.refundableCredit > 0 && (
                <div class="flex justify-between">
                  <dt>Refundable portion (ACTC)</dt>
                  <dd>{formatCurrency(result.refundableCredit)}</dd>
                </div>
              )}
              <div class="flex justify-between font-medium">
                <dt>Estimated federal tax liability</dt>
                <dd>{formatCurrency(result.netTaxLiability)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Federal withholding so far</dt>
                <dd>{formatCurrency(result.withholding)}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Marginal tax rate</dt>
                <dd>{formatPercent(result.marginalRate)}</dd>
              </div>
            </dl>
            {result.obbbaPhaseOutApplied && (
              <p class="mt-3 text-xs text-amber-700">
                Your income is above the OBBBA phase-out threshold, so your overtime/tips
                deduction was reduced.
              </p>
            )}
            {result.ctcPhaseOutApplied && (
              <p class="mt-3 text-xs text-amber-700">
                Your income is above the Child Tax Credit phase-out threshold, so your credit
                was reduced.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
