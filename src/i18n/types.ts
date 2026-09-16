/**
 * Core locale types shared across the SalRenTax platform.
 * Locale-first architecture: every country/language pair is a distinct
 * LocaleCode with its own currency, formatting, and calculator rules.
 */

export type LocaleCode =
  'en-US' | 'en-GB' | 'en-IE' | 'pt-BR' | 'es-ES' | 'es-MX' | 'de-DE' | 'nl-NL';

/** All locales planned for initial coverage (Section 16 of the spec). */
export const ALL_LOCALES: LocaleCode[] = [
  'en-US',
  'en-GB',
  'en-IE',
  'pt-BR',
  'es-ES',
  'es-MX',
  'de-DE',
  'nl-NL',
];

/**
 * Per-locale status: 'active' locales are built and linked. 'planned',
 * 'coming-soon', and 'disabled' locales are typed but never routed,
 * sitemapped, or linked as clickable — they document the roadmap only.
 */
export type LocaleStatus = 'active' | 'planned' | 'coming-soon' | 'disabled';

/**
 * Per-locale status map. 'active' locales are built and linked; all other
 * statuses are intentionally excluded from routing, the sitemap, and the
 * locale switcher's clickable links — they exist only so the roadmap is
 * typed and visible in code, never as working pages.
 */
export const LOCALE_STATUS: Record<LocaleCode, LocaleStatus> = {
  'en-US': 'active',
  'en-GB': 'coming-soon',
  'en-IE': 'coming-soon',
  'pt-BR': 'coming-soon',
  'es-ES': 'coming-soon',
  'es-MX': 'coming-soon',
  'de-DE': 'coming-soon',
  'nl-NL': 'coming-soon',
};

/** All locales with an 'active' status. Kept in sync with LOCALE_STATUS — do not hand-edit separately. */
export const ACTIVE_LOCALES: LocaleCode[] = ALL_LOCALES.filter(
  (l) => LOCALE_STATUS[l] === 'active',
);

export type CalculatorType = 'usPaycheck' | 'salaryToHourly' | 'hourlyToSalary' | 'payFrequencyConverter' | 'salaryRaise' | 'rentAffordability';

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
  secondaryKeywords: string[];
  region?: string;
  year?: number | 'current' | null;
  contentKey: string;
  equivalentPageGroup?: string;
  status: PageStatus;
  /** Whether this page should be sitemapped/indexed. Defaults to true when status is 'active'. */
  indexable?: boolean;
}
