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
  mealSlot: 'breakfast' | 'lunch' | 'dinner' | 'snack'
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
  workouts: Record<string, WorkoutDayLog>
  food: Record<string, FoodDayLog>
  savedMeals: SavedMeal[]
  habits: Record<string, HabitDayLog>
  checkIns: ProgressCheckIn[]
  /** Habits you track, in order. Removing one keeps its old entries in `habits`. */
  habitList: Habit[]
}

export const EMPTY_DATA: AppData = {
  workouts: {},
  food: {},
  savedMeals: [],
  habits: {},
  checkIns: [],
  habitList: DEFAULT_HABITS,
}
