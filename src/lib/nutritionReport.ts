import type { AppData, FoodEntry } from '../types'
import { addDays, hhmmToMinutes, todayISO } from './date'
import { nutritionTarget, type DayNutritionTarget } from './targets'
import { MEAL_SLOTS } from '../data/meals'

/** Foods eaten within this many minutes of each other count as one meal. */
export const MEAL_GAP_MIN = 30

/** Times before this hour count as the end of the previous day (a late snack after midnight). */
const DAY_ROLLOVER_MIN = 4 * 60

export interface NutritionDay {
  date: string
  entries: FoodEntry[]
  meals: number
  /** Start time of each meal in minutes since midnight (late-night meals run past 1440); only food with a time. */
  mealTimes: { minutes: number; slot: FoodEntry['mealSlot'] }[]
  calories: number
  protein: number
  carbs: number
  fat: number
  target: DayNutritionTarget
}

const dayMinutes = (time: string | undefined) => {
  const m = hhmmToMinutes(time)
  return m == null ? null : m < DAY_ROLLOVER_MIN ? m + 1440 : m
}

/** Meals in a day: timed food is grouped by MEAL_GAP_MIN, food without a time by its meal slot. */
function groupMeals(entries: FoodEntry[]) {
  const timed = entries
    .map((e) => ({ minutes: dayMinutes(e.time), slot: e.mealSlot }))
    .filter((e): e is { minutes: number; slot: FoodEntry['mealSlot'] } => e.minutes != null)
    .sort((a, b) => a.minutes - b.minutes)
  const mealTimes: NutritionDay['mealTimes'] = []
  let last = -Infinity
  for (const e of timed) {
    if (e.minutes - last > MEAL_GAP_MIN) mealTimes.push(e)
    last = e.minutes
  }
  const untimedSlots = new Set(entries.filter((e) => dayMinutes(e.time) == null).map((e) => e.mealSlot))
  return { meals: mealTimes.length + untimedSlots.size, mealTimes }
}

/** One row per day in the window ending today, oldest first; days with nothing logged are null. */
export function nutritionDays(data: AppData, days: number, end = todayISO()): (NutritionDay | null)[] {
  const out: (NutritionDay | null)[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(end, -i)
    const entries = data.food[date]?.entries ?? []
    if (!entries.length) {
      out.push(null)
      continue
    }
    const sum = (k: 'calories' | 'protein' | 'carbs' | 'fat') => entries.reduce((acc, e) => acc + (e[k] || 0), 0)
    out.push({
      date,
      entries,
      ...groupMeals(entries),
      calories: sum('calories'),
      protein: sum('protein'),
      carbs: sum('carbs'),
      fat: sum('fat'),
      target: nutritionTarget(data, date),
    })
  }
  return out
}

export const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

/** Typical time and how far a day usually strays from it (standard deviation), in minutes. */
export function timeSpread(times: number[]): { usual: number; spread: number } | null {
  if (!times.length) return null
  const usual = average(times)
  const spread = Math.sqrt(average(times.map((t) => (t - usual) ** 2)))
  return { usual, spread }
}

export interface TimingRow {
  label: string
  days: number
  usual: number
  spread: number
}

/** Usual time and spread for each meal logged with a time, then the first and last meal, over days with timed food. */
export function timingRows(days: NutritionDay[]): TimingRow[] {
  const rows: TimingRow[] = []
  const add = (label: string, times: number[]) => {
    const s = timeSpread(times)
    if (s) rows.push({ label, days: times.length, ...s })
  }
  for (const slot of MEAL_SLOTS) {
    add(
      slot.label,
      days.flatMap((d) => {
        const t = d.mealTimes.find((m) => m.slot === slot.id)
        return t ? [t.minutes] : []
      }),
    )
  }
  const timed = days.filter((d) => d.mealTimes.length)
  add('First meal', timed.map((d) => d.mealTimes[0].minutes))
  add('Last meal', timed.map((d) => d.mealTimes[d.mealTimes.length - 1].minutes))
  return rows
}

/** Plain words for a spread in minutes. */
export function spreadWords(spread: number): string {
  if (spread <= 20) return 'Very steady'
  if (spread <= 45) return 'Fairly steady'
  if (spread <= 90) return 'Varies'
  return 'Varies a lot'
}
