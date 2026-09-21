import { useState, useMemo } from 'preact/hooks';
import { nlBruttoNettoEngine } from '../../calculators/salary/engines/nl/nlBruttoNetto';

interface Props { locale: string; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtPct = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);

export default function NlBruttoNettoCalculator({ locale }: Props) {
  // ── Inputs ──────────────────────────────────────────────────────────────
  const [grossAnnual, setGrossAnnual]           = useState('55000');
  const [age, setAge]                           = useState('');
  const [thirtyPct, setThirtyPct]               = useState(false);
  const [vakantiegeld, setVakantiegeld]         = useState(true);
  const [iack, setIack]                         = useState(false);
  const [bornBefore1946, setBornBefore1946]     = useState(false);
  const [payPeriod, setPayPeriod]               = useState<'annual'|'monthly'|'fourweekly'|'weekly'>('monthly');
  // What-if comparison
  const [whatIfGross, setWhatIfGross]           = useState('');
  const [showWhatIf, setShowWhatIf]             = useState(false);

  const input = useMemo(() => ({
    grossAnnual:        parseFloat(grossAnnual) || 0,
    age:                age ? parseInt(age, 10) : undefined,
    thirtyPercentRuling: thirtyPct,
    includeVakantiegeld: vakantiegeld,
    iackEligible:       iack,
    bornBefore1946,
    payPeriod,
  }), [grossAnnual, age, thirtyPct, vakantiegeld, iack, bornBefore1946, payPeriod]);

  const result = useMemo(() => {
    const v = nlBruttoNettoEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlBruttoNettoEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [input]);

  const whatIfResult = useMemo(() => {
    if (!whatIfGross || !showWhatIf) return null;
    const v = nlBruttoNettoEngine.validate({ ...input, grossAnnual: parseFloat(whatIfGross) || 0 });
    if (!v.valid) return null;
    return nlBruttoNettoEngine.calculate(v.data, {} as never, 2026);
  }, [whatIfGross, showWhatIf, input]);

  const d = result.data;

  const periodLabels: Record<string, string> = {
    annual: 'per jaar', monthly: 'per maand', fourweekly: 'per 4 weken', weekly: 'per week',
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div class="space-y-6">

      {/* ── Input panel ────────────────────────────────────────────── */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Uw gegevens</h2>
        <div class="grid gap-4 sm:grid-cols-2">

          {/* Gross salary */}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Bruto jaarsalaris <span class="text-slate-400 font-normal">(excl. vakantiegeld)</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="500"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={grossAnnual}
                onInput={e => setGrossAnnual((e.target as HTMLInputElement).value)}
                placeholder="bijv. 55000"
              />
            </div>
            {result.errors?.grossAnnual && <p class="mt-1 text-xs text-red-600">{result.errors.grossAnnual}</p>}
          </div>

          {/* Age */}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Leeftijd <span class="text-slate-400 font-normal">(optioneel)</span>
            </label>
            <input
              type="number" min="15" max="100"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={age}
              onInput={e => setAge((e.target as HTMLInputElement).value)}
              placeholder="bijv. 35"
            />
            {age && parseInt(age) >= 67 && (
              <p class="mt-1 text-xs text-blue-600">AOW-tarief toegepast (lagere schijf 1)</p>
            )}
          </div>

          {/* Pay period */}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Uitbetalingsperiode</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={payPeriod}
              onChange={e => setPayPeriod((e.target as HTMLSelectElement).value as typeof payPeriod)}
            >
              <option value="annual">Jaarlijks</option>
              <option value="monthly">Maandelijks</option>
              <option value="fourweekly">Per 4 weken</option>
              <option value="weekly">Wekelijks</option>
            </select>
          </div>

          {/* Toggles */}
          <div class="flex flex-col gap-2 justify-center">
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
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      {d && (
        <div class="space-y-4" role="region" aria-live="polite" aria-label="Resultaten">

          {/* Hero card */}
          <div class="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
            <p class="text-sm font-medium text-blue-200">Netto {periodLabels[payPeriod]}</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.netPerPeriod)}</p>
            <div class="mt-3 flex flex-wrap gap-4 text-sm text-blue-100">
              <span>Netto jaar: <strong class="text-white">{fmt(locale, d.netAnnual)}</strong></span>
              <span>Effectief tarief: <strong class="text-white">{fmtPct(locale, d.effectiveRate)}</strong></span>
              <span>Marginaal tarief: <strong class="text-white">{fmtPct(locale, d.marginalRate)}</strong></span>
            </div>
          </div>

          {/* Full breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Gedetailleerde berekening</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">

              {/* Gross */}
              <div class="flex justify-between px-5 py-3 text-slate-700">
                <span>Bruto jaarsalaris</span>
                <span class="font-medium">{fmt(locale, d.grossBase)}</span>
              </div>
              {d.vakantiegeld > 0 && (
                <div class="flex justify-between px-5 py-2 text-slate-500">
                  <span class="pl-4">+ Vakantiegeld (8%)</span>
                  <span>+{fmt(locale, d.vakantiegeld)}</span>
                </div>
              )}
              {d.thirtyPctAllowance > 0 && (
                <div class="flex justify-between px-5 py-2 text-green-700 bg-green-50">
                  <span class="pl-4">− 30%-regelingvergoeding (belastingvrij)</span>
                  <span>−{fmt(locale, d.thirtyPctAllowance)}</span>
                </div>
              )}
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800 bg-slate-50">
                <span>Belastbaar inkomen box 1</span>
                <span>{fmt(locale, d.taxableIncome)}</span>
              </div>

              {/* Box 1 per bracket */}
              <div class="px-5 py-3 space-y-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Belasting per schijf</p>
                {d.box1PerBracket.filter(b => b.taxOwed > 0).map(b => (
                  <div key={b.bracketLabel} class="flex justify-between text-slate-600">
                    <span class="pl-4">{b.bracketLabel} ({fmtPct(locale, b.rate)})</span>
                    <span>{fmt(locale, b.taxOwed)}</span>
                  </div>
                ))}
                <div class="flex justify-between pt-2 border-t border-slate-100 text-slate-700 font-medium">
                  <span>Belasting vóór kortingen</span>
                  <span>{fmt(locale, d.box1TaxRaw)}</span>
                </div>
              </div>
              
              {/* Social security breakdown */}
              {d.socialSecurityBreakdown && d.socialSecurityBreakdown.total > 0 && (
                <div class="px-5 py-3 space-y-1 bg-blue-50">
                  <p class="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2">Premies volksverzekeringen (in tarief inbegrepen)</p>
                  {d.socialSecurityBreakdown.aow > 0 && (
                    <div class="flex justify-between text-blue-700">
                      <span class="pl-4">AOW (pensioen) - 17,9%</span>
                      <span>{fmt(locale, d.socialSecurityBreakdown.aow)}</span>
                    </div>
                  )}
                  <div class="flex justify-between text-blue-700">
                    <span class="pl-4">WLZ (langdurige zorg) - 9,65%</span>
                    <span>{fmt(locale, d.socialSecurityBreakdown.wlz)}</span>
                  </div>
                  <div class="flex justify-between text-blue-700">
                    <span class="pl-4">ANW (nabestaanden) - 0,1%</span>
                    <span>{fmt(locale, d.socialSecurityBreakdown.anw)}</span>
                  </div>
                  <div class="flex justify-between pt-2 border-t border-blue-200 font-medium text-blue-800">
                    <span>Totaal premies</span>
                    <span>{fmt(locale, d.socialSecurityBreakdown.total)}</span>
                  </div>
                  <p class="text-xs text-blue-600 mt-2">Deze premies zitten al verwerkt in het box 1 tarief.</p>
                </div>
              )}

              {/* Credits */}
              <div class="px-5 py-3 space-y-1 bg-green-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-green-600 mb-2">Heffingskortingen</p>
                <div class="flex justify-between text-green-700">
                  <span class="pl-4">Algemene heffingskorting</span>
                  <span>−{fmt(locale, d.algemeenHeffingskorting)}</span>
                </div>
                <div class="flex justify-between text-green-700">
                  <span class="pl-4">Arbeidskorting</span>
                  <span>−{fmt(locale, d.arbeidskorting)}</span>
                </div>
                {d.iack > 0 && (
                  <div class="flex justify-between text-green-700">
                    <span class="pl-4">Inkomensaff. combinatiekorting</span>
                    <span>−{fmt(locale, d.iack)}</span>
                  </div>
                )}
                {d.ouderenkorting > 0 && (
                  <div class="flex justify-between text-green-700">
                    <span class="pl-4">Ouderenkorting</span>
                    <span>−{fmt(locale, d.ouderenkorting)}</span>
                  </div>
                )}
                <div class="flex justify-between pt-2 border-t border-green-200 font-medium text-green-800">
                  <span>Totale kortingen</span>
                  <span>−{fmt(locale, d.totalCredits)}</span>
                </div>
              </div>

              {/* Net tax */}
              <div class="flex justify-between px-5 py-3 text-red-700 font-medium">
                <span>Verschuldigde inkomstenbelasting</span>
                <span>−{fmt(locale, d.incomeTaxAnnual)}</span>
              </div>

              {/* Net */}
              <div class="flex justify-between px-5 py-4 bg-blue-50 text-blue-800 font-bold text-base">
                <span>Netto jaarsalaris</span>
                <span>{fmt(locale, d.netAnnual)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 text-slate-700 font-medium">
                <span>Netto {periodLabels[payPeriod]}</span>
                <span>{fmt(locale, d.netPerPeriod)}</span>
              </div>
            </div>
          </div>

          {/* What-if comparison */}
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
        </div>
      )}

      {/* Disclaimer */}
      <p class="text-xs text-slate-400">
        Schatting op basis van box 1 loonheffing 2026. Werkgevers­premies, pensioen, en aftrekposten zijn niet meegenomen.
        Raadpleeg de Belastingdienst of een adviseur voor uw exacte situatie.
      </p>
    </div>
  );
}
