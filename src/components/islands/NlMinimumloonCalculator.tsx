import { useState, useMemo } from 'preact/hooks';
import { nlMinimumloonEngine } from '../../calculators/salary/engines/nl/nlMinimumloon';
import { nlMinimumloon2026 } from '../../data/salary/nl/nlTaxData2026';

interface Props { locale: string; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const fmtWhole = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export default function NlMinimumloonCalculator({ locale }: Props) {
  const [mode, setMode]                 = useState<'hourly'|'monthly'>('hourly');
  const [hourlyRate, setHourlyRate]     = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [age, setAge]                   = useState('');

  const result = useMemo(() => {
    const input = {
      hourlyRate:    mode === 'hourly' && hourlyRate ? parseFloat(hourlyRate) : undefined,
      monthlySalary: mode === 'monthly' && monthlySalary ? parseFloat(monthlySalary) : undefined,
      hoursPerWeek:  parseInt(hoursPerWeek, 10) || 40,
      age:           age ? parseInt(age, 10) : undefined,
    };
    const v = nlMinimumloonEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlMinimumloonEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [mode, hourlyRate, monthlySalary, hoursPerWeek, age]);

  const d = result.data;

  return (
    <div class="space-y-6">
      {/* Info banner */}
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Wettelijk minimumloon 2026:</strong> {fmt(locale, nlMinimumloon2026.hourlyGross)}/uur (40-urige referentieweek).
        Volledig van toepassing vanaf 21 jaar.
      </div>

      {/* Inputs */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Uw loon controleren</h2>

        {/* Mode switch */}
        <div class="flex gap-2 mb-4">
          <button
            onClick={() => setMode('hourly')}
            class={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${mode === 'hourly' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            Uurloon
          </button>
          <button
            onClick={() => setMode('monthly')}
            class={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${mode === 'monthly' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            Maandloon
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          {mode === 'hourly' ? (
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Uw bruto uurloon</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                <input
                  type="number" min="0" step="0.01"
                  class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={hourlyRate}
                  onInput={e => setHourlyRate((e.target as HTMLInputElement).value)}
                  placeholder={fmt(locale, nlMinimumloon2026.hourlyGross)}
                />
              </div>
            </div>
          ) : (
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Uw bruto maandloon</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                <input
                  type="number" min="0" step="10"
                  class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={monthlySalary}
                  onInput={e => setMonthlySalary((e.target as HTMLInputElement).value)}
                  placeholder={fmtWhole(locale, nlMinimumloon2026.monthlyGross)}
                />
              </div>
            </div>
          )}

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Uren per week</label>
            <input
              type="number" min="1" max="60"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={hoursPerWeek}
              onInput={e => setHoursPerWeek((e.target as HTMLInputElement).value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Leeftijd <span class="text-slate-400 font-normal">(optioneel)</span>
            </label>
            <input
              type="number" min="15" max="100"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={age}
              onInput={e => setAge((e.target as HTMLInputElement).value)}
              placeholder="bijv. 21"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {d && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Status banner */}
          {(d.userHourly !== null || d.userMonthly !== null) && (
            <div class={`rounded-xl p-5 ${d.meetsMinimum ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div class="flex items-center gap-3">
                <span class={`text-2xl ${d.meetsMinimum ? 'text-green-600' : 'text-red-600'}`}>
                  {d.meetsMinimum ? '✓' : '✗'}
                </span>
                <div>
                  <p class={`font-semibold ${d.meetsMinimum ? 'text-green-800' : 'text-red-800'}`}>
                    {d.meetsMinimum ? 'Voldoet aan minimumloon' : 'Onder minimumloon'}
                  </p>
                  {!d.meetsMinimum && (
                    <p class="text-sm text-red-700 mt-1">
                      Tekort: {fmt(locale, d.shortfallHourly)}/uur · {fmtWhole(locale, d.shortfallMonthly)}/maand
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reference table */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Minimumloon referentiecijfers 2026</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">
              <div class="flex justify-between px-5 py-3 text-slate-700">
                <span>Minimumuurloon</span>
                <span class="font-medium">{fmt(locale, d.minimumHourly)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 text-slate-700">
                <span>Minimum maandloon ({d.hoursPerWeek} uur/week)</span>
                <span class="font-medium">{fmtWhole(locale, d.minimumMonthly)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 text-slate-700">
                <span>Minimum jaarloon</span>
                <span class="font-medium">{fmtWhole(locale, d.minimumAnnualForHours)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 text-emerald-700 bg-emerald-50">
                <span>+ Vakantiegeld (8%)</span>
                <span class="font-medium">+{fmtWhole(locale, d.minimumVakantiegeld)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 font-semibold text-slate-800 bg-slate-50">
                <span>Totaal jaarpakket (incl. vakantiegeld)</span>
                <span>{fmtWhole(locale, d.minimumTotalPackage)}</span>
              </div>
            </div>
          </div>

          {/* Youth note */}
          {age && parseInt(age) < 21 && (
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Jeugdminimumloon van toepassing.</strong> Voor {age}-jarigen geldt een lager wettelijk minimum
              (percentage van het volwassen minimumloon). Volledig minimumloon geldt vanaf 21 jaar.
            </div>
          )}
        </div>
      )}

      <p class="text-xs text-slate-400">
        Bron: Rijksoverheid — minimumloon per 1 januari 2026. Het minimumloon geldt per gewerkt uur en is niet langer gekoppeld
        aan een vaste werkweek.
      </p>
    </div>
  );
}
