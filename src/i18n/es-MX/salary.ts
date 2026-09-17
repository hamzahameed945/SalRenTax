export const salary = {
  categoryTitle: 'Calculadoras de sueldo',
  categoryIntro: 'Calcula tu ISR mensual 2026 con la tarifa oficial del SAT y una estimación de tu sueldo neto.',
  isr: {
    title: 'Calculadora de ISR 2026',
    h1: 'Calculadora de ISR 2026 (Art. 96 LISR)',
    intro:
      'Calcula tu Impuesto Sobre la Renta (ISR) mensual con la tarifa oficial del SAT para 2026, y una estimación de tu sueldo neto.',
    imssNotice:
      'Aviso: este resultado solo descuenta la cuota obrera de Cesantía en Edad Avanzada y Vejez (1.125%) del IMSS. Otras ramas no están incluidas. El sueldo neto real será menor.',
    fields: {
      grossMonthly: 'Ingreso mensual gravable',
    },
    results: {
      grossMonthly: 'Ingreso gravable',
      isrMonthly: 'ISR mensual',
      imssCesantiaYVejez: 'IMSS — Cesantía y Vejez (cuota obrera)',
      netMonthly: 'Neto estimado (parcial)',
    },
  },
  finiquito: {
    title: 'Calculadora de Finiquito México 2026',
    h1: 'Calculadora de Finiquito y Liquidación México 2026',
    intro: 'Calcula tu finiquito o liquidación laboral conforme a la Ley Federal del Trabajo.',
    fields: {
      dailyWage: 'Salario diario integrado',
      yearsWorked: 'Años trabajados',
      daysVacationPending: 'Días de vacaciones pendientes',
      dismissalType: 'Tipo de terminación',
    },
    dismissalTypes: {
      voluntary: 'Renuncia voluntaria',
      justifiedDismissal: 'Despido justificado',
      unjustifiedDismissal: 'Despido injustificado (indemnización)',
    },
    results: {
      proportionalBonus: 'Parte proporcional de aguinaldo',
      proportionalVacations: 'Vacaciones proporcionales',
      vacationBonus: 'Prima vacacional',
      severancePay: 'Indemnización constitucional',
      seniorityPremium: 'Prima de antigüedad',
      totalLiquidacion: 'Total liquidación estimada',
    },
  },
} as const;
