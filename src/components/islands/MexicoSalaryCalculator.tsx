import { useState, useMemo } from 'preact/hooks';
import { mexicoSalaryEngine } from '../../calculators/salary/engines/mx/mexicoSalary';

interface Props { locale: string; }

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(v);
const fmtPct = (v: number) =>
  `${(v * 100).toFixed(2).replace('.', ',')} %`;

export default function MexicoSalaryCalculator(_props: Props) {
  const [grossMonthly, setGrossMonthly] = useState('15000');
  const [whatIfGross, setWhatIfGross]   = useState('');
  const [showWhatIf, setShowWhatIf]     = useState(false);

  const input = useMemo(() => ({
    grossMonthly: parseFloat(grossMonthly) || 0,
  }), [grossMonthly]);

  const result = useMemo(() => {
    const v = mexicoSalaryEngine.validate(input);
    if (!v.valid) return { data: null, errors: v.errors };
    return { data: mexicoSalaryEngine.calculate(v.data, {} as never, 2026), errors: null };
  }, [input]);

  const whatIfResult = useMemo(() => {
    if (!whatIfGross || !showWhatIf) return null;
    const v = mexicoSalaryEngine.validate({ grossMonthly: parseFloat(whatIfGross) || 0 });
    if (!v.valid) return null;
    return mexicoSalaryEngine.calculate(v.data, {} as never, 2026);
  }, [whatIfGross, showWhatIf]);

  const d = result.data;

  return (
    <div class="space-y-6">
      {/* ── Input ──────────────────────────────────────────────────── */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Tus datos</h2>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Salario mensual bruto <span class="text-slate-400 font-normal">(MXN)</span>
          </label>
          <div class="relative max-w-xs">
            <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">$</span>
            <input
              type="number" min="0" step="500"
              class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={grossMonthly}
              onInput={e => setGrossMonthly((e.target as HTMLInputElement).value)}
              placeholder="p. ej. 15000"
            />
          </div>
          {result.errors?.grossMonthly && <p class="mt-1 text-xs text-red-600">Ingresa un monto válido</p>}
          {d && d.subsidioEmpleo > 0 && (
            <p class="mt-1 text-xs text-green-700">
              ✓ Aplica subsidio para el empleo ({fmt(d.subsidioEmpleo)}/mes)
            </p>
          )}
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {d && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div class="rounded-xl bg-gradient-to-br from-red-700 to-red-800 p-6 text-white">
            <p class="text-sm font-medium text-red-200">Salario neto mensual</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(d.netMonthly)}</p>
            <div class="mt-3 flex flex-wrap gap-5 text-sm text-red-100">
              <span>Quincenal: <strong class="text-white">{fmt(d.netBiweekly)}</strong></span>
              <span>Semanal: <strong class="text-white">{fmt(d.netWeekly)}</strong></span>
              <span>Tasa efectiva: <strong class="text-white">{fmtPct(d.effectiveTotalDeductionRate)}</strong></span>
            </div>
          </div>

          {/* Full breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Desglose completo</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">

              {/* Gross + SBC */}
              <div class="flex justify-between px-5 py-3 font-medium text-slate-800">
                <span>Salario bruto mensual</span>
                <span>{fmt(d.grossMonthly)}</span>
              </div>
              {d.sbcMonthly < d.grossMonthly && (
                <div class="flex justify-between px-5 py-2 text-slate-500">
                  <span class="pl-4 text-xs">SBC tope aplicado (25 × UMA)</span>
                  <span class="text-xs">{fmt(d.sbcMonthly)}</span>
                </div>
              )}

              {/* IMSS obrero */}
              <div class="px-5 py-3 space-y-1 bg-orange-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-2">Cuotas IMSS (obrero)</p>
                {d.imssEmExcedenteObrero > 0 && (
                  <Row label="EM excedente s/3 UMAs (0.40 %)" value={-d.imssEmExcedenteObrero} />
                )}
                <Row label="EM prestaciones en dinero (0.25 %)" value={-d.imssEmPrestacionesDineroObrero} />
                <Row label="Invalidez y Vida (0.125 %)" value={-d.imssIvObrero} />
                <Row label="Cesantía y Vejez (1.125 %)" value={-d.imssCyvObrero} />
                <div class="flex justify-between pt-2 border-t border-orange-200 font-medium text-orange-700">
                  <span>Total IMSS obrero</span>
                  <span>−{fmt(d.totalImssObrero)}</span>
                </div>
              </div>

              {/* ISR */}
              <div class="px-5 py-3 space-y-1 bg-red-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2">ISR (Art. 96 LISR 2026)</p>
                <div class="flex justify-between px-0 text-slate-600">
                  <span class="pl-4">Base gravable (bruto − IMSS)</span>
                  <span>{fmt(d.isrTaxableBase)}</span>
                </div>
                <Row label={`ISR bruto (tasa efec. ${fmtPct(d.isrEffectiveRate)})`} value={-d.isrBruto} />
                {d.subsidioEmpleo > 0 && (
                  <div class="flex justify-between text-green-700">
                    <span class="pl-4">+ Subsidio para el empleo</span>
                    <span>+{fmt(d.subsidioEmpleo)}</span>
                  </div>
                )}
                <div class={`flex justify-between pt-2 border-t border-red-200 font-medium ${d.isrNeto < 0 ? 'text-green-700' : 'text-red-700'}`}>
                  <span>ISR neto a retener</span>
                  <span>{d.isrNeto < 0 ? `+${fmt(Math.abs(d.isrNeto))} (crédito)` : `−${fmt(d.isrNeto)}`}</span>
                </div>
              </div>

              {/* Net */}
              <div class="flex justify-between px-5 py-4 bg-red-800 text-white font-bold text-base">
                <span>Salario neto mensual</span>
                <span>{fmt(d.netMonthly)}</span>
              </div>
            </div>
          </div>

          {/* Employer cost */}
          <details class="rounded-xl border border-slate-200 overflow-hidden">
            <summary class="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 cursor-pointer select-none">
              Costo para el patrón (informativo)
            </summary>
            <div class="divide-y divide-slate-100 text-sm bg-white">
              <Row label="EM cuota fija patrón (20.40% × UMA)" value={d.imssEmCuotaFijaPatron} color="slate" />
              <Row label="EM excedente patrón (1.10%)" value={d.imssEmExcedentePatron} color="slate" />
              <Row label="EM prestaciones en dinero patrón (0.70%)" value={d.imssEmPrestacionesDineroPatron} color="slate" />
              <Row label="Invalidez y Vida patrón (0.625%)" value={d.imssIvPatron} color="slate" />
              <Row label="Guarderías y Prest. Sociales (1.00%)" value={d.imssGpsPatron} color="slate" />
              <Row label="Retiro (SAR) patrón (2.00%)" value={d.imssRetiroPatron} color="slate" />
              <Row label="Cesantía y Vejez patrón (3.15%)" value={d.imssCyvPatron} color="slate" />
              <Row label="INFONAVIT patrón (5.00%)" value={d.infonavitPatron} color="slate" />
              <div class="flex justify-between px-5 py-3 font-semibold text-slate-800 bg-slate-50">
                <span>Costo total mensual para el patrón</span>
                <span>{fmt(d.totalCostoPatron)}</span>
              </div>
            </div>
          </details>

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
                  <label class="block text-xs font-medium text-green-800 mb-1">Nuevo salario mensual bruto</label>
                  <div class="relative max-w-xs">
                    <span class="absolute inset-y-0 left-3 flex items-center text-green-500 text-sm">$</span>
                    <input
                      type="number" min="0" step="500"
                      class="w-full rounded-md border border-green-300 bg-white pl-7 pr-3 py-2 text-slate-900 focus:outline-none"
                      value={whatIfGross}
                      onInput={e => setWhatIfGross((e.target as HTMLInputElement).value)}
                      placeholder="p. ej. 20000"
                    />
                  </div>
                </div>
                {whatIfResult && (
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="rounded-lg bg-white border border-green-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Neto actual</p>
                      <p class="text-lg font-bold text-slate-800">{fmt(d.netMonthly)}</p>
                    </div>
                    <div class="rounded-lg bg-white border border-green-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Neto nuevo</p>
                      <p class="text-lg font-bold text-green-700">{fmt(whatIfResult.netMonthly)}</p>
                    </div>
                    <div class="col-span-2 rounded-lg bg-white border border-green-200 p-3">
                      <p class="text-xs text-slate-500 mb-1">Mejora neta mensual</p>
                      <p class={`text-xl font-bold ${whatIfResult.netMonthly >= d.netMonthly ? 'text-green-600' : 'text-red-600'}`}>
                        {whatIfResult.netMonthly >= d.netMonthly ? '+' : ''}
                        {fmt(whatIfResult.netMonthly - d.netMonthly)}
                        <span class="text-sm font-normal text-slate-500 ml-2">
                          (tasa efectiva: {fmtPct(whatIfResult.effectiveTotalDeductionRate)})
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
        Cálculo basado en tablas ISR Art. 96 LISR 2026 (SAT, DOF 28-12-2025), cuotas IMSS obrero-patronales 2026 (LSS)
        y subsidio para el empleo 2026 (DOF 31-12-2025). La cuota EM cuota fija y el excedente sobre 3 UMAs varían
        según la UMA mensual vigente. INFONAVIT y riesgos de trabajo son a cargo del patrón. Los montos son estimados;
        verifica con tu contador o en el SAT.
      </p>
    </div>
  );
}

function Row({ label, value, color = 'orange' }: { label: string; value: number; color?: 'orange' | 'red' | 'slate' }) {
  const cls = color === 'orange' ? 'text-orange-700' : color === 'red' ? 'text-red-700' : 'text-slate-600';
  const sign = value < 0 ? '−' : '';
  return (
    <div class={`flex justify-between px-5 py-1.5 ${cls}`}>
      <span class="pl-4">{label}</span>
      <span>{sign}{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(Math.abs(value))}</span>
    </div>
  );
}
