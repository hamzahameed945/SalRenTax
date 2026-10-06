import { useState, useMemo } from 'preact/hooks';
import { nlZZPLoondienstEngine } from '../../calculators/salary/engines/nl/nlZZPLoondienstVergelijking';

interface Props { locale: string; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const fmtSigned = (locale: string, v: number) =>
  (v >= 0 ? '+' : '−') + new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.abs(v));

const inputCls =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export default function NlZZPLoondienstVergelijking({ locale }: Props) {
  const [hourlyRate, setHourlyRate]           = useState('75');
  const [billableHours, setBillableHours]     = useState('1200');
  const [businessCosts, setBusinessCosts]     = useState('5000');
  const [grossMonthlySalary, setGrossMonthly] = useState('3500');
  const [includeVakantiegeld, setVak]         = useState(true);
  const [urencriteriumOverride, setUrenc]     = useState(false);

  const result = useMemo(() => {
    const hours = parseInt(billableHours, 10) || 0;
    const input = {
      hourlyRate:        parseFloat(hourlyRate) || 0,
      billableHours:     hours,
      businessCosts:     parseFloat(businessCosts) || 0,
      grossMonthlySalary: parseFloat(grossMonthlySalary) || 0,
      urencriteriumMet:  urencriteriumOverride || hours >= 1225,
      includeVakantiegeld,
    };
    const v = nlZZPLoondienstEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: nlZZPLoondienstEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [hourlyRate, billableHours, businessCosts, grossMonthlySalary, includeVakantiegeld, urencriteriumOverride]);

  const d = result.data;
  const maxNet = d ? Math.max(d.zzp.nettoMaand, d.loondienst.nettoMaand, 1) : 1;

  return (
    <div class="space-y-6">
      {/* Inputs — two columns */}
      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-xl border border-violet-200 bg-violet-50/60 p-5">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-violet-700 mb-4">Als ZZP'er</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Uurtarief (excl. BTW)</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                <input type="number" min="1" step="5" value={hourlyRate}
                  onInput={e => setHourlyRate((e.target as HTMLInputElement).value)}
                  class={`${inputCls} pl-7`} placeholder="bijv. 75" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Declarabele uren per jaar</label>
              <input type="number" min="1" step="50" value={billableHours}
                onInput={e => setBillableHours((e.target as HTMLInputElement).value)}
                class={inputCls} placeholder="bijv. 1200" />
              <p class="mt-1 text-xs text-slate-500">
                {parseInt(billableHours, 10) >= 1225
                  ? '✓ Urencriterium (≥ 1.225 uur) — zelfstandigenaftrek van toepassing'
                  : '⚠ Onder 1.225 uur — geen zelfstandigenaftrek (vinkje hieronder als u wél 1.225 uur maakt incl. indirecte uren)'}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Zakelijke kosten per jaar</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                <input type="number" min="0" step="500" value={businessCosts}
                  onInput={e => setBusinessCosts((e.target as HTMLInputElement).value)}
                  class={`${inputCls} pl-7`} placeholder="bijv. 5000" />
              </div>
            </div>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={urencriteriumOverride}
                onChange={e => setUrenc((e.target as HTMLInputElement).checked)}
                class="h-4 w-4 rounded border-slate-300 text-violet-600" />
              <span class="text-sm text-slate-700">Urencriterium voldaan (1.225 uur incl. indirecte uren)</span>
            </label>
          </div>
        </div>

        <div class="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4">In loondienst</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Bruto maandsalaris</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
                <input type="number" min="1" step="100" value={grossMonthlySalary}
                  onInput={e => setGrossMonthly((e.target as HTMLInputElement).value)}
                  class={`${inputCls} pl-7`} placeholder="bijv. 3500" />
              </div>
            </div>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={includeVakantiegeld}
                onChange={e => setVak((e.target as HTMLInputElement).checked)}
                class="h-4 w-4 rounded border-slate-300 text-blue-600" />
              <span class="text-sm text-slate-700">8% vakantiegeld bij salaris optellen</span>
            </label>
            <p class="text-xs text-slate-500 leading-relaxed">
              Werkgevers betalen de Zvw-heffing (6,10%) en pensioenpremie voor u; die kosten komen niet van uw
              nettoloon af. Een zzp'er moet dit alles zelf reserveren — daarom ziet u hieronder óók het netto per
              declarabel uur.
            </p>
          </div>
        </div>
      </div>

      {d && (
        <div class="space-y-6" role="region" aria-live="polite">
          {/* Verdict */}
          <div class="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white text-center">
            <p class="text-sm font-medium text-slate-300">
              {d.winner === 'gelijk' && 'Beide opties leveren nagenoeg hetzelfde netto op'}
              {d.winner === 'zzp' && 'Als zzp\'er houdt u meer netto over'}
              {d.winner === 'loondienst' && 'In loondienst houdt u meer netto over'}
            </p>
            <p class="mt-1 text-5xl font-bold tracking-tight">
              {fmtSigned(locale, d.verschilNettoMaand)}
              <span class="text-xl font-medium text-slate-300"> /maand</span>
            </p>
            <p class="mt-2 text-sm text-slate-300">
              {d.winner === 'gelijk'
                ? 'Het verschil is minder dan €1 per maand.'
                : `${fmtSigned(locale, d.verschilNettoJaar)} per jaar ten gunste van ${d.winner === 'zzp' ? "zzp" : 'loondienst'}.`}
            </p>
          </div>

          {/* Side-by-side cards */}
          <div class="grid gap-4 md:grid-cols-2">
            <div class={`rounded-xl border-2 p-6 ${d.winner === 'zzp' ? 'border-violet-500 bg-violet-50/50' : 'border-slate-200 bg-white'}`}>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-violet-800">ZZP'er</h3>
                {d.winner === 'zzp' && <span class="text-xs font-bold bg-violet-600 text-white px-2 py-1 rounded-full">WINNAAR</span>}
              </div>
              <p class="mt-2 text-4xl font-bold text-slate-900">{fmt(locale, d.zzp.nettoMaand)}<span class="text-base font-medium text-slate-500">/mnd</span></p>
              <div class="mt-3 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div class="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${(d.zzp.nettoMaand / maxNet) * 100}%` }} />
              </div>
              <dl class="mt-4 space-y-1.5 text-sm">
                <div class="flex justify-between text-slate-600"><dt>Jaaromzet</dt><dd class="font-medium">{fmt(locale, d.zzp.jaarOmzet)}</dd></div>
                <div class="flex justify-between text-slate-600"><dt>− Zakelijke kosten</dt><dd class="font-medium">−{fmt(locale, d.zzp.zakelijkeKosten)}</dd></div>
                <div class="flex justify-between text-slate-600"><dt>− Zelfstandigenaftrek</dt><dd class="font-medium text-green-700">−{fmt(locale, d.zzp.zelfstandigenaftrek)}</dd></div>
                <div class="flex justify-between text-slate-600"><dt>− MKB-winstvrijstelling</dt><dd class="font-medium text-green-700">−{fmt(locale, d.zzp.mkbWinstvrijstelling)}</dd></div>
                <div class="flex justify-between text-slate-600"><dt>− Inkomstenbelasting</dt><dd class="font-medium text-red-600">−{fmt(locale, d.zzp.inkomstenbelasting)}</dd></div>
                <div class="flex justify-between text-slate-600"><dt>− Zvw-bijdrage (4,85%)</dt><dd class="font-medium text-red-600">−{fmt(locale, d.zzp.zvwBijdrage)}</dd></div>
                <div class="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-2"><dt>Netto per jaar</dt><dd>{fmt(locale, d.zzp.nettoJaar)}</dd></div>
                {d.zzp.nettoPerDeclarabelUur !== null && (
                  <div class="flex justify-between text-slate-700 bg-violet-100/70 rounded px-2 py-1.5"><dt class="font-medium">Netto per declarabel uur</dt><dd class="font-bold">€{d.zzp.nettoPerDeclarabelUur.toFixed(2).replace('.', ',')}</dd></div>
                )}
              </dl>
            </div>

            <div class={`rounded-xl border-2 p-6 ${d.winner === 'loondienst' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-blue-800">Loondienst</h3>
                {d.winner === 'loondienst' && <span class="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded-full">WINNAAR</span>}
              </div>
              <p class="mt-2 text-4xl font-bold text-slate-900">{fmt(locale, d.loondienst.nettoMaand)}<span class="text-base font-medium text-slate-500">/mnd</span></p>
              <div class="mt-3 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div class="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(d.loondienst.nettoMaand / maxNet) * 100}%` }} />
              </div>
              <dl class="mt-4 space-y-1.5 text-sm">
                <div class="flex justify-between text-slate-600"><dt>Bruto jaarsalaris</dt><dd class="font-medium">{fmt(locale, d.loondienst.brutoJaar - d.loondienst.vakantiegeld)}</dd></div>
                <div class="flex justify-between text-slate-600"><dt>+ Vakantiegeld (8%)</dt><dd class="font-medium text-green-700">+{fmt(locale, d.loondienst.vakantiegeld)}</dd></div>
                <div class="flex justify-between text-slate-600"><dt>− Loonheffing (box 1)</dt><dd class="font-medium text-red-600">−{fmt(locale, d.loondienst.loonheffing)}</dd></div>
                <div class="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-2"><dt>Netto per jaar</dt><dd>{fmt(locale, d.loondienst.nettoJaar)}</dd></div>
                <div class="flex justify-between text-slate-700 bg-blue-100/70 rounded px-2 py-1.5"><dt class="font-medium">Netto per uur (40-urige week)</dt><dd class="font-bold">€{d.loondienst.nettoPerUur.toFixed(2).replace('.', ',')}</dd></div>
              </dl>
            </div>
          </div>

          {/* Breakeven + multiplier */}
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            <h3 class="font-semibold mb-2">Wat moet uw uurtarief zijn om in loondienst bij te blijven?</h3>
            {d.breakevenUurtarief !== null ? (
              <p>
                Bij <strong>{d.zzp.nettoPerDeclarabelUur !== null ? (parseInt(billableHours, 10) || 0).toLocaleString('nl-NL') : '—'} declarabele uren</strong> per jaar
                heeft u als zzp'er een uurtarief van <strong>€{d.breakevenUurtarief.toFixed(0)},−</strong> nodig
                om hetzelfde netto te halen als {fmt(locale, d.loondienst.brutoMaand)} bruto per maand in loondienst.
                {d.zzpTariefMultiplier !== null && (
                  <span class="block mt-1">
                    Dat is <strong>{d.zzpTariefMultiplier.toFixed(1).replace('.', ',')}×</strong> het bruto uurloon van de werknemer
                    — de vuistregel in de markt is 2–3×.
                  </span>
                )}
              </p>
            ) : (
              <p>Voer geldige waarden in om het benodigde uurtarief te berekenen.</p>
            )}
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Indicatieve berekening op basis van de 2026-regels: zelfstandigenaftrek €1.200 (urencriterium ≥ 1.225 uur),
        MKB-winstvrijstelling 12,70%, box 1-tarieven 35,75% / 37,56% / 49,50%, arbeidskorting en algemene heffingskorting,
        Zvw-bijdrage 4,85% over max. €79.409 (zzp betaalt deze zelf via een aanslag). Geen rekening gehouden met
        pensioenopbouw (in loondienst via werkgever, als zzp'er zelf regelen), arbeidsongeschiktheidsverzekering,
        risico op leegloop en doorbetaling bij ziekte of vakantie. Raadpleeg een boekhouder voor uw persoonlijke situatie.
      </p>
    </div>
  );
}
