export const salary = {
  categoryTitle: 'Calculadoras de sueldo México 2026',
  categoryIntro:
    'Calcula tu ISR, cuotas IMSS, subsidio para el empleo y sueldo neto mensual con las tablas oficiales del SAT 2026.',

  salaryToHourly: {
    title: 'Calculadora de Salario a Hora México',
    h1: 'Calculadora de Salario Anual a Hora',
    intro: 'Convierte tu salario anual en un equivalente por hora según tus horas laboradas.',
  },

  payFrequency: {
    title: 'Conversor de Periodo de Pago México',
    h1: 'Conversor de Periodo de Pago',
    intro: 'Convierte tu sueldo entre semanal, quincenal, mensual y anual conforme a la LFT.',
  },

  isr: {
    title: 'Calculadora de Sueldo Neto México 2026 — ISR e IMSS',
    metaDescription:
      'Calcula tu sueldo neto 2026 después de ISR (Art. 96 LISR), cuotas IMSS obrero y subsidio para el empleo. Tablas oficiales del SAT.',
    h1: 'Calculadora de Sueldo Neto México 2026',
    intro:
      'Calcula tu salario neto mensual 2026 con la tarifa ISR oficial (SAT, Anexo 8 RMF 2026), todas las cuotas IMSS del trabajador y el subsidio para el empleo. Incluye costo para el patrón y simulador de aumento de sueldo.',
    fields: {
      grossMonthly:      'Salario mensual bruto (MXN)',
      whatIfGross:       'Nuevo salario mensual bruto',
    },
    results: {
      grossMonthly:              'Salario bruto mensual',
      sbcMonthly:                'SBC mensual (base cotización)',
      imssEmExcedente:           'IMSS EM excedente s/3 UMAs (0.40 %)',
      imssEmPrestaciones:        'IMSS EM prestaciones en dinero (0.25 %)',
      imssIv:                    'IMSS Invalidez y Vida (0.125 %)',
      imssCyv:                   'IMSS Cesantía y Vejez (1.125 %)',
      totalImssObrero:           'Total IMSS obrero',
      isrTaxableBase:            'Base gravable ISR (bruto − IMSS)',
      isrBruto:                  'ISR bruto',
      subsidioEmpleo:            'Subsidio para el empleo',
      isrNeto:                   'ISR neto a retener',
      netMonthly:                'Sueldo neto mensual',
      netBiweekly:               'Neto quincenal',
      netWeekly:                 'Neto semanal',
      effectiveRate:             'Tasa efectiva total',
      employerCosts:             'Costo para el patrón (informativo)',
      totalCostoPatron:          'Costo total mensual patrón',
    },
    whatIf: {
      heading:      '¿Y si me suben el sueldo?',
      currentNet:   'Neto actual',
      newNet:       'Neto nuevo',
      improvement:  'Mejora neta mensual',
    },
  },

  finiquito: {
    title: 'Calculadora de Finiquito y Liquidación México 2026',
    metaDescription:
      'Calcula tu finiquito o liquidación laboral conforme a la LFT 2026. Incluye aguinaldo proporcional, vacaciones, prima vacacional, indemnización y prima de antigüedad con tope UMA.',
    h1: 'Calculadora de Finiquito y Liquidación México 2026',
    intro:
      'Estima tu finiquito o liquidación laboral conforme a la Ley Federal del Trabajo (LFT). Prima de antigüedad con tope 2× salario mínimo (Art. 162 LFT). Vacaciones mínimas según reforma 2023 Art. 76.',
    fields: {
      dailyWage:            'Salario diario integrado (SDI)',
      yearsWorked:          'Años de servicio',
      daysVacationPending:  'Días de vacaciones pendientes',
      monthsWorkedThisYear: 'Meses trabajados este año',
      dismissalType:        'Situación',
      useStatutoryVac:      'Usar mínimo legal LFT Art. 76',
    },
    dismissalTypes: {
      voluntary:            'Renuncia voluntaria',
      justifiedDismissal:   'Despido justificado',
      unjustifiedDismissal: 'Despido injustificado',
    },
    results: {
      proportionalBonus:     'Aguinaldo proporcional (15 días)',
      proportionalVacations: 'Vacaciones pendientes',
      vacationBonus:         'Prima vacacional (25 %)',
      subtotalBasic:         'Subtotal prestaciones básicas',
      severancePay:          'Indemnización constitucional (90 días)',
      additionalSeverance:   '20 días × años de servicio',
      seniorityPremium:      'Prima de antigüedad (12 días/año)',
      totalLiquidacion:      'Total liquidación estimada',
      isrExemptNote:         'Parte de la indemnización puede estar exenta de ISR (Art. 93 LISR)',
      umaCapNote:            'SDI limitado a 2× salario mínimo — Art. 162 LFT',
    },
  },
} as const;
