import type { HabitId } from './data/plan'

export interface SetLog {
  weight: number | null
  reps: number | null
  done: boolean
}

export interface ExerciseLog {
  chosenOption: string
  sets: SetLog[]
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

export type HabitDayLog = Partial<Record<HabitId, number | boolean>>

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
}

export const EMPTY_DATA: AppData = {
  workouts: {},
  food: {},
  savedMeals: [],
  habits: {},
  checkIns: [],
}
