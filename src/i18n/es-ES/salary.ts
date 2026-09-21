export const salary = {
  categoryTitle: 'Calculadoras de salario España 2026',
  categoryIntro:
    'Calcula tu sueldo neto, IRPF completo (estatal + autonómico), Seguridad Social y finiquito para 2026.',

  salaryToHourly: {
    title: 'Calculadora de Salario a Hora España',
    h1: 'Calculadora de Salario Anual a Hora',
    intro: 'Convierte tu salario anual bruto en un equivalente por hora según tus horas trabajadas.',
    labels: {
      annualSalary:   'Salario bruto anual (€)',
      hoursPerWeek:   'Horas por semana',
      weeksPerYear:   'Semanas por año',
      resultsHeading: 'Equivalencias de sueldo',
      hourlyWage:     'Salario por hora',
      daily:          'Diario',
      weekly:         'Semanal',
      biweekly:       'Quincenal',
      monthly:        'Mensual',
      placeholder:    'Introduce tu salario anual y horas para ver las equivalencias.',
    },
  },

  payFrequency: {
    title: 'Conversor de Periodo de Pago España',
    h1: 'Conversor de Periodo de Pago',
    intro: 'Convierte tu salario entre semanal, quincenal, mensual y anual.',
    labels: {
      payAmount:        'Importe salarial (€)',
      currentFrequency: 'Periodicidad actual',
      hoursPerWeek:     'Horas por semana',
      resultsHeading:   'Equivalencias por periodo',
      annually:         'Anual',
      monthly:          'Mensual',
      semimonthly:      'Quincenal',
      biweekly:         'Cada dos semanas',
      weekly:           'Semanal',
      daily:            'Diario',
      hourly:           'Por hora',
      placeholder:      'Introduce tu importe y periodicidad para ver las equivalencias.',
    },
  },

  nomina: {
    title: 'Calculadora de Nómina 2026 — IRPF + SS + Comunidad Autónoma',
    metaDescription:
      'Calcula tu sueldo neto en España 2026 con IRPF completo (estatal + autonómico de las 15 CC.AA.), Seguridad Social (6,50%) y reducción por rendimientos del trabajo. Simulador de aumento de sueldo incluido.',
    h1: 'Calculadora de Nómina 2026',
    intro:
      'Calcula tu sueldo neto para 2026 con el IRPF estatal y autonómico de tu comunidad, la cotización a la Seguridad Social completa (6,50%) y la reducción por rendimientos del trabajo (Art. 20 LIRPF). Incluye simulador de aumento de sueldo.',
    fields: {
      grossAnnual:       'Salario bruto anual',
      comunidad:         'Comunidad Autónoma',
      paymentsPerYear:   'Pagas al año',
      age:               'Edad',
    },
    payments: {
      '12': '12 pagas',
      '14': '14 pagas (con 2 pagas extra)',
    },
    results: {
      grossAnnual:               'Salario bruto anual',
      grossPerPayment:           'Bruto por paga',
      ssContingencias:           'Contingencias comunes (4,70 %)',
      ssDesempleo:               'Desempleo (1,55 %)',
      ssMei:                     'MEI (0,15 %)',
      ssFP:                      'Formación Profesional (0,10 %)',
      ssTotalEmployee:           'Total SS trabajador (6,50 %)',
      rendimientoNeto:           'Rendimiento neto del trabajo',
      reduccionRT:               'Reducción rendimientos trabajo (Art. 20)',
      minimoPersonal:            'Mínimo personal',
      baseLiquidable:            'Base liquidable',
      irpfEstatal:               'IRPF escala estatal',
      irpfAutonomica:            'IRPF escala autonómica',
      irpfTotal:                 'IRPF total',
      netAnnual:                 'Sueldo neto anual',
      netPerPayment:             'Sueldo neto por paga',
      netMonthly:                'Sueldo neto mensual',
      effectiveRate:             'Deducción efectiva total',
      marginalRate:              'Tipo marginal IRPF',
    },
    whatIf: {
      heading:   '¿Y si me suben el sueldo?',
      label:     'Nuevo salario bruto anual',
      current:   'Neto actual / paga',
      newNet:    'Neto nuevo / paga',
      improve:   'Mejora neta por paga',
      newMarginal: 'nuevo tipo marginal',
    },
    notices: {
      foralesExcluded:   'País Vasco y Navarra (régimen foral) no están incluidos.',
      estimationOnly:    'Resultado estimado. La retención real depende de tu situación familiar, deducciones personales y el algoritmo de la AEAT.',
    },
  },

  finiquito: {
    title: 'Calcular Finiquito e Indemnización 2026',
    metaDescription:
      'Calcula tu finiquito en España 2026: pagas extra proporcionales, vacaciones, indemnización por despido objetivo o improcedente. Incluye tramo pre/post 2012 (RDL 3/2012).',
    h1: 'Calculadora de Finiquito e Indemnización 2026',
    intro:
      'Estima tu finiquito con pagas extra proporcionales según el mes de salida, vacaciones pendientes e indemnización por despido. Incluye el doble tramo pre/post 12 feb. 2012 para despido improcedente.',
    fields: {
      grossAnnual:          'Salario bruto anual',
      yearsWorked:          'Años trabajados',
      daysHolidayPending:   'Vacaciones pendientes (días)',
      departureMonth:       'Mes de salida',
      paymentsPerYear:      'Pagas al año',
      dismissalType:        'Situación',
      yearsWorkedPre2012:   'Años trabajados antes del 12 feb. 2012',
    },
    dismissalTypes: {
      voluntary:          'Baja voluntaria',
      objectiveDismissal: 'Despido objetivo (20 días/año)',
      unfairDismissal:    'Despido improcedente (33 días/año)',
    },
    results: {
      proportionalExtraPay: 'Pagas extra proporcionales',
      holidayPay:           'Vacaciones no disfrutadas',
      severancePre2012:     'Indemnización tramo pre-2012 (45 días/año)',
      severancePost2012:    'Indemnización tramo post-2012 (33/20 días/año)',
      severancePay:         'Indemnización total',
      totalFiniquito:       'Total finiquito estimado',
    },
    notices: {
      irpfExempt:  'La indemnización mínima legal por despido improcedente está exenta de IRPF (Art. 7.e LIRPF). El exceso tributa como renta irregular.',
      pre2012:     'RDL 3/2012: años anteriores al 12-feb-2012 → 45 días/año (tope 42 mensualidades). Años posteriores → 33 días/año (tope 24 mensualidades).',
    },
  },
} as const;
