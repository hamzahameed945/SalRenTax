export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculatePercentage(base: number, rate: number): number {
  return base * rate;
}

export function applyCap(amount: number, cap: number): number {
  return Math.min(amount, cap);
}

export function applyFloor(amount: number, floor: number = 0): number {
  return Math.max(amount, floor);
}
