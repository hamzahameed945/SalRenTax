import type { LocaleConfig } from '../../i18n/types';

/** Format a numeric amount as currency using the locale's Intl settings. */
export function formatCurrency(amount: number, config: LocaleConfig): string {
  return new Intl.NumberFormat(config.numberLocale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a plain number (e.g. hours) using the locale's number formatting. */
export function formatNumber(value: number, config: LocaleConfig, fractionDigits = 2): string {
  return new Intl.NumberFormat(config.numberLocale, {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Format a ratio (0.22) as a percentage string ("22.0%"). */
export function formatPercent(ratio: number, config: LocaleConfig, fractionDigits = 1): string {
  return new Intl.NumberFormat(config.numberLocale, {
    style: 'percent',
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}

/** Format a date using the locale's date settings. */
export function formatDate(date: Date, config: LocaleConfig): string {
  return new Intl.DateTimeFormat(config.dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
