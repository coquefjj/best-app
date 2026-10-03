import type { AppData } from '../types'
import { NUTRITION_TARGETS, isHardDay } from '../data/plan'
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

/** Used until changed in the app; calories and protein come from the plan. */
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

export function getTargets(data: AppData): Targets {
  return { ...DEFAULT_TARGETS, ...data.targets }
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

/** The day's nutrition targets: calories and protein from your settings, carbs and fat from the plan. */
export function nutritionTarget(data: AppData, iso: string): DayNutritionTarget {
  const t = getTargets(data)
  const hard = isHardDay(getDayInfo(iso, data).dayType)
  const plan = hard ? NUTRITION_TARGETS.hard : NUTRITION_TARGETS.easy
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
