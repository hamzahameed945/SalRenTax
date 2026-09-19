/**
 * Core calculator engine contract. Engines are pure TypeScript: no Astro,
 * no Preact, no DOM, no translation strings, no formatting. They accept
 * validated input plus country/year configuration and return structured
 * numeric results for the UI layer to format and render.
 */

import type { ValidationResult } from './validation';
export type { ValidationResult };

export interface CalculatorEngine<Input, Result, Config> {
  calculate(input: Input, config: Config, year: number): Result;
  validate(input: Input): ValidationResult<Input>;
}

export interface BreakdownLine {
  /** i18n key for the label, resolved by the UI layer — never raw English text. */
  labelKey: string;
  amount: number;
}

export interface DataSource {
  authority: string;
  url: string;
  accessedDate: string;
  year: number;
}
