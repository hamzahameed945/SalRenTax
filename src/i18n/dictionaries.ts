import type { LocaleCode } from './types';
import { enUS } from './en-US';
import { enGB } from './en-GB';
import { enIE } from './en-IE';
import { ptBR } from './pt-BR';
import { esES } from './es-ES';
import { esMX } from './es-MX';
import { deDE } from './de-DE';
import { nlNL } from './nl-NL';

export type Dictionary = typeof enUS;

const dictionaries = {
  'en-US': enUS,
  'en-GB': enGB,
  'en-IE': enIE,
  'pt-BR': ptBR,
  'es-ES': esES,
  'es-MX': esMX,
  'de-DE': deDE,
  'nl-NL': nlNL,
} as const;

export function getDictionary(locale: 'en-US'): typeof enUS;
export function getDictionary(locale: 'en-GB'): typeof enGB;
export function getDictionary(locale: 'en-IE'): typeof enIE;
export function getDictionary(locale: 'pt-BR'): typeof ptBR;
export function getDictionary(locale: 'es-ES'): typeof esES;
export function getDictionary(locale: 'es-MX'): typeof esMX;
export function getDictionary(locale: 'de-DE'): typeof deDE;
export function getDictionary(locale: 'nl-NL'): typeof nlNL;
export function getDictionary(
  locale: LocaleCode,
): typeof enUS | typeof enGB | typeof enIE | typeof ptBR | typeof esES | typeof esMX | typeof deDE | typeof nlNL;
export function getDictionary(
  locale: LocaleCode,
): typeof enUS | typeof enGB | typeof enIE | typeof ptBR | typeof esES | typeof esMX | typeof deDE | typeof nlNL {
  const dict = dictionaries[locale as keyof typeof dictionaries];
  if (!dict) {
    throw new Error(
      `No translation dictionary for locale "${locale}". This locale is not active yet.`,
    );
  }
  return dict;
}
