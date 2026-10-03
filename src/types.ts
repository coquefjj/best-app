import { DEFAULT_HABITS } from './data/plan'

export interface SetLog {
  weight: number | null
  reps: number | null
  /** Used instead of reps when the exercise is logged by time. */
  seconds?: number | null
  done: boolean
}

export interface ExerciseLog {
  chosenOption: string
  sets: SetLog[]
  /** 'reps' when missing (logs saved before time-based sets existed). */
  mode?: 'reps' | 'time'
  /** Whether sets take a weight; true when missing. */
  weighted?: boolean
}

export interface AerobicLog {
  chosenOption: string
  durationMin: number | null
  distanceKm: number | null
  effort: 'easy' | 'moderate' | 'hard' | null
  /** Optional, typed in from a watch or machine. */
  caloriesBurned?: number | null
}

export interface WorkoutDayLog {
  mobilityDone: boolean
  exercises: Record<string, ExerciseLog>
  aerobic?: AerobicLog
  notes?: string
  /** Set by "Finish workout"; ISO timestamp of when it was finished. */
  completedAt?: string
}

export interface FoodEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealSlot: 'preWorkout' | 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner' | 'snack'
  /** Local time eaten as "HH:MM" (24 h), set when logged. Missing on food logged before Oct 1 2026. */
  time?: string
}

export interface FoodDayLog {
  entries: FoodEntry[]
}

export interface SavedMeal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealSlot: FoodEntry['mealSlot']
}

/** One day's recovery numbers and habit entries, keyed by field or habit id. */
export type HabitDayLog = Partial<Record<string, number | boolean>>

/** A habit on the Habits page; its daily entries live in `habits[date][id]`. */
export interface Habit {
  id: string
  label: string
  /** 'minutes' takes any time you did; 'boolean' is a yes/no tick. */
  type: 'minutes' | 'boolean'
}

export interface ProgressCheckIn {
  date: string
  waistCm: number | null
  notes: string
}

export interface AppData {
  /** Missing only on data saved before profiles existed, which is Fernando's. */
  profile?: Profile
  workouts: Record<string, WorkoutDayLog>
  food: Record<string, FoodDayLog>
  savedMeals: SavedMeal[]
  habits: Record<string, HabitDayLog>
  checkIns: ProgressCheckIn[]
  /** Habits you track, in order. Removing one keeps its old entries in `habits`. */
  habitList: Habit[]
  /** Targets and minimums changed on the Nutrition and Recovery pages; defaults fill the rest. */
  targets?: Partial<import('./lib/targets').Targets>
  /** Weeks switched to the travel plan (section 12), as the Monday ISO date starting each week. */
  travelWeeks?: string[]
  /** A travel day swapped to a different travel session, keyed by ISO date. */
  travelDays?: Record<string, import('./data/plan').DayType>
  /** A regular day swapped to a softer session, keyed by ISO date. Saved logs stay as they are. */
  swaps?: Record<string, SessionSwap>
}

/** Who the profile is and what onboarding set up. Profiles made before onboarding existed (Fernando's) have no about. */
export interface Profile {
  name: string
  about?: {
    age: number | null
    sex: 'male' | 'female' | null
    heightCm: number | null
    weightKg: number | null
    activity: 'light' | 'moderate' | 'very'
    goal: 'lose' | 'muscle' | 'hybrid' | 'health'
  }
  plan: import('./data/templates').PlanRef
  /** Targets onboarding set; changes on the Nutrition and Recovery pages go in `targets` on top. */
  baseTargets?: Partial<import('./lib/targets').Targets>
  /** Carbs and fat by easy and hard day, when onboarding set them. */
  macros?: { easy: { carbs: number; fat: number }; hard: { carbs: number; fat: number } }
  /** false hides sleep score and resting heart rate (no watch to read them from). */
  watch?: boolean
}

export interface SessionSwap {
  to: import('./data/plan').DayType
  reason: import('./data/plan').SwapReason | null
}

export const EMPTY_DATA: AppData = {
  workouts: {},
  food: {},
  savedMeals: [],
  habits: {},
  checkIns: [],
  habitList: DEFAULT_HABITS,
}
