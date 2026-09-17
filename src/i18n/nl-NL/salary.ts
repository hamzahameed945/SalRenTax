export const salary = {
  categoryTitle: 'Salaris Calculators Nederland',
  categoryIntro: 'Bereken uw netto salaris, uurloon en andere salarisconversies voor Nederland 2026.',
  bruttoNetto: {
    title: 'Bruto Netto Calculator Nederland 2026',
    h1: 'Bruto Netto Calculator Nederland 2026',
    intro:
      'Bereken een schatting van uw netto salaris na inkomstenbelasting (box 1) en sociale premies voor 2026.',
    notice:
      'Let op: dit is een vereenvoudigde berekening. Kortingen (heffingskortingen) en specifieke aftrekposten zijn niet meegenomen.',
    fields: {
      grossAnnual: 'Bruto jaarsalaris',
      age: 'Leeftijd',
    },
    results: {
      grossAnnual: 'Bruto jaarsalaris',
      incomeTax: 'Inkomstenbelasting (box 1, geschat)',
      aow: 'AOW-premie (geschat)',
      netAnnual: 'Netto jaarsalaris (geschat)',
      netMonthly: 'Netto maandsalaris (geschat)',
    },
  },
} as const;
