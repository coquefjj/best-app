import type { AppData, Habit } from '../types'
import { addDays, todayISO } from './date'

/**
 * Whether a habit counts for the day: ticked, any time logged (the streak is days, not
 * minutes), or a count that reached its target.
 */
export function habitDone(h: Habit, value: unknown): boolean {
  if (h.type === 'boolean') return value === true
  if (h.type === 'count') return typeof value === 'number' && value >= (h.target || 1)
  return typeof value === 'number' && value > 0
}

/** "10,000 steps" for a count habit's daily target. */
export const countTarget = (h: Habit) => `${(h.target || 1).toLocaleString('en-US')}${h.unit ? ` ${h.unit}` : ''}`

const doneOn = (data: AppData, h: Habit, iso: string) => habitDone(h, data.habits[iso]?.[h.id])

/**
 * Days in a row up to `iso`. While `iso` is today and not logged yet, the streak from
 * yesterday is still alive, so count back from yesterday instead of showing 0.
 */
export function currentStreak(data: AppData, h: Habit, iso: string): number {
  let day = iso
  if (!doneOn(data, h, day) && iso >= todayISO()) day = addDays(day, -1)
  let n = 0
  while (doneOn(data, h, day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

/** Longest run of days in a row on or before `iso`. */
export function bestStreak(data: AppData, h: Habit, iso: string): number {
  const dates = Object.keys(data.habits)
    .filter((d) => d <= iso && doneOn(data, h, d))
    .sort()
  let best = 0
  let run = 0
  let prev = ''
  for (const d of dates) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

/** The last `n` days ending on `iso`, oldest first, with whether each was done. */
export function recentDays(data: AppData, h: Habit, iso: string, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(iso, i - n + 1)
    return { iso: d, done: doneOn(data, h, d) }
  })
}
