import type { PageDefinition } from '../i18n/types';

/**
 * The page registry is the single source of truth for which pages exist.
 * Only `status: 'active'` entries are built, sitemapped, linked internally,
 * and eligible for hreflang. Draft/planned entries are never generated
 * (Section 8) — they document what's coming without publishing empty pages.
 */
export const pageRegistry: PageDefinition[] = [
  {
    id: 'en-us-home',
    locale: 'en-US',
    category: 'guides',
    slug: '',
    pageType: 'home',
    primaryKeyword: 'us salary and tax calculators',
    secondaryKeywords: ['paycheck calculator', 'take home pay calculator'],
    year: null,
    contentKey: 'localeHome',
    status: 'active',
  },
  {
    id: 'en-us-salary-category',
    locale: 'en-US',
    category: 'salary',
    slug: 'salary',
    pageType: 'category',
    primaryKeyword: 'salary calculators',
    secondaryKeywords: ['paycheck calculator', 'hourly to salary'],
    year: null,
    contentKey: 'salaryCategory',
    status: 'active',
  },
  {
    id: 'en-us-rent-category',
    locale: 'en-US',
    category: 'rent',
    slug: 'rent',
    pageType: 'category',
    primaryKeyword: 'rent calculators',
    secondaryKeywords: ['rent affordability', 'how much rent can i afford'],
    year: null,
    contentKey: 'rentCategory',
    status: 'active',
  },
  {
    id: 'en-us-salary-paycheck',
    locale: 'en-US',
    category: 'salary',
    slug: 'salary/paycheck-calculator',
    pageType: 'calculator',
    calculatorType: 'usPaycheck',
    primaryKeyword: 'paycheck calculator',
    secondaryKeywords: ['take home pay calculator', 'net pay calculator 2026'],
    year: 2026,
    contentKey: 'usPaycheck',
    equivalentPageGroup: 'paycheck-calculator',
    status: 'active',
  },
  {
    id: 'en-us-salary-to-hourly',
    locale: 'en-US',
    category: 'salary',
    slug: 'salary/salary-to-hourly',
    pageType: 'calculator',
    calculatorType: 'salaryToHourly',
    primaryKeyword: 'salary to hourly calculator',
    secondaryKeywords: ['annual to hourly wage', 'convert salary to hourly'],
    year: null,
    contentKey: 'salaryToHourly',
    equivalentPageGroup: 'salary-to-hourly',
    status: 'active',
  },
  {
    id: 'en-us-hourly-to-salary',
    locale: 'en-US',
    category: 'salary',
    slug: 'salary/hourly-to-salary',
    pageType: 'calculator',
    calculatorType: 'hourlyToSalary',
    primaryKeyword: 'hourly to salary calculator',
    secondaryKeywords: ['hourly wage to annual salary', 'hourly pay converter'],
    year: null,
    contentKey: 'hourlyToSalary',
    equivalentPageGroup: 'hourly-to-salary',
    status: 'active',
  },
  {
    id: 'en-us-pay-frequency',
    locale: 'en-US',
    category: 'salary',
    slug: 'salary/pay-frequency-converter',
    pageType: 'calculator',
    calculatorType: 'payFrequencyConverter',
    primaryKeyword: 'pay frequency converter',
    secondaryKeywords: ['convert pay periods', 'monthly to biweekly pay'],
    year: null,
    contentKey: 'payFrequencyConverter',
    equivalentPageGroup: 'pay-frequency',
    status: 'active',
  },
  {
    id: 'en-us-salary-raise',
    locale: 'en-US',
    category: 'salary',
    slug: 'salary/salary-raise',
    pageType: 'calculator',
    calculatorType: 'salaryRaise',
    primaryKeyword: 'salary raise calculator',
    secondaryKeywords: ['pay increase calculator', 'percentage raise calculator'],
    year: null,
    contentKey: 'salaryRaise',
    equivalentPageGroup: 'salary-raise',
    status: 'active',
  },
  {
    id: 'en-us-rent-affordability',
    locale: 'en-US',
    category: 'rent',
    slug: 'rent/rent-affordability',
    pageType: 'calculator',
    calculatorType: 'rentAffordability',
    primaryKeyword: 'rent affordability calculator',
    secondaryKeywords: ['how much rent can i afford', '30 percent rule rent'],
    year: null,
    contentKey: 'rentAffordability',
    equivalentPageGroup: 'rent-affordability',
    status: 'active',
  },
];

export function getActivePages(): PageDefinition[] {
  return pageRegistry.filter((p) => p.status === 'active');
}

export function getActivePagesForLocale(locale: string): PageDefinition[] {
  return getActivePages().filter((p) => p.locale === locale);
}

export function findActivePage(locale: string, slug: string): PageDefinition | undefined {
  return getActivePages().find((p) => p.locale === locale && p.slug === slug);
}

/** Pages sharing an equivalentPageGroup are true cross-locale equivalents, eligible for hreflang. */
export function findEquivalentPages(group: string): PageDefinition[] {
  return getActivePages().filter((p) => p.equivalentPageGroup === group);
}

/** Active pages that should appear in the sitemap (indexable defaults to true when unset). */
export function getIndexablePages(): PageDefinition[] {
  return getActivePages().filter((p) => p.indexable !== false);
}
