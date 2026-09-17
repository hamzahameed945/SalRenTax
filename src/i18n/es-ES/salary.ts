export const salary = {
  categoryTitle: 'Calculadoras de salario',
  categoryIntro: 'Calcula tu sueldo neto estimado para 2026 con el IRPF estatal y la Seguridad Social.',
  nomina: {
    title: 'Calculadora de Nómina (IRPF + Seguridad Social) 2026',
    h1: 'Calculadora de Nómina 2026 — IRPF y Seguridad Social',
    intro:
      'Calcula una estimación de tu sueldo neto para 2026 a partir del IRPF estatal y las cotizaciones a la Seguridad Social.',
    irpfNotice:
      'Aviso: este resultado incluye solo el tramo ESTATAL del IRPF (sin el tramo autonómico) y no incluye Formación Profesional. Es una estimación, no tu IRPF real.',
    fields: {
      grossAnnual: 'Salario bruto anual',
      paymentsPerYear: 'Pagas al año',
    },
    payments: {
      '12': '12 pagas',
      '14': '14 pagas (con 2 pagas extra)',
    },
    results: {
      grossAnnual: 'Salario bruto anual',
      grossPerPayment: 'Bruto por paga',
      irpfStateAnnual: 'IRPF estatal (anual)',
      seguridadSocialAnnual: 'Seguridad Social (anual)',
      netAnnual: 'Neto estimado (anual)',
      netPerPayment: 'Neto estimado por paga',
    },
  },
  finiquito: {
    title: 'Calcular Finiquito 2026',
    h1: 'Calculadora de Finiquito e Indemnización 2026',
    intro: 'Calcula tu finiquito por baja voluntaria o el importe de la indemnización por despido improcedente.',
    fields: {
      grossAnnual: 'Salario bruto anual',
      yearsWorked: 'Años trabajados',
      daysHolidayPending: 'Días de vacaciones pendientes',
      dismissalType: 'Tipo de finalización',
    },
    dismissalTypes: {
      voluntary: 'Baja voluntaria',
      objectiveDismissal: 'Despido objetivo (20 días/año)',
      unfairDismissal: 'Despido improcedente (33 días/año)',
    },
    results: {
      proportionalPay: 'Parte proporcional de pagas extra',
      holidayPay: 'Vacaciones no disfrutadas',
      severancePay: 'Indemnización (si aplica)',
      totalFiniquito: 'Total finiquito estimado',
    },
  },
} as const;
