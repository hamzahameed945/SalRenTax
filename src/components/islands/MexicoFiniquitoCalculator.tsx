import { useMemo, useState } from 'preact/hooks';
import {
  mxFiniquitoEngine,
  type MxDismissalType,
} from '../../calculators/labor/engines/mxFiniquito';
import {
  primaAntiguedadTopeDiario2026,
  vacacionesMinimas,
} from '../../data/salary/mx/mexicoPayrollData2026';

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(v);

const DISMISSAL_LABELS: Record<MxDismissalType, string> = {
  voluntary:            'Renuncia voluntaria',
  justifiedDismissal:   'Despido justificado',
  unjustifiedDismissal: 'Despido injustificado',
};

export default function MexicoFiniquitoCalculator() {
  const [dailyWage, setDailyWage]                   = useState('500');
  const [yearsWorked, setYearsWorked]               = useState('3');
  const [useStatutoryVac, setUseStatutoryVac]       = useState(true);
  const [daysVacationPending, setDaysVacationPending] = useState('');
  const [monthsWorkedThisYear, setMonthsWorkedThisYear] = useState('6');
  const [dismissalType, setDismissalType]           = useState<MxDismissalType>('unjustifiedDismissal');

  const years = parseFloat(yearsWorked) || 0;
  const statutoryDays = vacacionesMinimas(Math.floor(years));

  const vacInput = useStatutoryVac ? undefined : parseFloat(daysVacationPending) || 0;

  const result = useMemo(() => {
    const v = mxFiniquitoEngine.validate({
      dailyWage:           parseFloat(dailyWage) || 0,
      yearsWorked:         years,
      daysVacationPending: vacInput,
      monthsWorkedThisYear: parseInt(monthsWorkedThisYear, 10) || 6,
      dismissalType,
    });
    if (!v.valid) return null;
    return mxFiniquitoEngine.calculate(v.data, {} as never, 2026);
  }, [dailyWage, years, vacInput, monthsWorkedThisYear, dismissalType]);

  return (
    <div class="space-y-6">
      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Datos del trabajador</h2>
        <div class="grid gap-4 sm:grid-cols-2">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Salario diario integrado (SDI) <span class="text-slate-400 font-normal">MXN</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">$</span>
              <input
                type="number" min="0" step="0.01"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                value={dailyWage}
                onInput={e => setDailyWage((e.target as HTMLInputElement).value)}
              />
            </div>
            {parseFloat(dailyWage) > primaAntiguedadTopeDiario2026 && (
              <p class="mt-1 text-xs text-amber-600">
                Prima de antigüedad limitada a {fmt(primaAntiguedadTopeDiario2026)}/día (2× salario mínimo)
              </p>
            )}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Años de servicio</label>
            <input
              type="number" min="0" step="0.5"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={yearsWorked}
              onInput={e => setYearsWorked((e.target as HTMLInputElement).value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Meses trabajados este año</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={monthsWorkedThisYear}
              onChange={e => setMonthsWorkedThisYear((e.target as HTMLSelectElement).value)}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Situación</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={dismissalType}
              onChange={e => setDismissalType((e.target as HTMLSelectElement).value as MxDismissalType)}
            >
              {(Object.entries(DISMISSAL_LABELS) as [MxDismissalType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Vacation days */}
          <div class="sm:col-span-2">
            <div class="flex items-center gap-3 mb-2">
              <label class="text-sm font-medium text-slate-700">Vacaciones pendientes</label>
              <label class="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox" checked={useStatutoryVac}
                  onChange={e => setUseStatutoryVac((e.target as HTMLInputElement).checked)}
                  class="h-3.5 w-3.5 rounded border-slate-300"
                />
                Usar mínimo legal LFT Art. 76 ({statutoryDays} días)
              </label>
            </div>
            {!useStatutoryVac && (
              <input
                type="number" min="0" max="365" step="1"
                class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                value={daysVacationPending}
                onInput={e => setDaysVacationPending((e.target as HTMLInputElement).value)}
                placeholder={`Mín. legal: ${statutoryDays} días`}
              />
            )}
            {useStatutoryVac && years > 0 && (
              <p class="text-xs text-blue-700">
                Para {Math.floor(years)} año(s) completo(s): {statutoryDays} días según LFT Art. 76 (reforma 2023)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {result && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div class="rounded-xl bg-gradient-to-br from-green-700 to-green-800 p-6 text-white">
            <p class="text-sm font-medium text-green-200">Total estimado</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(result.totalLiquidacion)}</p>
            <p class="mt-2 text-sm text-green-100">
              {DISMISSAL_LABELS[dismissalType]} · {Math.floor(years)} año(s) de servicio
            </p>
          </div>

          {/* Breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Desglose</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">

              {/* Basic — all cases */}
              <div class="px-5 py-3 space-y-1 bg-blue-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-2">
                  Prestaciones básicas (todos los casos)
                </p>
                <ResultRow label="Aguinaldo proporcional (15 días)" value={result.proportionalBonus} />
                <ResultRow
                  label={`Vacaciones (${result.vacationDaysUsed} días${useStatutoryVac ? ' — mín. legal' : ''})`}
                  value={result.proportionalVacations}
                />
                <ResultRow label="Prima vacacional (25 %)" value={result.vacationBonus} />
                <div class="flex justify-between pt-2 border-t border-blue-200 font-medium text-blue-800">
                  <span>Subtotal básico</span>
                  <span>{fmt(result.subtotalBasic)}</span>
                </div>
              </div>

              {/* Severance */}
              {(result.severancePay > 0 || result.additionalSeverance > 0 || result.seniorityPremium > 0) && (
                <div class="px-5 py-3 space-y-1 bg-red-50">
                  <p class="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2">
                    Indemnización por despido injustificado
                  </p>
                  {result.severancePay > 0 && (
                    <ResultRow label="Indemnización constitucional (90 días)" value={result.severancePay} color="red" />
                  )}
                  {result.additionalSeverance > 0 && (
                    <ResultRow label={`20 días × ${Math.floor(years)} años`} value={result.additionalSeverance} color="red" />
                  )}
                  {result.seniorityPremium > 0 && (
                    <div>
                      <ResultRow
                        label={`Prima antigüedad (12 días × ${Math.floor(years)} años${result.umaCapApplied ? ' — tope aplicado' : ''})`}
                        value={result.seniorityPremium}
                        color="red"
                      />
                      {result.umaCapApplied && (
                        <p class="text-xs text-amber-700 pl-9 mt-0.5">
                          SDI limitado a {fmt(result.seniorityDailyWageCapped)}/día (2× salario mínimo — Art. 162 LFT)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ISR exemption note */}
              {result.isrExemptEstimate > 0 && (
                <div class="px-5 py-3 bg-amber-50">
                  <p class="text-xs text-amber-700">
                    <strong>Nota ISR:</strong> Parte de la indemnización puede estar exenta de ISR (Art. 93 LISR).
                    Exención estimada: hasta {fmt(result.isrExemptEstimate)}.
                    El monto exacto depende de tu situación fiscal — consulta a tu contador.
                  </p>
                </div>
              )}

              {/* Total */}
              <div class="flex justify-between px-5 py-4 bg-green-800 text-white font-bold text-base">
                <span>Total liquidación</span>
                <span>{fmt(result.totalLiquidacion)}</span>
              </div>
            </div>
          </div>

          {/* Vacation reference table */}
          <details class="rounded-xl border border-slate-200 overflow-hidden">
            <summary class="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 cursor-pointer select-none">
              Tabla de vacaciones mínimas — LFT Art. 76 (reforma 2023)
            </summary>
            <div class="p-4 bg-white">
              <table class="w-full text-xs text-slate-600">
                <thead>
                  <tr class="border-b border-slate-200 text-left">
                    <th class="py-1 pr-4 font-semibold">Años de servicio</th>
                    <th class="py-1 font-semibold">Días mínimos</th>
                  </tr>
                </thead>
                <tbody>
                  {[[1,12],[2,14],[3,16],[4,18],[5,20],[6,22],[10,22],[11,24],[15,24],[16,26],[20,26]].map(([y,d]) => (
                    <tr key={y} class={`border-b border-slate-100 ${Math.floor(years) === y ? 'bg-blue-50 font-semibold text-blue-700' : ''}`}>
                      <td class="py-1 pr-4">{y} año(s)</td>
                      <td class="py-1">{d} días</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Cálculo basado en la Ley Federal del Trabajo (LFT) Arts. 76, 80, 87, 162, 500 y reforma 2023.
        Prima de antigüedad limitada a 2× salario mínimo general diario ({fmt(primaAntiguedadTopeDiario2026)}) per Art. 162 LFT.
        Montos estimados sin deducción de ISR. Consulta con un abogado laboral para tu caso específico.
      </p>
    </div>
  );
}

function ResultRow({
  label, value, color = 'blue',
}: {
  label: string; value: number; color?: 'blue' | 'red';
}) {
  const cls = color === 'red' ? 'text-red-700' : 'text-blue-700';
  return (
    <div class={`flex justify-between ${cls}`}>
      <span class="pl-4">{label}</span>
      <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(value)}</span>
    </div>
  );
}
