import type { LocaleCode, LocaleConfig } from '../../i18n/types';
import { enUSConfig } from './en-US';

/**
 * Config registry. Only en-US is populated in Phase 1A — every other
 * locale is intentionally absent rather than guessed, per the "no fake
 * equivalents" rule (Section 18).
 */
const localeConfigs: Partial<Record<LocaleCode, LocaleConfig>> = {
  'en-US': enUSConfig,
};

export function getLocaleConfig(locale: LocaleCode): LocaleConfig {
  const config = localeConfigs[locale];
  if (!config) {
    throw new Error(`No LocaleConfig for locale "${locale}". This locale is not active yet.`);
  }
  return config;
}

export function getActiveLocaleConfigs(): LocaleConfig[] {
  return Object.values(localeConfigs) as LocaleConfig[];
}
