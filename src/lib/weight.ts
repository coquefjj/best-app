import { parseNum } from './num'
import type { AppData } from '../types'

/**
 * Body weight in kg lives in `habits[date].morningWeight`, the key used before weigh-ins were
 * removed on Sep 28 2026, so weights logged back then show up again.
 */
export const WEIGHT_KEY = 'morningWeight'

export function weightOn(data: AppData, iso: string): number | null {
  const v = data.habits[iso]?.[WEIGHT_KEY]
  return typeof v === 'number' && v > 0 ? v : null
}

/** Every logged weight, oldest first. */
export function weighIns(data: AppData): { date: string; kg: number }[] {
  return Object.keys(data.habits)
    .sort()
    .map((date) => ({ date, kg: weightOn(data, date) }))
    .filter((w): w is { date: string; kg: number } => w.kg != null)
}

/** Reads "79.65" or "79,65" (kept to 2 decimals); null when it isn't a sensible weight. */
export function parseKg(text: string): number | null {
  const n = parseNum(text)
  return n != null && n >= 20 && n <= 400 ? +n.toFixed(2) : null
}

/** Always 2 decimals, e.g. "79.65 kg" or "80.00 kg". */
export const showKg = (kg: number) => `${kg.toFixed(2)} kg`
