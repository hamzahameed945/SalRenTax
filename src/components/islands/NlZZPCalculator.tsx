import { useState, useMemo } from 'preact/hooks';
import { nlZZPEngine } from '../../calculators/salary/engines/nl/nlZZP';
import { nlZZPData2026, nlZvwData2026 } from '../../data/salary/nl/nlTaxData2026';
import PayBreakdownChart from './PayBreakdownChart';

interface Props { locale: string; }

const mkbPct = `${(nlZZPData2026.mkbWinstvrijstelling * 100).toLocaleString('nl-NL', { maximumFractionDigits: 2 })}%`;
const zvwPct = `${(nlZvwData2026.ondernemersPercentage * 100).toLocaleString('nl-NL', { maximumFractionDigits: 2 })}%`;

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtPct = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);

type InputMode = 'revenue' | 'hourly';

export default function NlZZPCalculator({ locale }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>('revenue');
  const [annualRevenue, setAnnualRevenue] = useState('80000');
  const [hourlyRate, setHourlyRate] = useState('75');
  const [billableHours, setBillableHours] = useState('1200');
  const [businessCosts, setBusinessCosts] = useState('5000');
  const [isStarter, setIsStarter] = useState(false);
  const [includeVakantiegeld, setIncludeVak] = useState(true);
  const [submitted, setSubmitted] = useState({ inputMode: 'revenue' as InputMode, annualRevenue: '80000', hourlyRate: '75', billableHours: '1200', businessCosts: '5000', isStarter: false, includeVakantiegeld: true });

  const result = useMemo(() => {
    const revenue = submitted.inputMode === 'revenue'
      ? parseFloat(submitted.annualRevenue) || 0
      : 0; // engine resolves from hourlyRate × billableHours when 0
    const input = {
      annualRevenue:            revenue,
      hourlyRate:               submitted.inputMode === 'hourly' ? parseFloat(submitted.hourlyRate) || 0 : undefined,
      billableHours:            submitted.inputMode === 'hourly' ? parseInt(submitted.billableHours, 10) || 0 : undefined,
      businessCosts: parseFloat(submitted.businessCosts) || 0,
      isStarter: submitted.isStarter,
      includeVakantiegeldReserve: submitted.includeVakantiegeld,
    };
    const v = nlZZPEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlZZPEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [submitted]);

  const d = result.data;

  const handleCalculate = () => setSubmitted({ inputMode, annualRevenue, hourlyRate, billableHours, businessCosts, isStarter, includeVakantiegeld });
  const handleReset = () => {
    setInputMode('revenue');
    setAnnualRevenue('80000');
    setHourlyRate('75');
    setBillableHours('1200');
    setBusinessCosts('5000');
    setIsStarter(false);
    setIncludeVak(true);
    setSubmitted({ inputMode: 'revenue', annualRevenue: '80000', hourlyRate: '75', billableHours: '1200', businessCosts: '5000', isStarter: false, includeVakantiegeld: true });
  };

  return (
    <div class="space-y-6">
      {/* Mode switch */}
      <div class="flex gap-2">
        <button
          onClick={() => setInputMode('revenue')}
          class={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${inputMode === 'revenue' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Jaaromzet invoeren
        </button>
        <button
          onClick={() => setInputMode('hourly')}
          class={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${inputMode === 'hourly' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Uurtarief × uren
        </button>
      </div>

      {/* Inputs */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Uw gegevens</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inputMode === 'revenue' ? (
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Jaaromzet (excl. btw)</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                <input
                  type="number" min="0" step="1000"
                  class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={annualRevenue}
                  onInput={e => setAnnualRevenue((e.target as HTMLInputElement).value)}
                  placeholder="80000"
                />
              </div>
              {result.errors?.annualRevenue && <p class="mt-1 text-xs text-red-600">Ongeldig bedrag</p>}
            </div>
          ) : (
            <>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Uurtarief (excl. btw)</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                  <input
                    type="number" min="0" step="1"
                    class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={hourlyRate}
                    onInput={e => setHourlyRate((e.target as HTMLInputElement).value)}
                    placeholder="75"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Declareerbare uren per jaar</label>
                <input
                  type="number" min="0" step="10"
                  class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={billableHours}
                  onInput={e => setBillableHours((e.target as HTMLInputElement).value)}
                  placeholder="1200"
                />
              </div>
            </>
          )}
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Zakelijke kosten per jaar</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="500"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={businessCosts}
                onInput={e => setBusinessCosts((e.target as HTMLInputElement).value)}
                placeholder="5000"
              />
            </div>
          </div>
        </div>

        <div class="mt-4 space-y-2">
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isStarter} onChange={e => setIsStarter((e.target as HTMLInputElement).checked)} />
            Startersaftrek (eerste 3 jaar als ondernemer)
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={includeVakantiegeld} onChange={e => setIncludeVak((e.target as HTMLInputElement).checked)} />
            Reserveer 8% vakantiegeld uit brutowinst
          </label>
        </div>

        <div class="mt-6 flex gap-3">
          <button type="button" class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark" onClick={handleCalculate}>Bereken</button>
          <button type="button" class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" onClick={handleReset}>Opnieuw instellen</button>
        </div>
      </div>

      {d && (
        <div role="region" aria-live="polite">
          <div class="rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white mb-4">
            <p class="text-sm font-medium text-violet-200">Netto jaarinkomen</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.netAnnual)}</p>
            <p class="mt-2 text-sm text-violet-100">
              {fmt(locale, d.netMonthly)} per maand · {fmt(locale, d.effectiveHourlyRate)} per declareerbaar uur
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
              <h3 class="font-semibold text-slate-700">Berekening</h3>
              <div class="space-y-2 divide-y divide-slate-100">
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Jaaromzet</span>
                  <span>{fmt(locale, d.annualRevenue)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Zakelijke kosten</span>
                  <span>−{fmt(locale, d.businessCosts)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Brutowinst</span>
                  <span>{fmt(locale, d.grossProfit)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Zelfstandigenaftrek</span>
                  <span>−{fmt(locale, d.zelfstandigenaftrek)}</span>
                </div>
                {d.startersaftrek > 0 && (
                  <div class="flex justify-between pt-2 text-slate-600">
                    <span>Startersaftrek</span>
                    <span>−{fmt(locale, d.startersaftrek)}</span>
                  </div>
                )}
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>MKB-winstvrijstelling ({mkbPct})</span>
                  <span>−{fmt(locale, d.mkbWinstvrijstelling)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Belastbaar inkomen</span>
                  <span>{fmt(locale, d.taxableIncome)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Inkomstenbelasting</span>
                  <span>−{fmt(locale, d.incomeTax)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Zvw-bijdrage ({zvwPct})</span>
                  <span>{fmt(locale, d.zvwContribution)}</span>
                </div>
                {d.vakantiegeldReserve > 0 && (
                  <div class="flex justify-between pt-2 text-slate-600">
                    <span>Vakantiegeldreservering (8%)</span>
                    <span>−{fmt(locale, d.vakantiegeldReserve)}</span>
                  </div>
                )}
                <div class="flex justify-between pt-2 text-slate-700 font-semibold">
                  <span>Netto jaarinkomen</span>
                  <span>{fmt(locale, d.netAnnual)}</span>
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="rounded-xl border border-slate-200 bg-white p-5 text-sm">
                <h3 className="font-semibold text-slate-700">Besteedbaar</h3>
                <div className="mt-2 space-y-2 divide-y divide-slate-100">
                  <div className="flex justify-between pt-2 text-slate-600">
                    <span>Netto per maand</span>
                    <span>{fmt(locale, d.netMonthly)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-slate-600">
                    <span>Netto per week</span>
                    <span>{fmt(locale, d.netWeekly)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-slate-600">
                    <span>Effectief uurtarief (netto)</span>
                    <span>{fmt(locale, d.effectiveHourlyRate)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-slate-600">
                    <span>Effectieve belastingdruk</span>
                    <span>{fmtPct(locale, d.effectiveTaxRate)}</span>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">
                <h3 class="font-semibold text-amber-800">Let op</h3>
                <p className="mt-2 text-amber-900">
                  Dit is een vereenvoudigde berekening. De Zvw-bijdrage wordt getoond als informatie en is
                  niet afgetrokken van het netto inkomen. Daarnaast moet u rekening houden met
                  pensioenopbouw, arbeidsongeschiktheidsverzekering en btw-aangifte.
                </p>
              </div>
            </div>
          </div>

          <PayBreakdownChart title="Verdeling brutowinst" format={(v) => fmt(locale, v)} segments={[
            { label: 'Netto jaarinkomen', value: d.netAnnual, color: '#7c3aed' },
            { label: 'Inkomstenbelasting', value: d.incomeTax, color: '#ef4444' },
            { label: 'Vakantiegeldreservering', value: d.vakantiegeldReserve, color: '#f59e0b' },
          ]} />
        </div>
      )}

      <p className="text-xs text-slate-400">
        Zelfstandigenaftrek 2026: €1.200 (afbouw). Voorwaarden: minimaal 1.225 uur per jaar als ondernemer
        (urencriterium) en ondernemer voor de inkomstenbelasting. MKB-winstvrijstelling: {mkbPct} van de winst
        na aftrekposten.
      </p>
    </div>
  );
}
