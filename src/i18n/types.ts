/**
 * Core locale types shared across the PayRenTax platform.
 * Locale-first architecture: every country/language pair is a distinct
 * LocaleCode with its own currency, formatting, and calculator rules.
 */

export type LocaleCode =
  | 'en-US'
  | 'en-GB'
  | 'en-IE'
  | 'en-NG'
  | 'pt-BR'
  | 'pt-PT'
  | 'es-ES'
  | 'es-MX'
  | 'es-AR'
  | 'es-CO'
  | 'de-DE'
  | 'nl-NL'
  | 'el-GR';

/** All locales planned for initial coverage. */
export const ALL_LOCALES: LocaleCode[] = [
  'en-US',
  'en-GB',
  'en-IE',
  'en-NG',
  'pt-BR',
  'pt-PT',
  'es-ES',
  'es-MX',
  'es-AR',
  'es-CO',
  'de-DE',
  'nl-NL',
  'el-GR',
];

/**
 * Per-locale status: 'active' locales are built and linked. 'planned',
 * 'coming-soon', and 'disabled' locales are typed but never routed,
 * sitemapped, or linked as clickable.
 */
export type LocaleStatus = 'active' | 'planned' | 'coming-soon' | 'disabled';

export const LOCALE_STATUS: Record<LocaleCode, LocaleStatus> = {
  'en-US': 'active',
  'en-GB': 'active',
  'en-IE': 'active',
  'en-NG': 'active',
  'pt-BR': 'active',
  'pt-PT': 'active',
  'es-ES': 'active',
  'es-MX': 'active',
  'es-AR': 'active',
  'es-CO': 'active',
  'de-DE': 'active',
  'nl-NL': 'active',
  'el-GR': 'active',
};

/** All locales with an 'active' status. */
export const ACTIVE_LOCALES: LocaleCode[] = ALL_LOCALES.filter(
  (l) => LOCALE_STATUS[l] === 'active',
);

export type CalculatorType =
  | 'usPaycheck'
  | 'salaryToHourly'
  | 'hourlyToSalary'
  | 'payFrequencyConverter'
  | 'salaryRaise'
  | 'rentAffordability'
  | 'deMindestlohn'
  | 'deBruttoNetto'
  | 'esNomina'
  | 'mxIsr'
  | 'gbPaycheck'
  | 'iePaycheck'
  | 'brRescisao'
  | 'nlBruttoNetto'
  | 'brDecimoTerceiro'
  | 'brSalarioLiquido'
  | 'brFerias'
  | 'brHorasExtras'
  | 'esFiniquito'
  | 'mxFiniquito'
  | 'dePartTimeSalary'
  | 'deMinijob';

export type Category = 'salary' | 'tax' | 'rent' | 'labor' | 'states' | 'guides';

export type PageStatus = 'active' | 'draft' | 'planned' | 'coming-soon' | 'disabled';

export interface LocaleConfig {
  locale: LocaleCode;
  language: string;
  languageName: string;
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  numberLocale: string;
  dateLocale: string;
  dateFormat: string;
  direction: 'ltr' | 'rtl';
  categories: Category[];
  availableYears: number[];
  defaultYear: number;
}

export interface PageDefinition {
  id: string;
  locale: LocaleCode;
  category: Category;
  slug: string;
  pageType: 'calculator' | 'category' | 'home' | 'guide';
  calculatorType?: string;
  primaryKeyword: string;
  /** Short description shown on calculator cards */
  description?: string;
  secondaryKeywords: string[];
  region?: string;
  year?: number | 'current' | null;
  contentKey: string;
  equivalentPageGroup?: string;
  status: PageStatus;
  /** Whether this page should be sitemapped/indexed. Defaults to true when status is 'active'. */
  indexable?: boolean;
}
