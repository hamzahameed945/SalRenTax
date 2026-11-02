export const salary = {
  categoryTitle: 'Calcolatori di stipendio Italia 2026',
  categoryIntro: 'Calcola il tuo stipendio netto 2026 con i dati ufficiali italiani.',

  salaryToHourly: {
    title: 'Stipendio Annuo in Tariffa Oraria Italia 2026 — PayRenTax',
    h1: 'Stipendio Annuo in Tariffa Oraria',
    intro: 'Converti il tuo stipendio annuo lordo in equivalente orario, in base alle ore settimanali e alle settimane lavorate all’anno.',
  },

  payFrequency: {
    title: 'Convertitore di Periodo di Pagamento Italia — PayRenTax',
    h1: 'Convertitore di Periodo di Pagamento',
    intro: 'Converti il tuo stipendio tra settimanale, quindicinale, mensile e annuale.',
  },

  itLordoNetto: {
    title: 'Calcolatore Stipendio Lordo Netto Italia 2026 | PayRenTax',
    metaDescription:
      'Calcola il tuo stipendio netto annuo in Italia 2026 dopo i contributi INPS (9,19%) e l’IRPEF nazionale (23%, 33%, 43%). Gratuito, senza registrazione.',
    h1: 'Calcolatore Stipendio Lordo Netto Italia 2026',
    intro:
      'Stima il tuo stipendio netto annuo 2026 dopo i contributi INPS e l’IRPEF nazionale. Il calcolatore non include le addizionali regionali e comunali, che variano in base alla residenza, né la detrazione per lavoro dipendente.',
    fields: {
      grossAnnual: 'Retribuzione annua lorda — RAL (€)',
      whatIfGross: 'Nuova retribuzione annua lorda',
    },
    results: {
      grossAnnual: 'Retribuzione annua lorda',
      inps: 'Contributi INPS a carico del dipendente (9,19%)',
      inpsExtra: 'Contributo INPS aggiuntivo (+1% sopra €56.224)',
      taxableIncome: 'Reddito imponibile (RAL meno INPS)',
      irpef: 'IRPEF nazionale (23% / 33% / 43%)',
      totalDeductions: 'Totale trattenute',
      netAnnual: 'Stipendio netto annuo',
      netMonthly: 'Stipendio netto mensile (su 12 mensilità)',
      effectiveRate: 'Aliquota effettiva di prelievo',
    },
    whatIf: {
      heading: 'E se il mio stipendio aumentasse?',
      currentNet: 'Netto annuo attuale',
      newNet: 'Nuovo netto annuo',
      improvement: 'Miglioramento netto annuo',
    },
  },
} as const;
