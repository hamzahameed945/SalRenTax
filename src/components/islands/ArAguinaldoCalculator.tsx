import { useMemo, useState } from 'preact/hooks';
import { arAguinaldoEngine } from '../../calculators/labor/engines/arAguinaldo';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

interface Props {
  initialSalary?: number;
}

export default function ArAguinaldoCalculator({ initialSalary }: Props) {
  const [mejorSueldo, setMejorSueldo] = useState(String(initialSalary ?? 1000000));
  const [diasTrabajados, setDiasTrabajados] = useState('180');
  const [submitted, setSubmitted] = useState({
    mejorSueldo,
    diasTrabajados,
  });

  const result = useMemo(() => {
    const validation = arAguinaldoEngine.validate({
      mejorSueldo: Number(submitted.mejorSueldo),
      diasTrabajados: Number(submitted.diasTrabajados),
    });
    return validation.valid ? arAguinaldoEngine.calculate(validation.data) : null;
  }, [submitted]);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <label class="block text-sm font-medium" for="ar-ag-sueldo">
          Mejor sueldo mensual del semestre (ARS)
          <input
            id="ar-ag-sueldo"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="0"
            step="0.01"
            value={mejorSueldo}
            onInput={(e) => setMejorSueldo((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block text-sm font-medium" for="ar-ag-dias">
          Días trabajados en el semestre (1–180)
          <input
            id="ar-ag-dias"
            class="mt-1 w-full rounded border p-2"
            type="number"
            min="1"
            max="180"
            value={diasTrabajados}
            onInput={(e) => setDiasTrabajados((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="rounded-md bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
            onClick={() => setSubmitted({ mejorSueldo, diasTrabajados })}
          >
            Calcular
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setMejorSueldo(String(initialSalary ?? 1000000));
              setDiasTrabajados('180');
              setSubmitted({ mejorSueldo: String(initialSalary ?? 1000000), diasTrabajados: '180' });
            }}
          >
            Restablecer
          </button>
        </div>
      </div>
      <div class="rounded-xl bg-slate-50 p-6" aria-live="polite">
        <p class="text-sm text-slate-500">Aguinaldo (SAC) — segunda cuota</p>
        <p class="text-3xl font-bold text-accent">{result ? formatCurrency(result.aguinaldoBruto) : '—'}</p>
        {result && (
          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <dt>Mejor sueldo del semestre</dt>
              <dd>{formatCurrency(result.mejorSueldo)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Cuota completa (50%)</dt>
              <dd>{formatCurrency(result.cuotaCompleta)}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Días trabajados</dt>
              <dd>{result.diasTrabajados} de 180</dd>
            </div>
          </dl>
        )}
        <p class="mt-4 text-xs text-slate-500">
          Estimación bruta según Ley 23.073. La segunda cuota se paga hasta el 18 de diciembre. El SAC puede estar sujeto a Ganancias en ciertos casos.
        </p>
      </div>
    </div>
  );
}
