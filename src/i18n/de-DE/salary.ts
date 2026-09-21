export const salary = {
  categoryTitle: 'Gehaltsrechner Deutschland',
  categoryIntro: 'Berechnen Sie Ihr Nettogehalt, den Mindestlohn und Ihre Sozialversicherungsbeiträge für 2026.',

  mindestlohn: {
    title: 'Mindestlohn-Rechner 2026',
    h1: 'Mindestlohn-Rechner 2026',
    intro:
      'Berechnen Sie Ihren Lohn zum gesetzlichen Mindestlohn 2026 (13,90 € pro Stunde) auf Wochen-, Monats- und Jahresbasis.',
    fields: {
      hoursPerWeek: 'Stunden pro Woche',
      weeksPerYear: 'Arbeitswochen pro Jahr',
    },
    results: {
      hourlyWage:        'Stundenlohn (gesetzlicher Mindestlohn)',
      weeklyWage:        'Wochenlohn',
      monthlyWage:       'Monatslohn (Durchschnitt)',
      annualWage:        'Jahreslohn',
      aboveMinijobLimit: 'Über der Minijob-Grenze (603 €/Monat)',
      belowMinijobLimit: 'Innerhalb der Minijob-Grenze (603 €/Monat)',
    },
  },

  bruttoNetto: {
    title: 'Brutto-Netto-Rechner 2026',
    metaDescription:
      'Berechnen Sie Ihr Nettogehalt 2026 nach Lohnsteuer (§ 32a EStG), Sozialversicherung, Solidaritätszuschlag und Kirchensteuer — mit allen Steuerklassen und Kinderzahl.',
    h1: 'Brutto-Netto-Rechner 2026 — Nettogehalt berechnen',
    intro:
      'Berechnen Sie Ihr monatliches Nettogehalt 2026 nach Lohnsteuer (§ 32a EStG), Sozialversicherungsbeiträgen, Solidaritätszuschlag und Kirchensteuer. Mit Steuerklassen I–VI, Kinderzahl und Kirchensteueroption.',
    fields: {
      grossMonthly:     'Monatliches Bruttogehalt',
      steuerklasse:     'Steuerklasse',
      numberOfChildren: 'Kinder unter 25',
      kirchensteuer:    'Kirchensteuer',
      isSachsen:        'Arbeitsstätte in Sachsen',
      childless:        'Kinderlos (über 23 Jahre)',
    },
    steuerklasseOptions: {
      I:   'I — Ledig / Geschieden',
      II:  'II — Alleinerziehend',
      III: 'III — Verheiratet (Besserverdiener)',
      IV:  'IV — Verheiratet (gleiche Gehälter)',
      V:   'V — Verheiratet (Geringverdiener)',
      VI:  'VI — Zweiter Job',
    },
    kirchensteuerOptions: {
      none:   'Kein Kirchenmitglied',
      other:  'Kirchenmitglied — 9 % (alle BL außer Bayern)',
      bayern: 'Kirchenmitglied — 8 % (Bayern)',
    },
    results: {
      grossMonthly:               'Bruttogehalt monatlich',
      grossAnnual:                'Bruttogehalt jährlich',
      pensionInsurance:           'Rentenversicherung (9,3 %)',
      unemploymentInsurance:      'Arbeitslosenversicherung (1,3 %)',
      healthInsurance:            'Krankenversicherung (8,75 % Ø)',
      longTermCareInsurance:      'Pflegeversicherung',
      totalSocialInsurance:       'Sozialversicherung gesamt',
      lohnsteuer:                 'Lohnsteuer',
      soli:                       'Solidaritätszuschlag',
      kirchensteuer:              'Kirchensteuer',
      noSoli:                     'Kein Solidaritätszuschlag (unter Freigrenze)',
      netMonthly:                 'Nettogehalt monatlich',
      netAnnual:                  'Nettogehalt jährlich',
      effectiveRate:              'Effektive Gesamtbelastung',
      marginalRate:               'Grenzsteuersatz',
      employerCosts:              'Arbeitgeberkosten (informativ)',
      employerTotal:              'Gesamtkosten Arbeitgeber/Monat',
      taxableIncome:              'Zu versteuerndes Einkommen (Jahr)',
    },
    whatIf: {
      heading:        'Was wäre wenn … Gehaltserhöhung simulieren',
      label:          'Neues Bruttogehalt',
      currentNet:     'Aktuelles Netto/Monat',
      newNet:         'Neues Netto/Monat',
      improvement:    'Netto-Verbesserung pro Monat',
      newMarginal:    'neuer Grenzsteuersatz',
    },
  },
} as const;
