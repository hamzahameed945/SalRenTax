import { useMemo, useState } from 'preact/hooks';
import { mxAguinaldoEngine } from '../../calculators/labor/engines/mxAguinaldo';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

interface Props {
  initialSalary?: number;
}

export default function MxAguinaldoCalculator({ initialSalary }: Props) {
  const [sueldoMensual, setSueldoMensual] = useState(String(initialSalary ?? 20000));
  const [diasAguinaldo, setDiasAguinaldo] = useState('15');
  const [mesesTrabajados, setMesesTrabajados] = useState('12');

  const result = useMemo(() => {
    const validation = mxAguinaldoEngine.validate({
      sueldoMensual: Number(sueldoMensual),
      diasAguinaldo: Number(diasAguinaldo),
      mesesTrabajados: Number(mesesTrabajados),
    });
    return validation.valid ? mxAguinaldoEngine.calculate(validation.data) : null;
  }, [sueldoMensual, diasAguinaldo, mesesTrabajados]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="mx-ag-sueldo">
          Sueldo mensual bruto (MXN)
          <input
            id="mx-ag-sueldo"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={sueldoMensual}
            onInput={(e) => setSueldoMensual((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="mx-ag-dias">
          Días de aguinaldo (mínimo legal: 15)
          <input
            id="mx-ag-dias"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="365"
            value={diasAguinaldo}
            onInput={(e) => setDiasAguinaldo((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="mx-ag-meses">
          Meses trabajados en 2026 (1–12)
          <input
            id="mx-ag-meses"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="12"
            value={mesesTrabajados}
            onInput={(e) => setMesesTrabajados((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Aguinaldo neto estimado</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.aguinaldoNeto) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Aguinaldo bruto</dt>
              <dd>{formatCurrency(result.aguinaldoBruto)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Exento de ISR (30 UMAs)</dt>
              <dd>{formatCurrency(result.montoExento)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Base gravada (ISR)</dt>
              <dd>{formatCurrency(result.baseGravada)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>ISR estimado</dt>
              <dd>{formatCurrency(result.isrEstimado)}</dd>
            </div>
          </dl>
        )}
        <p class="mt-4 text-xs text-slate-500">
          Estimación con la tarifa ISR mensual 2026 (Art. 96 LISR). La retención real
          depende del procedimiento de nómina de tu patrón y de tu ingreso total de
          diciembre. El patrón debe pagar el aguinaldo antes del 20 de diciembre.
        </p>
      </div>
    </div>
  );
}
