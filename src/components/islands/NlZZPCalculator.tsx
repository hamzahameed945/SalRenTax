import { useState, useMemo } from 'preact/hooks';
import { nlZZPEngine } from '../../calculators/salary/engines/nl/nlZZP';

interface Props { locale: string; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtPct = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);

type InputMode = 'revenue' | 'hourly';

export default function NlZZPCalculator({ locale }: Props) {
  const [inputMode, setInputMode]               = useState<InputMode>('revenue');
  const [annualRevenue, setAnnualRevenue]       = useState('80000');
  const [hourlyRate, setHourlyRate]             = useState('75');
  const [billableHours, setBillableHours]       = useState('1200');
  const [businessCosts, setBusinessCosts]       = useState('5000');
  const [isStarter, setIsStarter]               = useState(false);
  const [includeVakantiegeld, setIncludeVak]    = useState(true);

  const result = useMemo(() => {
    const revenue = inputMode === 'revenue'
      ? parseFloat(annualRevenue) || 0
      : 0; // engine resolves from hourlyRate × billableHours when 0

    const input = {
      annualRevenue:            revenue,
      hourlyRate:               inputMode === 'hourly' ? parseFloat(hourlyRate) || 0 : undefined,
      billableHours:            inputMode === 'hourly' ? parseInt(billableHours, 10) || 0 : undefined,
      businessCosts:            parseFloat(businessCosts) || 0,
      isStarter,
      includeVakantiegeldReserve: includeVakantiegeld,
    };
    const v = nlZZPEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlZZPEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [inputMode, annualRevenue, hourlyRate, billableHours, businessCosts, isStarter, includeVakantiegeld]);

  const d = result.data;

  return (
    <div class="space-y-6">
      {/* Mode switch */}
      <div class="flex gap-2">
        <button
          onClick={() => setInputMode('revenue')}
          class={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${inputMode === 'revenue' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
        >
          Jaaromzet invoeren
        </button>
        <button
          onClick={() => setInputMode('hourly')}
          class={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${inputMode === 'hourly' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
        >
          Uurtarief × uren
        </button>
      </div>

      {/* Inputs */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Uw ZZP-gegevens</h2>
        <div class="grid gap-4 sm:grid-cols-2">

          {inputMode === 'revenue' ? (
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Jaaromzet (excl. BTW)</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                <input
                  type="number" min="0" step="1000"
                  class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={annualRevenue}
                  onInput={e => setAnnualRevenue((e.target as HTMLInputElement).value)}
                  placeholder="bijv. 80000"
                />
              </div>
              {result.errors?.annualRevenue && <p class="mt-1 text-xs text-red-600">Voer een geldige omzet in</p>}
            </div>
          ) : (
            <>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Uurtarief (excl. BTW)</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                  <input
                    type="number" min="0" step="5"
                    class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={hourlyRate}
                    onInput={e => setHourlyRate((e.target as HTMLInputElement).value)}
                    placeholder="bijv. 75"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Declarabele uren per jaar</label>
                <input
                  type="number" min="0" step="50"
                  class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={billableHours}
                  onInput={e => setBillableHours((e.target as HTMLInputElement).value)}
                  placeholder="bijv. 1200"
                />
                <p class="mt-1 text-xs text-slate-400">Typisch 1.000–1.400 uur/jaar (50–70% van beschikbare tijd)</p>
              </div>
            </>
          )}

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Zakelijke kosten</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="500"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={businessCosts}
                onInput={e => setBusinessCosts((e.target as HTMLInputElement).value)}
                placeholder="bijv. 5000"
              />
            </div>
          </div>

          <div class="flex flex-col gap-2 justify-center">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox" checked={isStarter}
                onChange={e => setIsStarter((e.target as HTMLInputElement).checked)}
                class="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span class="text-sm text-slate-700">Startersaftrek (eerste 3 jaar)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox" checked={includeVakantiegeld}
                onChange={e => setIncludeVak((e.target as HTMLInputElement).checked)}
                class="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span class="text-sm text-slate-700">Vakantiegeld reservering (8%)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {d && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div class="rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 p-6 text-white">
            <p class="text-sm font-medium text-violet-200">Netto per maand</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.netMonthly)}</p>
            <div class="mt-3 flex flex-wrap gap-4 text-sm text-violet-100">
              <span>Netto jaar: <strong class="text-white">{fmt(locale, d.netAnnual)}</strong></span>
              <span>Effectief tarief: <strong class="text-white">{fmtPct(locale, d.effectiveRate)}</strong></span>
              {d.impliedHourlyRate && (
                <span>Uurtarief: <strong class="text-white">€{d.impliedHourlyRate.toFixed(0)}/uur</strong></span>
              )}
            </div>
          </div>

          {/* Profit breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Van omzet naar belastbare winst</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">
              <div class="flex justify-between px-5 py-3 text-slate-700">
                <span>Jaaromzet (excl. BTW)</span>
                <span class="font-medium">{fmt(locale, d.annualRevenue)}</span>
              </div>
              <div class="flex justify-between px-5 py-2 text-slate-500">
                <span class="pl-4">− Zakelijke kosten</span>
                <span>−{fmt(locale, d.businessCosts)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800 bg-slate-50">
                <span>Brutowinst</span>
                <span>{fmt(locale, d.grossProfit)}</span>
              </div>
              <div class="flex justify-between px-5 py-2 text-green-700 bg-green-50">
                <span class="pl-4">− Zelfstandigenaftrek</span>
                <span>−{fmt(locale, d.zelfstandigenaftrek)}</span>
              </div>
              {d.startersaftrek > 0 && (
                <div class="flex justify-between px-5 py-2 text-green-700 bg-green-50">
                  <span class="pl-4">− Startersaftrek</span>
                  <span>−{fmt(locale, d.startersaftrek)}</span>
                </div>
              )}
              <div class="flex justify-between px-5 py-2 text-green-700 bg-green-50">
                <span class="pl-4">− MKB-winstvrijstelling (13,31%)</span>
                <span>−{fmt(locale, d.mkbWinstvrijstelling)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 font-semibold text-slate-800">
                <span>Belastbare winst</span>
                <span>{fmt(locale, d.taxableProfit)}</span>
              </div>
            </div>
          </div>

          {/* Tax breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Belasting & kortingen</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">
              <div class="flex justify-between px-5 py-3 text-slate-700">
                <span>Box 1 belasting (voor kortingen)</span>
                <span>{fmt(locale, d.box1TaxRaw)}</span>
              </div>
              <div class="flex justify-between px-5 py-2 text-green-700 bg-green-50">
                <span class="pl-4">− Algemene heffingskorting</span>
                <span>−{fmt(locale, d.algemeenHeffingskorting)}</span>
              </div>
              <div class="flex justify-between px-5 py-2 text-green-700 bg-green-50">
                <span class="pl-4">− Arbeidskorting</span>
                <span>−{fmt(locale, d.arbeidskorting)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 font-semibold text-red-700">
                <span>Inkomstenbelasting verschuldigd</span>
                <span>−{fmt(locale, d.incomeTax)}</span>
              </div>
              {d.vakantiegeldReserve > 0 && (
                <div class="flex justify-between px-5 py-2 text-slate-500">
                  <span class="pl-4">− Vakantiegeld reservering (8%)</span>
                  <span>−{fmt(locale, d.vakantiegeldReserve)}</span>
                </div>
              )}
              <div class="flex justify-between px-5 py-4 bg-violet-50 font-bold text-violet-800 text-base">
                <span>Netto per jaar</span>
                <span>{fmt(locale, d.netAnnual)}</span>
              </div>
            </div>
          </div>

          {/* Informational reserves */}
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">
            <h3 class="font-semibold text-amber-800 mb-3">Aanbevolen reserveringen (indicatief)</h3>
            <div class="space-y-2 text-amber-700">
              <div class="flex justify-between">
                <span>BTW-afdracht (21% over omzet)</span>
                <span class="font-medium">{fmt(locale, d.vatObligationInfo)}</span>
              </div>
              <div class="flex justify-between">
                <span>Pensioenreservering (~10% brutowinst)</span>
                <span class="font-medium">{fmt(locale, d.pensionReserveInfo)}</span>
              </div>
            </div>
            <p class="mt-3 text-xs text-amber-600">
              BTW-bedrag is indicatief — werkelijke afdracht hangt af van uw BTW-aangifte en aftrekbare voorbelasting.
            </p>
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Berekening op basis van box 1 loonheffing 2026, zelfstandigenaftrek €2.470, MKB-winstvrijstelling 13,31%.
        Geen rekening gehouden met FOR (fiscale oudedagsreserve is afgeschaft per 2023), kleinschaligheidsinvesteringsaftrek,
        of andere specifieke aftrekposten. Raadpleeg een boekhouder voor uw persoonlijke situatie.
      </p>
    </div>
  );
}
