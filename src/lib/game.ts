import type { AppData } from '../types'
import { HABIT_DEFS, PLAN_START_DATE } from '../data/plan'
import { getDayInfo } from './session'
import { addDays } from './date'

// Adventure-game stats derived from the logs. Nothing here is stored; it is
// recomputed from AppData so the saved data shape never changes.

export const XP_PER_LEVEL = 250

/** Whether the day's training was done, using the same rules as weekly adherence. */
export function isOnPlan(data: AppData, iso: string): boolean {
  const di = getDayInfo(iso)
  const w = data.workouts[iso]
  if (di.dayType === 'rest') return !!w?.mobilityDone
  if (di.hasStrengthExercises) return !!w && Object.keys(w.exercises).length > 0
  return !!w?.aerobic?.chosenOption
}

export function dayXP(data: AppData, iso: string): number {
  let xp = 0
  if (isOnPlan(data, iso)) xp += 50
  if (data.workouts[iso]?.mobilityDone) xp += 10
  const habits = data.habits[iso] ?? {}
  for (const h of HABIT_DEFS) {
    if (h.type === 'boolean' && habits[h.id]) xp += 10
  }
  const protein = (data.food[iso]?.entries ?? []).reduce((a, e) => a + e.protein, 0)
  if (protein >= getDayInfo(iso).nutrition.protein) xp += 20
  return xp
}

export interface HeroStats {
  totalXP: number
  level: number
  levelXP: number
  streak: number
}

export function heroStats(data: AppData, todayIso: string): HeroStats {
  const dates = new Set<string>([
    ...Object.keys(data.workouts),
    ...Object.keys(data.habits),
    ...Object.keys(data.food),
  ])
  let totalXP = 0
  for (const d of dates) {
    if (d >= PLAN_START_DATE && d <= todayIso) totalXP += dayXP(data, d)
  }

  // Streak of on-plan days ending today (or yesterday, if today isn't done yet).
  let streak = 0
  let d = isOnPlan(data, todayIso) ? todayIso : addDays(todayIso, -1)
  while (d >= PLAN_START_DATE && isOnPlan(data, d)) {
    streak++
    d = addDays(d, -1)
  }

  return {
    totalXP,
    level: Math.floor(totalXP / XP_PER_LEVEL) + 1,
    levelXP: totalXP % XP_PER_LEVEL,
    streak,
  }
}
