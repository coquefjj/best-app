import type { AppData } from '../types'
import { NUTRITION_TARGETS } from '../data/plan'
import { activePlan } from '../data/templates'
import { getDayInfo } from './session'

/**
 * Daily targets and minimums set on the Nutrition and Recovery pages. Hitting the target
 * makes a day green on the Home calendar; hitting only the minimum makes it yellow.
 */
export interface Targets {
  /** Calorie target on easy days (Tue, Sun), moderate days (in between) and hard days (the rest). */
  caloriesEasy: number
  caloriesModerate: number
  caloriesHard: number
  /** Within this many kcal of the target counts as on target. */
  calorieTolerance: number
  /** Within this many kcal still counts as the minimum. */
  calorieMinTolerance: number
  protein: number
  proteinMin: number
  waterL: number
  waterMinL: number
  sleepHours: number
  sleepHoursMin: number
  sleepScore: number
  sleepScoreMin: number
}

/** Halfway between the easy and hard day, to the nearest 25 kcal. */
export function midpoint(easy: number, hard: number): number {
  return Math.round((easy + hard) / 2 / 25) * 25
}

/** Fernando's defaults; calories and protein come from his plan. */
export const DEFAULT_TARGETS: Targets = {
  caloriesEasy: NUTRITION_TARGETS.easy.calories,
  caloriesModerate: midpoint(NUTRITION_TARGETS.easy.calories, NUTRITION_TARGETS.hard.calories),
  caloriesHard: NUTRITION_TARGETS.hard.calories,
  calorieTolerance: 150,
  calorieMinTolerance: 350,
  protein: NUTRITION_TARGETS.easy.protein,
  proteinMin: 120,
  waterL: 2,
  waterMinL: 1.4,
  sleepHours: 8,
  sleepHoursMin: 7,
  sleepScore: 80,
  sleepScoreMin: 70,
}

/**
 * Targets before any change on the Nutrition and Recovery pages: the plan's calories and
 * protein, then whatever the profile's onboarding set. "Reset to defaults" goes back here.
 */
export function defaultTargets(data: AppData): Targets {
  const { easy, hard } = activePlan().nutrition
  const t = { ...DEFAULT_TARGETS, caloriesEasy: easy.calories, caloriesHard: hard.calories, protein: easy.protein, ...data.profile?.baseTargets }
  if (data.profile?.baseTargets?.caloriesModerate == null) t.caloriesModerate = midpoint(t.caloriesEasy, t.caloriesHard)
  return t
}

export function getTargets(data: AppData): Targets {
  const t = { ...defaultTargets(data), ...data.targets }
  // Until you set it, the moderate day stays halfway between the other two.
  if (data.targets?.caloriesModerate == null && data.profile?.baseTargets?.caloriesModerate == null) {
    t.caloriesModerate = midpoint(t.caloriesEasy, t.caloriesHard)
  }
  return t
}

export type DayLevel = 'easy' | 'moderate' | 'hard'
export const DAY_LEVELS: { id: DayLevel; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'hard', label: 'Hard' },
]

function sessionLevel(dayType: string, hard: boolean): DayLevel {
  return activePlan().sessions[dayType]?.moderate ? 'moderate' : hard ? 'hard' : 'easy'
}

export interface DayLevelInfo {
  /** The calorie day in effect, what the session alone would give, and what the planned day was. */
  level: DayLevel
  auto: DayLevel
  planned: DayLevel
  /** Picked by hand on the Workout page. */
  picked: boolean
}

export function dayLevel(data: AppData, iso: string): DayLevelInfo {
  const info = getDayInfo(iso, data)
  const planned = getDayInfo(iso)
  const auto = sessionLevel(info.dayType, info.hard)
  const pick = data.dayLevels?.[iso]
  return { level: pick ?? auto, auto, planned: sessionLevel(planned.dayType, planned.hard), picked: pick != null }
}

export function caloriesFor(t: Targets, level: DayLevel): number {
  return level === 'hard' ? t.caloriesHard : level === 'moderate' ? t.caloriesModerate : t.caloriesEasy
}

export interface DayNutritionTarget {
  calories: number
  calorieRange: [number, number]
  calorieMinRange: [number, number]
  protein: number
  proteinMin: number
  carbs: number
  fat: number
}

/** The day's nutrition targets: calories and protein from your settings, carbs and fat from onboarding or the plan. */
export function nutritionTarget(data: AppData, iso: string): DayNutritionTarget {
  const t = getTargets(data)
  const { level } = dayLevel(data, iso)
  const macros = (k: 'easy' | 'hard') => data.profile?.macros?.[k] ?? activePlan().nutrition[k]
  // Moderate days sit halfway between easy and hard for carbs and fat too.
  const plan = level === 'moderate'
    ? { carbs: Math.round((macros('easy').carbs + macros('hard').carbs) / 2), fat: Math.round((macros('easy').fat + macros('hard').fat) / 2) }
    : macros(level)
  const calories = caloriesFor(t, level)
  return {
    calories,
    calorieRange: [calories - t.calorieTolerance, calories + t.calorieTolerance],
    calorieMinRange: [calories - t.calorieMinTolerance, calories + t.calorieMinTolerance],
    protein: t.protein,
    proteinMin: t.proteinMin,
    carbs: plan.carbs,
    fat: plan.fat,
  }
}

export interface CalorieReason {
  /** The day's calorie target and the one the planned session would have had. */
  calories: number
  plannedCalories: number
  level: DayLevel
  picked: boolean
  /** Why the day's target is what it is, when a pick, swap or travel day set it. */
  why?: string
}

/**
 * The calorie target follows the session the day turns into on the Workout page: a lifting
 * or hard cardio day gets hard-day calories, dumbbell-only travel days moderate, easy cardio
 * or rest easy. A day picked by hand on the Workout page wins.
 */
export function calorieReason(data: AppData, iso: string): CalorieReason {
  const t = getTargets(data)
  const info = getDayInfo(iso, data)
  const lv = dayLevel(data, iso)
  const calories = caloriesFor(t, lv.level)
  const plannedCalories = caloriesFor(t, lv.planned)
  const kind = `${DAY_LEVELS.find((l) => l.id === lv.level)!.label} day`
  const session = info.label.split(' —')[0]
  let why: string | undefined
  if (lv.picked) why = `${kind}: picked on Workout`
  else if (info.swap) why = `${kind}: swapped ${info.swap.fromShort} for ${session}`
  else if (info.travel) why = `${kind}: travel day, ${session.replace(/^Travel /, '').toLowerCase()}`
  return { calories, plannedCalories, level: lv.level, picked: lv.picked, why }
}
