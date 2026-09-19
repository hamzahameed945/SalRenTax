import { describe, expect, it } from 'vitest';
import {
  buildLocalePath,
  isLocaleActive,
  isLocaleCode,
  normalizeLocale,
} from '../../src/i18n/utils';

describe('locale utils', () => {
  it('recognizes valid locale codes case-insensitively', () => {
    expect(isLocaleCode('en-US')).toBe(true);
    expect(isLocaleCode('en-us')).toBe(true);
    expect(isLocaleCode('xx-YY')).toBe(false);
  });

  it('normalizes a lowercase URL segment to its canonical LocaleCode', () => {
    expect(normalizeLocale('en-us')).toBe('en-US');
    expect(normalizeLocale('pt-br')).toBe('pt-BR');
    expect(normalizeLocale('not-a-locale')).toBeNull();
  });

  it('recognizes the active locales in the registry', () => {
    expect(isLocaleActive('en-US')).toBe(true);
    expect(isLocaleActive('de-DE')).toBe(true);
    expect(isLocaleActive('pt-BR')).toBe(true);
  });

  it('builds a locale-prefixed path', () => {
    expect(buildLocalePath('en-US')).toBe('/en-us/');
    expect(buildLocalePath('en-US', 'salary', 'paycheck-calculator')).toBe(
      '/en-us/salary/paycheck-calculator/',
    );
  });
});
