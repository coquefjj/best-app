import type { AppData } from '../types'
import { NUTRITION_TARGETS, CARDIO_HARD_OPTIONS } from '../data/plan'
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
  /** Old single protein target; the day fields below start from it. */
  protein: number
  proteinEasy: number
  proteinModerate: number
  proteinHard: number
  proteinMin: number
  /** Carbs and fat (g) by calorie day; moderate starts halfway between easy and hard. */
  carbsEasy: number
  carbsModerate: number
  carbsHard: number
  fatEasy: number
  fatModerate: number
  fatHard: number
  /** Fiber (g) by calorie day; a floor, so more is fine. */
  fiberEasy: number
  fiberModerate: number
  fiberHard: number
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

/** Halfway between the easy and hard day's grams. */
function half(easy: number, hard: number): number {
  return Math.round((easy + hard) / 2)
}

/** Moderate fields that follow the easy and hard day until set, and how they are worked out. */
const MODERATE: [keyof Targets, keyof Targets, keyof Targets, (e: number, h: number) => number][] = [
  ['caloriesModerate', 'caloriesEasy', 'caloriesHard', midpoint],
  ['proteinModerate', 'proteinEasy', 'proteinHard', half],
  ['carbsModerate', 'carbsEasy', 'carbsHard', half],
  ['fatModerate', 'fatEasy', 'fatHard', half],
  ['fiberModerate', 'fiberEasy', 'fiberHard', half],
]

/** Starting fiber: 14 g per 1000 kcal, to the nearest 5 g. */
export function fiberFor(calories: number): number {
  return Math.round((calories * 14) / 1000 / 5) * 5
}

