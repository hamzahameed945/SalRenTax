export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: Partial<Record<keyof T, string>> };

export function isPositiveNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

export function isNonNegativeNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

export function validateRequired<T extends Record<string, any>>(
  input: T,
  fields: (keyof T)[],
  message: string = 'This field is required'
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const field of fields) {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      errors[field] = message;
    }
  }
  return errors;
}
