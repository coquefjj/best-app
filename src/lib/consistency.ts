import type { AppData } from '../types'
import { getDayInfo } from './session'
import { getTargets, nutritionTarget } from './targets'
import { habitDone } from './streaks'

export type Section = 'workout' | 'habits' | 'nutrition' | 'recovery'

/** full = every target hit, partial = at least one minimum hit, failed = nothing hit, none = nothing logged. */
export type Grade = 'full' | 'partial' | 'failed' | 'none'

type Level = 'target' | 'min' | 'miss'

/** Green when every check is on target, yellow when at least one reaches its minimum, red otherwise. */
function combine(levels: Level[]): Grade {
  if (levels.every((l) => l === 'target')) return 'full'
  if (levels.some((l) => l !== 'miss')) return 'partial'
  return 'failed'
}

const atLeast = (v: number, target: number, min: number): Level => (v >= target ? 'target' : v >= min ? 'min' : 'miss')
const within = (v: number, [lo, hi]: [number, number], [minLo, minHi]: [number, number]): Level =>
  v >= lo && v <= hi ? 'target' : v >= minLo && v <= minHi ? 'min' : 'miss'

/**
 * Workout: finished (or rest-day mobility, or an aerobic session with its time) is green,
 * anything logged is yellow, nothing is red. Days before the first logged workout have no data.
 */
function gradeWorkout(data: AppData, iso: string, firstWorkout: string | undefined): Grade {
  const w = data.workouts[iso]
  const di = getDayInfo(iso)
  if (w?.completedAt) return 'full'
  if (di.dayType === 'rest' && w?.mobilityDone) return 'full'
  if (!di.hasStrengthExercises && di.dayType !== 'rest' && w?.aerobic?.chosenOption && (w.aerobic.durationMin ?? 0) > 0) return 'full'
  const logged =
    !!w &&
    (w.mobilityDone ||
      !!w.aerobic?.chosenOption ||
      Object.values(w.exercises).some((ex) => ex.sets.some((s) => s.done || s.weight != null || s.reps != null || s.seconds != null)))
  if (logged) return 'partial'
  return firstWorkout && iso >= firstWorkout ? 'failed' : 'none'
}

/** Habits: all done is green, some is yellow, none is red; untouched days have no data. */
function gradeHabits(data: AppData, iso: string): Grade {
  const day = data.habits[iso] ?? {}
  const list = data.habitList
  if (!list.length || !list.some((h) => day[h.id] !== undefined)) return 'none'
  const done = list.filter((h) => habitDone(h, day[h.id])).length
  return done === list.length ? 'full' : done > 0 ? 'partial' : 'failed'
}

/** Nutrition: calories inside the target band and protein at target; minimums count as partial. */
function gradeNutrition(data: AppData, iso: string): Grade {
  const entries = data.food[iso]?.entries ?? []
  if (!entries.length) return 'none'
  const t = nutritionTarget(data, iso)
  const calories = entries.reduce((a, e) => a + (e.calories || 0), 0)
  const protein = entries.reduce((a, e) => a + (e.protein || 0), 0)
  return combine([within(calories, t.calorieRange, t.calorieMinRange), atLeast(protein, t.protein, t.proteinMin)])
}

/** Recovery: water, sleep hours and sleep score; a missing value counts as missed once anything is logged. */
function gradeRecovery(data: AppData, iso: string): Grade {
  const day = data.habits[iso] ?? {}
  const num = (k: string) => (typeof day[k] === 'number' ? (day[k] as number) : null)
  const water = num('water')
  const hours = num('sleepHours')
  const score = num('sleepScore')
  if (!water && hours == null && score == null) return 'none'
  const t = getTargets(data)
  return combine([
    atLeast(water ?? 0, t.waterL, t.waterMinL),
    hours == null ? 'miss' : atLeast(hours, t.sleepHours, t.sleepHoursMin),
    score == null ? 'miss' : atLeast(score, t.sleepScore, t.sleepScoreMin),
  ])
}

/** Grades every date for one section; build once per render, then call per day. */
export function sectionGrader(data: AppData, section: Section): (iso: string) => Grade {
  if (section === 'workout') {
    const first = Object.keys(data.workouts).sort()[0]
    return (iso) => gradeWorkout(data, iso, first)
  }
  if (section === 'habits') return (iso) => gradeHabits(data, iso)
  if (section === 'nutrition') return (iso) => gradeNutrition(data, iso)
  return (iso) => gradeRecovery(data, iso)
}
