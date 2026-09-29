import type { AppData } from '../types'
import { HABIT_DEFS } from '../data/plan'
import { addDays, todayISO } from './date'

export const STREAK_HABITS = HABIT_DEFS.filter((h) => h.group === 'habit')
export type StreakHabit = (typeof STREAK_HABITS)[number]

/**
 * Whether a habit counts for the day. Time habits count once a time is logged (any time,
 * the streak is about days in a row, not minutes); phone time counts even at 0 min.
 */
export function habitDone(h: StreakHabit, value: unknown): boolean {
  if (h.type === 'boolean') return value === true
  if (typeof value !== 'number') return false
  return h.id === 'phoneMin' ? value >= 0 : value > 0
}

const doneOn = (data: AppData, h: StreakHabit, iso: string) => habitDone(h, data.habits[iso]?.[h.id])

/**
 * Days in a row up to `iso`. While `iso` is today and not logged yet, the streak from
 * yesterday is still alive, so count back from yesterday instead of showing 0.
 */
export function currentStreak(data: AppData, h: StreakHabit, iso: string): number {
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
export function bestStreak(data: AppData, h: StreakHabit, iso: string): number {
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
export function recentDays(data: AppData, h: StreakHabit, iso: string, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(iso, i - n + 1)
    return { iso: d, done: doneOn(data, h, d) }
  })
}
