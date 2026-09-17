import type { LocaleCode, LocaleConfig } from '../../i18n/types';
import { enUSConfig } from './en-US';
import { enGBConfig } from './en-GB';
import { enIEConfig } from './en-IE';
import { ptBRConfig } from './pt-BR';
import { esESConfig } from './es-ES';
import { esMXConfig } from './es-MX';
import { deDEConfig } from './de-DE';
import { nlNLConfig } from './nl-NL';

/**
 * Config registry. All active locales have their LocaleConfig populated.
 */
const localeConfigs: Partial<Record<LocaleCode, LocaleConfig>> = {
  'en-US': enUSConfig,
  'en-GB': enGBConfig,
  'en-IE': enIEConfig,
  'pt-BR': ptBRConfig,
  'es-ES': esESConfig,
  'es-MX': esMXConfig,
  'de-DE': deDEConfig,
  'nl-NL': nlNLConfig,
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
