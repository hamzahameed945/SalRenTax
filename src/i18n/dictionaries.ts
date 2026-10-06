import type { LocaleCode } from './types';
import { enUS } from './en-US';
import { enGB } from './en-GB';
import { enIE } from './en-IE';
import { enNG } from './en-NG';
import { ptBR } from './pt-BR';
import { ptPT } from './pt-PT';
import { esES } from './es-ES';
import { esMX } from './es-MX';
import { esAR } from './es-AR';
import { esCO } from './es-CO';
import { deDE } from './de-DE';
import { nlNL } from './nl-NL';
import { elGR } from './el-GR';

export type Dictionary = typeof enUS;

const dictionaries = {
  'en-US': enUS,
  'en-GB': enGB,
  'en-IE': enIE,
  'en-NG': enNG,
  'pt-BR': ptBR,
  'pt-PT': ptPT,
  'es-ES': esES,
  'es-MX': esMX,
  'es-AR': esAR,
  'es-CO': esCO,
  'de-DE': deDE,
  'nl-NL': nlNL,
  'el-GR': elGR,
} as const;

export function getDictionary(locale: 'en-US'): typeof enUS;
export function getDictionary(locale: 'en-GB'): typeof enGB;
export function getDictionary(locale: 'en-IE'): typeof enIE;
export function getDictionary(locale: 'en-NG'): typeof enNG;
export function getDictionary(locale: 'pt-BR'): typeof ptBR;
export function getDictionary(locale: 'pt-PT'): typeof ptPT;
export function getDictionary(locale: 'es-ES'): typeof esES;
export function getDictionary(locale: 'es-MX'): typeof esMX;
export function getDictionary(locale: 'es-AR'): typeof esAR;
export function getDictionary(locale: 'es-CO'): typeof esCO;
export function getDictionary(locale: 'de-DE'): typeof deDE;
export function getDictionary(locale: 'nl-NL'): typeof nlNL;
export function getDictionary(locale: 'el-GR'): typeof elGR;
export function getDictionary(
  locale: LocaleCode,
): typeof enUS | typeof enGB | typeof enIE | typeof enNG | typeof ptBR | typeof ptPT | typeof esES | typeof esMX | typeof esAR | typeof esCO | typeof deDE | typeof nlNL | typeof elGR;
export function getDictionary(
  locale: LocaleCode,
): typeof enUS | typeof enGB | typeof enIE | typeof enNG | typeof ptBR | typeof ptPT | typeof esES | typeof esMX | typeof esAR | typeof esCO | typeof deDE | typeof nlNL | typeof elGR {
  const dict = dictionaries[locale as keyof typeof dictionaries];
  if (!dict) {
    throw new Error(
      `No translation dictionary for locale "${locale}". This locale is not active yet.`,
    );
  }
  return dict;
}
