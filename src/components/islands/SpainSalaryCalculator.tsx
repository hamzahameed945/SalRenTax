import { useState, useMemo } from 'preact/hooks';
import { spainSalaryEngine, type ComunidadAutonoma } from '../../calculators/salary/engines/es/spainSalary';
import { comunidadNames } from '../../data/salary/es/spainPayrollData2026';

interface Props { locale: string; }

const fmt = (locale: string, v: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
const fmtPct = (v: number) =>
  `${(v * 100).toFixed(2).replace('.', ',')} %`;

const CCAA_OPTIONS = Object.entries(comunidadNames) as [ComunidadAutonoma, string][];

export default function SpainSalaryCalculator({ locale }: Props) {
  const [grossAnnual, setGrossAnnual]       = useState('30000');
  const [paymentsPerYear, setPaymentsPerYear] = useState<'12' | '14'>('14');
  const [ccaa, setCcaa]                     = useState<ComunidadAutonoma>('madrid');
  const [age, setAge]                       = useState('');
  const [whatIfGross, setWhatIfGross]       = useState('');
  const [showWhatIf, setShowWhatIf]         = useState(false);

  const input = useMemo(() => ({
    grossAnnual:      parseFloat(grossAnnual) || 0,
    paymentsPerYear:  (paymentsPerYear === '14' ? 14 : 12) as 12 | 14,
    comunidadAutonoma: ccaa,
    age:              age ? parseInt(age, 10) : undefined,
  }), [grossAnnual, paymentsPerYear, ccaa, age]);

  const result = useMemo(() => {
    const v = spainSalaryEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: spainSalaryEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [input]);

  const whatIfResult = useMemo(() => {
    if (!whatIfGross || !showWhatIf) return null;
    const v = spainSalaryEngine.validate({ ...input, grossAnnual: parseFloat(whatIfGross) || 0 });
    if (!v.valid) return null;
    return spainSalaryEngine.calculate(v.data, {} as never, 2026);
  }, [whatIfGross, showWhatIf, input]);

  const d = result.data;

  return (
    <div class="space-y-6">

      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Tus datos</h2>
        <div class="grid gap-4 sm:grid-cols-2">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Salario bruto anual</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="500"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                value={grossAnnual}
                onInput={e => setGrossAnnual((e.target as HTMLInputElement).value)}
                placeholder="p. ej. 30000"
              />
            </div>
            {result.errors?.grossAnnual && <p class="mt-1 text-xs text-red-600">Importe no válido</p>}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Comunidad Autónoma</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              value={ccaa}
              onChange={e => setCcaa((e.target as HTMLSelectElement).value as ComunidadAutonoma)}
            >
              {CCAA_OPTIONS.map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Pagas al año</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              value={paymentsPerYear}
              onChange={e => setPaymentsPerYear((e.target as HTMLSelectElement).value as '12' | '14')}
            >
              <option value="14">14 pagas (con 2 pagas extra)</option>
              <option value="12">12 pagas</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Edad <span class="text-slate-400 font-normal">(opcional — afecta mínimo personal)</span>
            </label>
            <input
              type="number" min="16" max="100"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              value={age}
              onInput={e => setAge((e.target as HTMLInputElement).value)}
              placeholder="p. ej. 35"
            />
          </div>
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {d && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div class="rounded-xl bg-gradient-to-br from-yellow-600 to-red-700 p-6 text-white">
            <p class="text-sm font-medium text-yellow-100">
              Neto por paga ({paymentsPerYear === '14' ? '14 pagas' : '12 pagas'})
            </p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(locale, d.netPerPayment)}</p>
            <div class="mt-3 flex flex-wrap gap-5 text-sm text-yellow-100">
              <span>Neto mensual: <strong class="text-white">{fmt(locale, d.netMonthly)}</strong></span>
              <span>Neto anual: <strong class="text-white">{fmt(locale, d.netAnnual)}</strong></span>
              <span>Deducción efectiva: <strong class="text-white">{fmtPct(d.effectiveTotalDeductionRate)}</strong></span>
            </div>
          </div>

          {/* Full breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Desglose completo</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">

              <div class="flex justify-between px-5 py-3 font-medium text-slate-800">
                <span>Salario bruto anual</span>
                <span>{fmt(locale, d.grossAnnual)}</span>
              </div>

              {/* SS */}
              <div class="px-5 py-3 space-y-1 bg-orange-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-2">Seguridad Social (trabajador)</p>
                <Row label="Contingencias comunes (4,70 %)" value={-d.ssContingenciasComunes} locale={locale} />
                <Row label="Desempleo (1,55 %)" value={-d.ssDesempleo} locale={locale} />
                <Row label="MEI (0,15 %)" value={-d.ssMei} locale={locale} />
                <Row label="Formación Profesional (0,10 %)" value={-d.ssFormacionProfesional} locale={locale} />
                <div class="flex justify-between pt-2 border-t border-orange-200 font-medium text-orange-700">
                  <span>Total SS trabajador (6,50 %)</span>
                  <span>−{fmt(locale, d.ssTotalEmployee)}</span>
                </div>
              </div>

              {/* IRPF base construction */}
              <div class="px-5 py-3 space-y-1 bg-blue-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-2">Construcción base IRPF</p>
                <div class="flex justify-between text-slate-600">
                  <span class="pl-4">Rendimiento íntegro</span>
                  <span>{fmt(locale, d.rendimientoIntegro)}</span>
                </div>
                <Row label="Gastos deducibles mínimos (Art. 19.2.f)" value={-d.gastoDeducible} locale={locale} color="blue" />
                <Row label="Cuotas SS deducibles" value={-d.ssTotalEmployee} locale={locale} color="blue" />
                <div class="flex justify-between text-blue-700 font-medium">
                  <span class="pl-4">Rendimiento neto del trabajo</span>
                  <span>{fmt(locale, d.rendimientoNeto)}</span>
                </div>
                {d.reduccionRendimientosTrabajo > 0 && (
                  <Row label={`Reducción Art. 20 LIRPF`} value={-d.reduccionRendimientosTrabajo} locale={locale} color="blue" />
                )}
                <Row label={`Mínimo personal (${age && parseInt(age) >= 75 ? '≥75 años' : age && parseInt(age) >= 65 ? '65–74 años' : 'general'})`} value={-d.minimoPersonal} locale={locale} color="blue" />
                <div class="flex justify-between pt-2 border-t border-blue-200 font-medium text-blue-800">
                  <span>Base liquidable</span>
                  <span>{fmt(locale, d.baseLiquidable)}</span>
                </div>
              </div>

              {/* IRPF taxes */}
              <div class="px-5 py-3 space-y-1 bg-red-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2">IRPF</p>
                <Row label="Escala estatal" value={-d.irpfStateAnnual} locale={locale} color="red" />
                <Row label={`Escala autonómica (${comunidadNames[d.comunidadAutonoma]})`} value={-d.irpfRegionalAnnual} locale={locale} color="red" />
                <div class="flex justify-between pt-2 border-t border-red-200 font-medium text-red-700">
                  <span>IRPF total (tipo efec. {fmtPct(d.irpfEffectiveTotal)})</span>
                  <span>−{fmt(locale, d.irpfTotalAnnual)}</span>
                </div>
                <p class="text-xs text-red-500 pt-1">
                  Tipo marginal: {fmtPct(d.marginalIrpfRate)} · Retención real depende de situación familiar y deducciones
                </p>
              </div>

              {/* Net */}
              <div class="flex justify-between px-5 py-4 bg-gradient-to-r from-yellow-700 to-red-700 text-white font-bold text-base">
                <span>Sueldo neto anual</span>
                <span>{fmt(locale, d.netAnnual)}</span>
              </div>
              <div class="flex justify-between px-5 py-3 text-slate-700 font-medium">
                <span>Por paga ({paymentsPerYear} pagas)</span>
                <span>{fmt(locale, d.netPerPayment)}</span>
              </div>
            </div>
          </div>

          {/* What-if */}
          <div class="rounded-xl border border-green-200 bg-green-50 p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-green-800">¿Y si me suben el sueldo?</h3>
              <button
                onClick={() => setShowWhatIf(v => !v)}
                class="text-xs font-medium text-green-700 hover:text-green-900 underline"
              >
                {showWhatIf ? 'Ocultar' : 'Comparar'}
              </button>
            </div>
            {showWhatIf && (
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-green-800 mb-1">Nuevo salario bruto anual</label>
                  <div class="relative max-w-xs">
                    <span class="absolute inset-y-0 left-3 flex items-center text-green-500 text-sm">€</span>
                    <input
                      type="number" min="0" step="500"
                      class="w-full rounded-md border border-green-300 bg-white pl-7 pr-3 py-2 text-slate-900 focus:outline-none"
                      value={whatIfGross}
                      onInput={e => setWhatIfGross((e.target as HTMLInputElement).value)}
                      placeholder="p. ej. 35000"
                    />
                  </div>
                </div>
                {whatIfResult && (
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="rounded-lg bg-white border border-green-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Neto actual / paga</p>
                      <p class="text-lg font-bold text-slate-800">{fmt(locale, d.netPerPayment)}</p>
                    </div>
                    <div class="rounded-lg bg-white border border-green-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Neto nuevo / paga</p>
                      <p class="text-lg font-bold text-green-700">{fmt(locale, whatIfResult.netPerPayment)}</p>
                    </div>
                    <div class="col-span-2 rounded-lg bg-white border border-green-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Mejora neta por paga</p>
                      <p class={`text-xl font-bold ${whatIfResult.netPerPayment >= d.netPerPayment ? 'text-green-600' : 'text-red-600'}`}>
                        {whatIfResult.netPerPayment >= d.netPerPayment ? '+' : ''}
                        {fmt(locale, whatIfResult.netPerPayment - d.netPerPayment)}
                        <span class="text-sm font-normal text-slate-500 ml-2">
                          (nuevo tipo marginal: {fmtPct(whatIfResult.marginalIrpfRate)})
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

      <p class="text-xs text-slate-400">
        Cálculo basado en la escala general estatal del IRPF 2026 (AEAT) + escala autonómica 2026,
        Orden PJC/297/2026 de cotización SS. Incluye reducción por rendimientos del trabajo (Art. 20 LIRPF)
        cuando aplica. País Vasco y Navarra (régimen foral) no están incluidos. Resultado estimado — la
        retención real depende de tu situación familiar, deducciones y el algoritmo de la AEAT.
      </p>
    </div>
  );
}

function Row({
  label, value, locale, color = 'orange',
}: {
  label: string; value: number; locale: string; color?: 'orange' | 'blue' | 'red';
}) {
  const cls = color === 'orange' ? 'text-orange-700' : color === 'blue' ? 'text-blue-700' : 'text-red-700';
  const sign = value < 0 ? '−' : '';
  return (
    <div class={`flex justify-between ${cls}`}>
      <span class="pl-4">{label}</span>
      <span>{sign}{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(Math.abs(value))}</span>
    </div>
  );
}
