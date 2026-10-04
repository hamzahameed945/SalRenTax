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

  const result = useMemo(() => {
    const validation = arAguinaldoEngine.validate({
      mejorSueldo: Number(mejorSueldo),
      diasTrabajados: Number(diasTrabajados),
    });
    return validation.valid ? arAguinaldoEngine.calculate(validation.data) : null;
  }, [mejorSueldo, diasTrabajados]);

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
          Estimación bruta según Ley 23.073. La segunda cuota se paga hasta el 18 de diciembre. El SAC puede estar alcanzado por Ganancias.
        </p>
      </div>
    </div>
  );
}
