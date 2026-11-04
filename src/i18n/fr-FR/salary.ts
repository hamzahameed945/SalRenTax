export const salary = {
  categoryTitle: 'Calculateurs de salaire France 2026',
    categoryIntro: 'Calculez votre salaire net en France pour 2026 avec les données officielles: impôt sur le revenu, cotisations sociales et salaire brut-net.',

  salaryToHourly: {
    title: 'Salaire Annuel vers Taux Horaire France 2026 — PayRenTax',
    h1: 'Salaire Annuel vers Taux Horaire',
    intro: 'Convertissez votre salaire annuel brut en équivalent horaire, selon vos heures hebdomadaires et vos semaines travaillées par an.',
  },

  payFrequency: {
    title: 'Convertisseur de Période de Paiement France — PayRenTax',
    h1: 'Convertisseur de Période de Paiement',
    intro: 'Convertissez votre salaire entre hebdomadaire, bimensuel, mensuel et annuel.',
  },

  frBruttoNetto: {
    title: 'Calculateur Salaire Brut Net France 2026 | PayRenTax',
    metaDescription:
      'Calculez votre salaire net mensuel en France 2026 après cotisations salariales : vieillesse, Agirc-Arrco, CEG, CET et CSG/CRDS. Gratuit, sans inscription.',
    h1: 'Calculateur Salaire Brut Net France 2026',
    intro:
      'Estimez votre salaire net mensuel 2026 après cotisations salariales. Ce calculateur déduit les cotisations salariales du brut ; il ne déduit pas le prélèvement à la source, qui est calculé annuellement par foyer fiscal.',
    fields: {
      grossMonthly: 'Salaire mensuel brut (€)',
      whatIfGross: 'Nouveau salaire mensuel brut',
    },
    results: {
      grossMonthly: 'Salaire mensuel brut',
      vieillessePlafonnee: 'Vieillesse plafonnée (6,90 %)',
      vieillesseDeplafonnee: 'Vieillesse déplafonnée (0,40 %)',
      agircArrco: 'Retraite complémentaire Agirc-Arrco',
      ceg: 'Contribution d’équilibre général (CEG)',
      cet: 'Contribution d’équilibre technique (CET)',
      csgCrds: 'CSG / CRDS (9,70 % sur 98,25 % du brut)',
      totalEmployeeDeductions: 'Total des cotisations salariales',
      netMonthly: 'Salaire net mensuel',
      netAnnual: 'Salaire net annuel',
      effectiveRate: 'Taux de prélèvement effectif',
    },
    whatIf: {
      heading: 'Et si mon salaire augmentait ?',
      currentNet: 'Net mensuel actuel',
      newNet: 'Nouveau net mensuel',
      improvement: 'Amélioration nette mensuelle',
    },
  },
} as const;
