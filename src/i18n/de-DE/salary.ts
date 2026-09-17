export const salary = {
  categoryTitle: 'Gehaltsrechner',
  categoryIntro: 'Berechnen Sie den Mindestlohn und Ihre Sozialversicherungsbeiträge für 2026.',
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
      hourlyWage: 'Stundenlohn (gesetzlicher Mindestlohn)',
      weeklyWage: 'Wochenlohn',
      monthlyWage: 'Monatslohn (Durchschnitt)',
      annualWage: 'Jahreslohn',
      aboveMinijobLimit: 'Über der Minijob-Grenze (603 €/Monat)',
      belowMinijobLimit: 'Innerhalb der Minijob-Grenze (603 €/Monat)',
    },
  },
  bruttoNetto: {
    title: 'Brutto-Netto-Rechner 2026',
    h1: 'Brutto-Netto-Rechner — Sozialversicherungsbeiträge 2026',
    intro:
      'Berechnen Sie Ihre gesetzlichen Sozialversicherungsbeiträge (Renten-, Arbeitslosen-, Kranken- und Pflegeversicherung) für 2026.',
    incomeTaxNotice:
      'Wichtiger Hinweis: Dieser Rechner berücksichtigt nur die Sozialversicherungsbeiträge. Die Lohnsteuer ist noch nicht implementiert. Das Ergebnis ist NICHT Ihr tatsächliches Nettogehalt.',
    fields: {
      grossMonthly: 'Monatliches Bruttogehalt',
      childless: 'Kinderlos (über 23 Jahre)',
    },
    results: {
      grossMonthly: 'Bruttogehalt',
      pensionInsurance: 'Rentenversicherung (Arbeitnehmeranteil)',
      unemploymentInsurance: 'Arbeitslosenversicherung (Arbeitnehmeranteil)',
      healthInsurance: 'Krankenversicherung (Arbeitnehmeranteil)',
      longTermCareInsurance: 'Pflegeversicherung (Arbeitnehmeranteil)',
      totalSocialInsurance: 'Sozialversicherung gesamt',
      netAfterSocialInsurance: 'Verbleibt vor Lohnsteuer',
    },
  },
} as const;
