import type { LocaleCode } from './types';
import { ALL_LOCALES, LOCALE_STATUS } from './types';

/** Strip a leading slash and split a URL path into segments. */
export function pathSegments(pathname: string): string[] {
  return pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
}

/** Determine whether a string is a recognized locale code (case-insensitive). */
export function isLocaleCode(value: string | undefined): value is LocaleCode {
  if (!value) return false;
  return ALL_LOCALES.some((l) => l.toLowerCase() === value.toLowerCase());
}

/** Normalize an incoming URL segment (e.g. "en-us") to its canonical LocaleCode ("en-US"). */
export function normalizeLocale(value: string): LocaleCode | null {
  const match = ALL_LOCALES.find((l) => l.toLowerCase() === value.toLowerCase());
  return match ?? null;
}

/** Lowercase URL form of a locale, e.g. "en-US" -> "en-us". */
export function localeToUrlSegment(locale: LocaleCode): string {
  return locale.toLowerCase();
}

export function isLocaleActive(locale: LocaleCode): boolean {
  return LOCALE_STATUS[locale] === 'active';
}

export function buildLocalePath(locale: LocaleCode, ...segments: string[]): string {
  const cleaned = segments.flatMap((s) => pathSegments(s)).join('/');
  return `/${localeToUrlSegment(locale)}${cleaned ? `/${cleaned}/` : '/'}`;
}