/** Fernando's defaults; calories and protein come from his plan. */
export const DEFAULT_TARGETS: Targets = {
  caloriesEasy: NUTRITION_TARGETS.easy.calories,
  caloriesModerate: midpoint(NUTRITION_TARGETS.easy.calories, NUTRITION_TARGETS.hard.calories),
  caloriesHard: NUTRITION_TARGETS.hard.calories,
  calorieTolerance: 150,
  calorieMinTolerance: 350,
  protein: NUTRITION_TARGETS.easy.protein,
  proteinEasy: NUTRITION_TARGETS.easy.protein,
  proteinModerate: half(NUTRITION_TARGETS.easy.protein, NUTRITION_TARGETS.hard.protein),
  proteinHard: NUTRITION_TARGETS.hard.protein,
  proteinMin: 120,
  carbsEasy: NUTRITION_TARGETS.easy.carbs,
  carbsModerate: half(NUTRITION_TARGETS.easy.carbs, NUTRITION_TARGETS.hard.carbs),
  carbsHard: NUTRITION_TARGETS.hard.carbs,
  fatEasy: NUTRITION_TARGETS.easy.fat,
  fatModerate: half(NUTRITION_TARGETS.easy.fat, NUTRITION_TARGETS.hard.fat),
  fatHard: NUTRITION_TARGETS.hard.fat,
  fiberEasy: fiberFor(NUTRITION_TARGETS.easy.calories),
  fiberModerate: half(fiberFor(NUTRITION_TARGETS.easy.calories), fiberFor(NUTRITION_TARGETS.hard.calories)),
  fiberHard: fiberFor(NUTRITION_TARGETS.hard.calories),
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
/** Protein was one number until Oct 15 2026; easy and hard days start from it until set. */
function followProtein(t: Targets, ...sources: (Partial<Targets> | undefined)[]) {
  for (const k of ['proteinEasy', 'proteinHard'] as const) {
    if (sources.every((s) => s?.[k] == null)) t[k] = t.protein
  }
}

export function defaultTargets(data: AppData): Targets {
  const { easy, hard } = activePlan().nutrition
  // Carbs, fat and fiber: what onboarding set for the profile, otherwise the plan's.
  const macros = data.profile?.macros ?? { easy, hard }
  const t: Targets = {
    ...DEFAULT_TARGETS,
    caloriesEasy: easy.calories,
    caloriesHard: hard.calories,
    protein: easy.protein,
    carbsEasy: macros.easy.carbs,
    carbsHard: macros.hard.carbs,
    fatEasy: macros.easy.fat,
    fatHard: macros.hard.fat,
    fiberEasy: data.profile?.macros?.easy.fiber ?? fiberFor(easy.calories),
    fiberHard: data.profile?.macros?.hard.fiber ?? fiberFor(hard.calories),
    ...data.profile?.baseTargets,
  }
  followProtein(t, data.profile?.baseTargets)
  for (const [mod, e, h, fn] of MODERATE) {
    if (data.profile?.baseTargets?.[mod] == null) t[mod] = fn(t[e], t[h])
  }
  return t
}

export function getTargets(data: AppData): Targets {
  const t = { ...defaultTargets(data), ...data.targets }
  followProtein(t, data.targets, data.profile?.baseTargets)
  // Until you set it, the moderate day stays halfway between the other two.
  for (const [mod, e, h, fn] of MODERATE) {
    if (data.targets?.[mod] == null && data.profile?.baseTargets?.[mod] == null) t[mod] = fn(t[e], t[h])
  }
  return t
}

export type Macro = 'calories' | 'protein' | 'carbs' | 'fiber' | 'fat'
export const MACROS: { id: Macro; label: string }[] = [
  { id: 'calories', label: 'Calories' },
  { id: 'protein', label: 'Protein' },
  { id: 'carbs', label: 'Carbs' },
  { id: 'fiber', label: 'Fiber' },
  { id: 'fat', label: 'Fat' },
]
/** Macros a profile can stop tracking; calories and protein are always tracked. */
export const OPTIONAL_MACROS: Macro[] = ['carbs', 'fiber', 'fat']
/** Carbs and fat are tracked by default; fiber until switched on. */
const DEFAULT_TRACKED: Record<Macro, boolean> = { calories: true, protein: true, carbs: true, fiber: false, fat: true }

export function trackedMacros(data: AppData): Record<Macro, boolean> {
  return { ...DEFAULT_TRACKED, ...data.trackedMacros, calories: true, protein: true }
}

/** Calories and protein count by default; carbs, fiber and fat are only tracked until switched on. */
const DEFAULT_GRADED: Record<Macro, boolean> = { calories: true, protein: true, carbs: false, fiber: false, fat: false }

/** A macro that isn't tracked never counts. */
export function gradedMacros(data: AppData): Record<Macro, boolean> {
  const on = { ...DEFAULT_GRADED, ...data.gradedMacros }
  const tracked = trackedMacros(data)
  for (const m of OPTIONAL_MACROS) on[m] &&= tracked[m]
  return on
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
  // A day swapped to Cardio is moderate, or hard when the cardio picked is HIIT.
  const cardioPick = info.dayType === 'cardio' ? data.workouts[iso]?.aerobic?.chosenOption : undefined
  const auto = cardioPick && CARDIO_HARD_OPTIONS.includes(cardioPick) ? 'hard' : sessionLevel(info.dayType, info.hard)
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
  fiber: number
  fat: number
}

export function proteinFor(t: Targets, level: DayLevel): number {
  return level === 'hard' ? t.proteinHard : level === 'moderate' ? t.proteinModerate : t.proteinEasy
}

export function macrosFor(t: Targets, level: DayLevel): { carbs: number; fiber: number; fat: number } {
  return level === 'hard'
    ? { carbs: t.carbsHard, fiber: t.fiberHard, fat: t.fatHard }
    : level === 'moderate'
      ? { carbs: t.carbsModerate, fiber: t.fiberModerate, fat: t.fatModerate }
      : { carbs: t.carbsEasy, fiber: t.fiberEasy, fat: t.fatEasy }
}

/** The day's nutrition targets for its calorie day, from the Targets card on Nutrition. */
export function nutritionTarget(data: AppData, iso: string): DayNutritionTarget {
  const t = getTargets(data)
  const { level } = dayLevel(data, iso)
  const plan = macrosFor(t, level)
  const calories = caloriesFor(t, level)
  return {
    calories,
    calorieRange: [calories - t.calorieTolerance, calories + t.calorieTolerance],
    calorieMinRange: [calories - t.calorieMinTolerance, calories + t.calorieMinTolerance],
    protein: proteinFor(t, level),
    proteinMin: t.proteinMin,
    carbs: plan.carbs,
    fiber: plan.fiber,
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
 * or hard cardio day gets hard-day calories, dumbbell and calisthenics travel days moderate, easy cardio
 * or rest easy. A day picked by hand on the Workout page wins.
 */
export function calorieReason(data: AppData, iso: string): CalorieReason {
  const t = getTargets(data)
  const info = getDayInfo(iso, data)
  const lv = dayLevel(data, iso)
  const calories = caloriesFor(t, lv.level)
  const plannedCalories = caloriesFor(t, lv.planned)
  const kind = `${DAY_LEVELS.find((l) => l.id === lv.level)!.label} day`
  const cardioPick = info.dayType === 'cardio' ? data.workouts[iso]?.aerobic?.chosenOption : undefined
  const session = cardioPick ? `${cardioPick} cardio` : info.label.split(' —')[0]
  let why: string | undefined
  if (lv.picked) why = `${kind}: picked on Workout`
  else if (info.swap) why = `${kind}: swapped ${info.swap.fromShort} for ${session}`
  else if (info.travel) why = `${kind}: travel day, ${session.replace(/^Travel /, '').toLowerCase()}`
  return { calories, plannedCalories, level: lv.level, picked: lv.picked, why }
}
