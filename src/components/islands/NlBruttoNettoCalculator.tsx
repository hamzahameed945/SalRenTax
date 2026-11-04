import { useState, useMemo } from 'preact/hooks';
import { nlBruttoNettoEngine } from '../../calculators/salary/engines/nl/nlBruttoNetto';
import PayBreakdownChart from './PayBreakdownChart';

interface Props { locale: string; initialSalary?: number; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
const fmtPct = (locale: string, v: number) => `${(v * 100).toFixed(1)}%`;

type PayPeriod = 'monthly' | 'annual' | 'weekly' | 'fourWeekly';
const periodLabels: Record<PayPeriod, string> = {
  monthly: 'per maand',
  annual: 'per jaar',
  weekly: 'per week',
  fourWeekly: 'per 4 weken',
};

function Row({ label, value, locale, highlight }: { label: string; value: number; locale: string; highlight?: boolean }) {
  return (
    <div class={`flex justify-between px-5 py-2 ${highlight ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>{fmt(locale, value)}</span>
    </div>
  );
}

export default function NlBruttoNettoCalculator(props: Props) {
  const { locale } = props;
  const [grossAnnual, setGrossAnnual] = useState('55000');
  const [age, setAge] = useState('');
  const [thirtyPct, setThirtyPct] = useState(false);
  const [vakantiegeld, setVakantiegeld] = useState(true);
  const [iack, setIack] = useState(false);
  const [bornBefore1946, setBornBefore1946] = useState(false);
  const [payPeriod, setPayPeriod] = useState<PayPeriod>('monthly');
  const [whatIfGross, setWhatIfGross] = useState('');
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [submitted, setSubmitted] = useState({ grossAnnual: '55000', age: '', thirtyPct: false, vakantiegeld: true, iack: false, bornBefore1946: false, payPeriod: 'monthly' as PayPeriod });
  const input = useMemo(() => ({
    grossAnnual: parseFloat(submitted.grossAnnual) || 0,
    age: submitted.age ? parseInt(submitted.age, 10) : undefined,
    thirtyPct: submitted.thirtyPct,
    vakantiegeld: submitted.vakantiegeld,
    iack: submitted.iack,
    bornBefore1946: submitted.bornBefore1946,
    payPeriod: submitted.payPeriod,
  }), [submitted]);
  const result = useMemo(() => {
    const v = nlBruttoNettoEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlBruttoNettoEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [input]);
  const d = result.data;
  const whatIfResult = useMemo(() => {
    const g = parseFloat(whatIfGross);
    if (!d || !g || g <= 0) return null;
    const v = nlBruttoNettoEngine.validate({ ...input, grossAnnual: g });
    if (!v.valid) return null;
    return nlBruttoNettoEngine.calculate(v.data, {} as never, 2026);
  }, [d, input, whatIfGross]);
  return (
    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Jouw gegevens</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Bruto jaarsalaris <span class="text-slate-400 font-normal">(€)</span></label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="1000"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={grossAnnual}
                onInput={e => setGrossAnnual((e.target as HTMLInputElement).value)}
                placeholder="bijv. 55000"
              />
            </div>
            {result.errors?.grossAnnual && <p class="mt-1 text-xs text-red-600">Vul een geldig bedrag in</p>}
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Leeftijd <span class="text-slate-400 font-normal">(optioneel)</span></label>
            <input
              type="number" min="0" max="120"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              value={age}
              onInput={e => setAge((e.target as HTMLInputElement).value)}
              placeholder="bijv. 35"
            />
            {result.errors?.age && <p class="mt-1 text-xs text-red-600">Vul een geldige leeftijd in</p>}
          </div>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={vakantiegeld}
              onChange={e => setVakantiegeld((e.target as HTMLInputElement).checked)}
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-slate-700">Inclusief vakantiegeld (8%)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={thirtyPct}
              onChange={e => setThirtyPct((e.target as HTMLInputElement).checked)}
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-slate-700">30%-regeling (expat)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={iack}
              onChange={e => setIack((e.target as HTMLInputElement).checked)}
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-slate-700">Combinatiekorting (IACK)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={bornBefore1946}
              onChange={e => setBornBefore1946((e.target as HTMLInputElement).checked)}
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-slate-700">Geboren vóór 1946</span>
          </label>
        </div>
        <div class="mt-4 max-w-xs">
          <label class="block text-sm font-medium text-slate-700 mb-1">Uitbetalingsperiode</label>
          <select
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            value={payPeriod}
            onChange={e => setPayPeriod((e.target as HTMLSelectElement).value as PayPeriod)}
          >
            <option value="monthly">Maandelijks</option>
            <option value="annual">Jaarlijks</option>
            <option value="weekly">Wekelijks</option>
            <option value="fourWeekly">Per 4 weken</option>
          </select>
        </div>
        {age && parseInt(age) >= 67 && <p class="mt-3 text-xs text-slate-500">AOW-tarief toegepast: voor AOW-gerechtigden gelden lagere tarieven in schijf 1 en een aangepaste algemene heffingskorting.</p>}
        <div class="mt-4 flex gap-3">
          <button type="button" class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark" onClick={() => setSubmitted({ grossAnnual, age, thirtyPct, vakantiegeld, iack, bornBefore1946, payPeriod })}>Bereken</button>
          <button type="button" class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { const reset = { grossAnnual: '55000', age: '', thirtyPct: false, vakantiegeld: true, iack: false, bornBefore1946: false, payPeriod: 'monthly' as PayPeriod }; setGrossAnnual(reset.grossAnnual); setAge(reset.age); setThirtyPct(reset.thirtyPct); setVakantiegeld(reset.vakantiegeld); setIack(reset.iack); setBornBefore1946(reset.bornBefore1946); setPayPeriod(reset.payPeriod); setWhatIfGross(''); setShowWhatIf(false); setSubmitted(reset); }}>Opnieuw instellen</button>
        </div>
      </div>
      {d && (
        <div class="space-y-4" role="region" aria-live="polite" aria-label="Resultaten">
          <div class="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
            <p class="text-sm font-medium text-blue-200">Netto {periodLabels[submitted.payPeriod]}</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.netPerPeriod)}</p>
            <div class="mt-3 flex flex-wrap gap-5 text-sm text-blue-100">
              <span>Netto jaar: <strong class="text-white">{fmt(locale, d.netAnnual)}</strong></span>
              <span>Effectief tarief: <strong class="text-white">{fmtPct(locale, d.effectiveRate)}</strong></span>
              <span>Marginaal tarief: <strong class="text-white">{fmtPct(locale, d.marginalRate)}</strong></span>
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Gedetailleerde berekening</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">
              <div class="flex justify-between px-5 py-3 text-slate-700">
                <span>Bruto jaarsalaris</span>
                <span class="font-medium">{fmt(locale, d.grossBase)}</span>
              </div>
              {d.vakantiegeld > 0 && (
                <div class="flex justify-between px-5 py-2 text-slate-500">
                  <span class="pl-4">+ Vakantiegeld (8%)</span>
                  <span>{fmt(locale, d.vakantiegeld)}</span>
                </div>
              )}
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800 border-t border-slate-200">
                <span>Bruto totaal</span>
                <span>{fmt(locale, d.grossTotal)}</span>
              </div>
              {d.thirtyPctAllowance > 0 && (
                <div class="flex justify-between px-5 py-2 text-slate-500">
                  <span class="pl-4">− 30%-regeling (belastingvrij deel)</span>
                  <span>{fmt(locale, d.thirtyPctAllowance)}</span>
                </div>
              )}
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800">
                <span>Belastbaar inkomen</span>
                <span>{fmt(locale, d.taxableIncome)}</span>
              </div>
              <div class="flex justify-between px-5 py-2 text-slate-600">
                <span class="pl-4">Belasting schijf 1 (35,82%)</span>
                <span>{fmt(locale, d.taxBand1)}</span>
              </div>
              {d.taxBand2 > 0 && (
                <div class="flex justify-between px-5 py-2 text-slate-600">
                  <span class="pl-4">Belasting schijf 2 (37,48%)</span>
                  <span>{fmt(locale, d.taxBand2)}</span>
                </div>
              )}
              {d.taxBand3 > 0 && (
                <div class="flex justify-between px-5 py-2 text-slate-600">
                  <span class="pl-4">Belasting schijf 3 (49,50%)</span>
                  <span>{fmt(locale, d.taxBand3)}</span>
                </div>
              )}
              <div class="flex justify-between px-5 py-2 text-slate-600">
                <span class="pl-4">Bruto belasting</span>
                <span>{fmt(locale, d.grossTax)}</span>
              </div>
              <div class="flex justify-between px-5 py-2 text-green-700">
                <span class="pl-4">− Algemene heffingskorting</span>
                <span>−{fmt(locale, d.generalCredit)}</span>
              </div>
              <div class="flex justify-between px-5 py-2 text-green-700">
                <span class="pl-4">− Arbeidskorting</span>
                <span>−{fmt(locale, d.labourCredit)}</span>
              </div>
              {d.iackCredit > 0 && (
                <div class="flex justify-between px-5 py-2 text-green-700">
                  <span class="pl-4">− Combinatiekorting</span>
                  <span>−{fmt(locale, d.iackCredit)}</span>
                </div>
              )}
              <div class="flex justify-between px-5 py-2 text-green-700">
                <span class="pl-4">Totaal heffingskortingen</span>
                <span>−{fmt(locale, d.totalCredits)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 text-red-700 font-medium">
                <span>Verschuldigde inkomstenbelasting</span>
                <span>−{fmt(locale, d.incomeTaxAnnual)}</span>
              </div>
              <div class="flex justify-between px-5 py-4 bg-blue-50 text-blue-800 font-bold text-base">
                <span>Netto jaarsalaris</span>
                <span>{fmt(locale, d.netAnnual)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 text-slate-700 font-medium">
                <span>Netto {periodLabels[submitted.payPeriod]}</span>
                <span>{fmt(locale, d.netPerPeriod)}</span>
              </div>
            </div>
          </div>
          <PayBreakdownChart title="Verdeling van het bruto salaris" format={(v) => fmt(locale, v)} segments={[
            { label: 'Netto jaarsalaris', value: d.netAnnual, color: '#0f766e' },
            { label: 'Verschuldigde inkomstenbelasting', value: d.incomeTaxAnnual, color: '#dc2626' },
          ]} />
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-amber-800">Wat als… salarisverhoging simulatie</h3>
              <button
                onClick={() => setShowWhatIf(v => !v)}
                class="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
              >
                {showWhatIf ? 'Verberg' : 'Vergelijk'}
              </button>
            </div>
            {showWhatIf && (
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-amber-800 mb-1">Nieuw bruto jaarsalaris</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-3 flex items-center text-amber-500 text-sm">€</span>
                    <input
                      type="number" min="0" step="500"
                      class="w-full rounded-md border border-amber-300 bg-white pl-7 pr-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      value={whatIfGross}
                      onInput={e => setWhatIfGross((e.target as HTMLInputElement).value)}
                      placeholder="bijv. 65000"
                    />
                  </div>
                </div>
                {whatIfResult && (
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="rounded-lg bg-white border border-amber-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Huidig netto/maand</p>
                      <p class="text-lg font-bold text-slate-800">{fmt(locale, d.netMonthly)}</p>
                    </div>
                    <div class="rounded-lg bg-white border border-amber-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Nieuw netto/maand</p>
                      <p class="text-lg font-bold text-green-700">{fmt(locale, whatIfResult.netMonthly)}</p>
                    </div>
                    <div class="col-span-2 rounded-lg bg-white border border-amber-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Netto verbetering per maand</p>
                      <p class={`text-xl font-bold ${whatIfResult.netMonthly > d.netMonthly ? 'text-green-600' : 'text-red-600'}`}>
                        {whatIfResult.netMonthly > d.netMonthly ? '+' : ''}{fmt(locale, whatIfResult.netMonthly - d.netMonthly)}
                        <span class="text-sm font-normal text-slate-500 ml-2">
                          (eff. tarief: {fmtPct(locale, whatIfResult.effectiveRate)})
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <p class="text-xs text-slate-400">
            Schatting op basis van box 1 loonheffing 2026. Werkgeverspremies, pensioen, en aftrekposten zijn niet inbegrepen. Raadpleeg de Belastingdienst of een adviseur voor uw exacte situatie.
          </p>
        </div>
      )}
    </div>
  );
}
