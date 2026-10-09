import type { AppData } from '../types'
import { NUTRITION_TARGETS } from '../data/plan'
import { activePlan } from '../data/templates'
import { getDayInfo } from './session'

/**
 * Daily targets and minimums set on the Nutrition and Recovery pages. Hitting the target
 * makes a day green on the Home calendar; hitting only the minimum makes it yellow.
 */
export interface Targets {
  /** Calorie target on easy days (Tue, Sun) and on hard days (the rest). */
  caloriesEasy: number
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

/** Fernando's defaults; calories and protein come from his plan. */
export const DEFAULT_TARGETS: Targets = {
  caloriesEasy: NUTRITION_TARGETS.easy.calories,
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
  return { ...DEFAULT_TARGETS, caloriesEasy: easy.calories, caloriesHard: hard.calories, protein: easy.protein, ...data.profile?.baseTargets }
}

export function getTargets(data: AppData): Targets {
  return { ...defaultTargets(data), ...data.targets }
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
  const hard = getDayInfo(iso, data).hard
  const plan = data.profile?.macros?.[hard ? 'hard' : 'easy'] ?? activePlan().nutrition[hard ? 'hard' : 'easy']
  const calories = hard ? t.caloriesHard : t.caloriesEasy
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
  hard: boolean
  /** Why the day's target is what it is, when a swap or travel day set it. */
  why?: string
}

/**
 * The calorie target follows the session the day turns into on the Workout page: a lifting
 * or hard cardio day gets hard-day calories, easy cardio or rest gets easy-day calories.
 */
export function calorieReason(data: AppData, iso: string): CalorieReason {
  const t = getTargets(data)
  const info = getDayInfo(iso, data)
  const planned = getDayInfo(iso)
  const calories = info.hard ? t.caloriesHard : t.caloriesEasy
  const plannedCalories = planned.hard ? t.caloriesHard : t.caloriesEasy
  const kind = info.hard ? 'Hard day' : 'Easy day'
  const session = info.label.split(' —')[0]
  let why: string | undefined
  if (info.swap) why = `${kind}: swapped ${info.swap.fromLabel.split(' —')[0]} for ${session}`
  else if (info.travel) why = `${kind}: travel day, ${session.replace(/^Travel /, '').toLowerCase()}`
  return { calories, plannedCalories, hard: info.hard, why }
}
