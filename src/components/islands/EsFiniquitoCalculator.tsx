import { useMemo, useState } from 'preact/hooks';
import {
  esFiniquitoEngine,
  type EsDismissalType,
} from '../../calculators/labor/engines/esFiniquito';

const fmt = (v: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);

const DISMISSAL_LABELS: Record<EsDismissalType, string> = {
  voluntary:          'Baja voluntaria',
  objectiveDismissal: 'Despido objetivo (20 días/año)',
  unfairDismissal:    'Despido improcedente (33 días/año)',
};

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export default function EsFiniquitoCalculator({
  defaultDismissal = 'unfairDismissal',
}: { defaultDismissal?: EsDismissalType }) {
  const [grossAnnual, setGrossAnnual]             = useState('30000');
  const [yearsWorked, setYearsWorked]             = useState('5');
  const [daysHolidayPending, setDaysHolidayPending] = useState('10');
  const [departureMonth, setDepartureMonth]       = useState<string>('6');
  const [paymentsPerYear, setPaymentsPerYear]     = useState<'12' | '14'>('14');
  const [dismissalType, setDismissalType]         = useState<EsDismissalType>(defaultDismissal);
  const [yearsWorkedPre2012, setYearsPre2012]     = useState('0');

  const years = parseFloat(yearsWorked) || 0;
  const pre2012 = parseFloat(yearsWorkedPre2012) || 0;
  const showPre2012 = dismissalType === 'unfairDismissal';

  const result = useMemo(() => {
    const v = esFiniquitoEngine.validate({
      grossAnnual:        parseFloat(grossAnnual) || 0,
      yearsWorked:        years,
      daysHolidayPending: parseFloat(daysHolidayPending) || 0,
      dismissalType,
      departureMonth:     parseInt(departureMonth, 10) || 6,
      yearsWorkedPre2012: pre2012,
      paymentsPerYear:    paymentsPerYear === '14' ? 14 : 12,
    });
    if (!v.valid) return null;
    return esFiniquitoEngine.calculate(v.data, {} as never, 2026);
  }, [grossAnnual, years, daysHolidayPending, dismissalType, departureMonth, pre2012, paymentsPerYear]);

  return (
    <div class="space-y-6">

      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Datos del contrato</h2>
        <div class="grid gap-4 sm:grid-cols-2">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Salario bruto anual (€)</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">€</span>
              <input
                type="number" min="0" step="500"
                class="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
                value={grossAnnual}
                onInput={e => setGrossAnnual((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Años trabajados</label>
            <input
              type="number" min="0" step="0.5"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
              value={yearsWorked}
              onInput={e => setYearsWorked((e.target as HTMLInputElement).value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Vacaciones pendientes (días)</label>
            <input
              type="number" min="0" max="365"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
              value={daysHolidayPending}
              onInput={e => setDaysHolidayPending((e.target as HTMLInputElement).value)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Mes de salida</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
              value={departureMonth}
              onChange={e => setDepartureMonth((e.target as HTMLSelectElement).value)}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Pagas al año</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
              value={paymentsPerYear}
              onChange={e => setPaymentsPerYear((e.target as HTMLSelectElement).value as '12' | '14')}
            >
              <option value="14">14 pagas</option>
              <option value="12">12 pagas</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Situación</label>
            <select
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
              value={dismissalType}
              onChange={e => setDismissalType((e.target as HTMLSelectElement).value as EsDismissalType)}
            >
              {(Object.entries(DISMISSAL_LABELS) as [EsDismissalType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {showPre2012 && (
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Años trabajados <strong>antes del 12 feb. 2012</strong>{' '}
                <span class="text-slate-400 font-normal">(tramo 45 días/año)</span>
              </label>
              <input
                type="number" min="0" step="0.5"
                class="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-yellow-500 focus:outline-none"
                value={yearsWorkedPre2012}
                onInput={e => setYearsPre2012((e.target as HTMLInputElement).value)}
                placeholder="0 si toda la antigüedad es posterior"
              />
              <p class="mt-1 text-xs text-slate-400">
                RDL 3/2012: los años anteriores al 12-feb-2012 se indemnizan a 45 días/año (máx. 42 mensualidades).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {result && (
        <div class="space-y-4" role="region" aria-live="polite">

          {/* Hero */}
          <div class="rounded-xl bg-gradient-to-br from-yellow-600 to-red-700 p-6 text-white">
            <p class="text-sm font-medium text-yellow-100">Total finiquito estimado</p>
            <p class="mt-1 text-5xl font-bold tracking-tight">{fmt(result.totalFiniquito)}</p>
            <p class="mt-2 text-sm text-yellow-100">
              {DISMISSAL_LABELS[dismissalType]} · {years} año(s) · salida en {MONTH_NAMES[parseInt(departureMonth) - 1]}
            </p>
          </div>

          {/* Breakdown */}
          <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 class="text-sm font-semibold text-slate-700">Desglose</h3>
            </div>
            <div class="divide-y divide-slate-100 text-sm">

              {/* Proportional pays */}
              <div class="px-5 py-3 space-y-1 bg-blue-50">
                <p class="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-1">Parte proporcional</p>
                {result.extraPays > 0 ? (
                  <div class="flex justify-between text-blue-700">
                    <span class="pl-4">
                      {result.extraPays} paga(s) extra × {result.monthsInYear}/12 meses
                      ({MONTH_NAMES[parseInt(departureMonth) - 1]})
                    </span>
                    <span class="font-medium">{fmt(result.proportionalExtraPay)}</span>
                  </div>
                ) : (
                  <p class="text-xs text-blue-500 pl-4">12 pagas — sin pagas extra proporcionales</p>
                )}
              </div>

              {/* Vacation */}
              <div class="flex justify-between px-5 py-3 text-slate-700">
                <span>Vacaciones no disfrutadas ({(parseFloat(daysHolidayPending) || 0)} días)</span>
                <span class="font-medium">{fmt(result.holidayPay)}</span>
              </div>

              {/* Severance */}
              {result.severancePay > 0 && (
                <div class="px-5 py-3 space-y-1 bg-red-50">
                  <p class="text-xs font-semibold uppercase tracking-wide text-red-400 mb-1">Indemnización</p>
                  {result.severancePre2012 > 0 && (
                    <div>
                      <div class="flex justify-between text-red-700">
                        <span class="pl-4">Tramo pre-2012 (45 días × {pre2012} años{result.pre2012CapApplied ? ' — tope 42 mensualidades' : ''})</span>
                        <span class="font-medium">{fmt(result.severancePre2012)}</span>
                      </div>
                    </div>
                  )}
                  {result.severancePost2012 > 0 && (
                    <div class="flex justify-between text-red-700">
                      <span class="pl-4">
                        {dismissalType === 'unfairDismissal'
                          ? `Tramo post-2012 (33 días × ${Math.max(0, years - pre2012).toFixed(1)} años${result.post2012CapApplied ? ' — tope 24 mensualidades' : ''})`
                          : `20 días/año × ${years} años${result.post2012CapApplied ? ' — tope 12 mensualidades' : ''}`}
                      </span>
                      <span class="font-medium">{fmt(result.severancePost2012)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total */}
              <div class="flex justify-between px-5 py-4 bg-gradient-to-r from-yellow-700 to-red-700 text-white font-bold text-base">
                <span>Total finiquito</span>
                <span>{fmt(result.totalFiniquito)}</span>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <strong>Nota fiscal:</strong> La indemnización mínima legal por despido improcedente está exenta de IRPF
            (Art. 7.e LIRPF). El exceso sobre el mínimo legal tributa como renta irregular.
            Las pagas extra proporcionales y vacaciones pendientes están sujetas a retención normal.
          </div>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Estatuto de los Trabajadores Arts. 53, 56; RDL 3/2012 (reforma laboral tramo pre/post 2012).
        Estimación orientativa — los casos reales pueden variar por convenio colectivo, mejoras pactadas
        o situaciones especiales. Consulta con un asesor laboral.
      </p>
    </div>
  );
}
