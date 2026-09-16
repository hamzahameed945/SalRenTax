import type { LocaleCode } from './types';
import { enUS, type Dictionary } from './en-US';

/**
 * Only en-US has a real dictionary in Phase 1A. Other locales are typed but
 * intentionally absent so that `getDictionary` fails loudly instead of
 * silently falling back to English (see Section 9: no visible English
 * fallback on fully localized pages).
 */
const dictionaries: Partial<Record<LocaleCode, Dictionary>> = {
  'en-US': enUS,
};

export function getDictionary(locale: LocaleCode): Dictionary {
  const dict = dictionaries[locale];
  if (!dict) {
    throw new Error(
      `No translation dictionary for locale "${locale}". This locale is not active yet.`,
    );
  }
  return dict;
}
