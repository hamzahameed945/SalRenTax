import { useState, useMemo } from 'preact/hooks';
import { nlHypotheekEngine } from '../../calculators/salary/engines/nl/nlHypotheek';

interface Props { locale: string; initialGrossMonthly?: number; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtPct = (locale: string, v: number, digits = 2) =>
  new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

export default function NlHypotheekCalculator({ locale, initialGrossMonthly = 4000 }: Props) {
  const [grossMonthly, setGrossMonthly]       = useState(String(initialGrossMonthly));
  const [partnerMonthly, setPartnerMonthly]   = useState('');
  const [ratePct, setRatePct]                 = useState('4,0');
  const [termYears, setTermYears]             = useState('30');
  const [otherDebts, setOtherDebts]           = useState('');
  const [singleApplicant, setSingleApplicant] = useState(false);

  const parsePct = (s: string) => parseFloat(s.replace(',', '.'));

  const result = useMemo(() => {
    const input = {
      grossMonthly:       parseFloat(grossMonthly.replace(',', '.')) || 0,
      partnerGrossMonthly: parseFloat(partnerMonthly.replace(',', '.')) || 0,
      annualInterestRate: (parsePct(ratePct) || 4) / 100,
      loanTermYears:      parseInt(termYears, 10) || 30,
      otherMonthlyDebts:  parseFloat(otherDebts.replace(',', '.')) || 0,
      singleApplicant,
    };
    const v = nlHypotheekEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlHypotheekEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [grossMonthly, partnerMonthly, ratePct, termYears, otherDebts, singleApplicant]);

  const d = result.data;
  const inputCls = 'w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div class="space-y-6">
      {/* Inputs */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Uw gegevens</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Bruto maandsalaris <span class="text-slate-400 font-normal">(excl. vakantiegeld)</span></label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input type="number" min="0" step="100" class={`${inputCls} pl-7`}
                value={grossMonthly} onInput={e => setGrossMonthly((e.target as HTMLInputElement).value)} placeholder="4000" />
            </div>
            {result.errors?.grossMonthly && <p class="mt-1 text-xs text-red-600">Vul een geldig salaris in</p>}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Bruto maandsalaris partner <span class="text-slate-400 font-normal">(optioneel)</span></label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input type="number" min="0" step="100" class={`${inputCls} pl-7`}
                value={partnerMonthly} onInput={e => setPartnerMonthly((e.target as HTMLInputElement).value)} placeholder="0" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Hypotheekrente <span class="text-slate-400 font-normal">(indicatie 10 jr vast)</span></label>
            <div class="relative">
              <input type="text" inputMode="decimal" class={`${inputCls} pr-8`}
                value={ratePct} onInput={e => setRatePct((e.target as HTMLInputElement).value)} placeholder="4,0" />
              <span class="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm">%</span>
            </div>
            {result.errors?.annualInterestRate && <p class="mt-1 text-xs text-red-600">Kies een rente tussen 0,5% en 15%</p>}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Looptijd</label>
            <select class={inputCls} value={termYears} onChange={e => setTermYears((e.target as HTMLSelectElement).value)}>
              {[10, 15, 20, 25, 30].map(y => <option key={y} value={y}>{y} jaar</option>)}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Overige maandlasten <span class="text-slate-400 font-normal">(bv. studieschuld)</span></label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input type="number" min="0" step="10" class={`${inputCls} pl-7`}
                value={otherDebts} onInput={e => setOtherDebts((e.target as HTMLInputElement).value)} placeholder="0" />
            </div>
          </div>

          <div class="flex items-end pb-1">
            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600"
                checked={singleApplicant} onChange={e => setSingleApplicant((e.target as HTMLInputElement).checked)} />
              Ik koop alleen <span class="text-slate-400">(Nibud-bonus €17.000)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {d && (
        <div role="region" aria-live="polite">
          <div class="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white mb-4">
            <p class="text-sm font-medium text-blue-200">Maximale hypotheek (indicatie 2026)</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.maxHypotheek)}</p>
            <p class="mt-2 text-sm text-blue-100">
              Bruto maandlast {fmt(locale, d.maandlastBruto)} · financieringslast {fmtPct(locale, d.financieringslastPercentage / 100, 2)} van het toetsinkomen
            </p>
            <p class="mt-1 text-xs text-blue-200">
              {d.pastBinnenNHG
                ? `Past binnen de NHG-grens 2026 (${fmt(locale, d.nhgGrens)}) — mogelijk lagere rente.`
                : `Boven de NHG-grens 2026 (${fmt(locale, d.nhgGrens)}).`}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
              <h3 class="font-semibold text-slate-700">Hoe dit is berekend</h3>
              <div class="space-y-2 divide-y divide-slate-100">
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Toetsinkomen (incl. 8% vakantiegeld)</span>
                  <span>{fmt(locale, d.toetsinkomenAnnual)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Nibud financieringslastpercentage 2026</span>
                  <span class="font-medium">{fmtPct(locale, d.financieringslastPercentage / 100, 2)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Max. bruto maandlast</span>
                  <span class="font-medium text-blue-700">{fmt(locale, d.maxBrutoMaandlast)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Annuïteit ({fmtPct(locale, d.annualInterestRate, 1)}, {d.loanTermYears} jaar)</span>
                  <span class="font-medium">{fmt(locale, d.maxHypotheek)}</span>
                </div>
                {d.singleBonus > 0 && (
                  <div class="flex justify-between pt-2 text-slate-600">
                    <span>Waarvan alleenstaande-bonus (Nibud)</span>
                    <span>{fmt(locale, d.singleBonus)}</span>
                  </div>
                )}
              </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
              <h3 class="font-semibold text-slate-700">Maandlasten eerste maand</h3>
              <div class="space-y-2 divide-y divide-slate-100">
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Rente</span>
                  <span>{fmt(locale, d.eersteMaandRente)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Aflossing</span>
                  <span>{fmt(locale, d.eersteMaandAflossing)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-700 font-semibold">
                  <span>Bruto maandlast</span>
                  <span>{fmt(locale, d.maandlastBruto)}</span>
                </div>
                <div class="flex justify-between pt-2 text-slate-600">
                  <span>Netto indicatie <span class="text-slate-400">(na renteaftrek, {fmtPct(locale, d.marginalBox1Rate, 2)} marginaal)</span></span>
                  <span class="font-medium text-emerald-700">{fmt(locale, d.nettoMaandlastIndicatie)}</span>
                </div>
              </div>
              <p class="text-xs text-slate-400 pt-2">
                De netto-indicatie trekt de hypotheekrente af tegen uw marginale box-1-tarief 2026.
                Het rentedeel daalt naarmate u aflost.
              </p>
            </div>
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Indicatie op basis van de Nibud-financieringslastpercentages 2026 en een indicatieve rente van
        {' '}{ratePct}% (10 jaar vast, aanpasbaar). Geldverstrekkers toetsen met hun eigen rentetabel en
        voorwaarden; dit is geen hypotheekadvies.
      </p>
    </div>
  );
}
