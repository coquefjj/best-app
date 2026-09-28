import type { AppData } from '../types'
import { getDayInfo } from './session'

/** Whether the day's training was done, using the same rules as weekly adherence. */
export function isOnPlan(data: AppData, iso: string): boolean {
  const di = getDayInfo(iso)
  const w = data.workouts[iso]
  if (w?.completedAt) return true
  if (di.dayType === 'rest') return !!w?.mobilityDone
  if (di.hasStrengthExercises) return !!w && Object.keys(w.exercises).length > 0
  return !!w?.aerobic?.chosenOption
}
