import type { AppData } from '../types'

export type MuscleGroupId = 'arms' | 'back' | 'chest' | 'legs' | 'glutes'

/** Muscle groups as colored on the muscle map (public/img/muscle-map.webp). */
export const MUSCLE_GROUPS: { id: MuscleGroupId; name: string; color: string; lifts: string[] }[] = [
  { id: 'arms', name: 'Arms & shoulders', color: '#e21919', lifts: ['Overhead press', 'Lateral raises', 'Face pulls', 'Biceps + triceps'] },
  { id: 'back', name: 'Back', color: '#d94e92', lifts: ['Pull-up', 'Lat pulldown', 'Chin-ups', 'Row (cable/DB)'] },
  { id: 'chest', name: 'Chest', color: '#3ea839', lifts: ['DB bench press', 'Incline DB press', 'Push-up progression'] },
  { id: 'legs', name: 'Legs', color: '#0981d6', lifts: ['Trap-bar deadlift', 'Bulgarian split squat', 'Reverse lunge', 'Eccentric machine leg curl', 'Nordic hamstring curl'] },
  { id: 'glutes', name: 'Glutes', color: '#8164b7', lifts: ['Hip thrust', 'Romanian deadlift', 'Single-leg RDL'] },
]

export interface LiftSession {
  date: string
  /** Heaviest weight lifted that session, in kg; null when only reps were logged. */
  weight: number | null
  /** Most reps at that weight (or most reps overall for bodyweight sessions). */
  reps: number
}

export interface LiftHistory {
  name: string
  /** 'kg' when any session carried weight; 'reps' for bodyweight-only lifts. */
  unit: 'kg' | 'reps'
  /** Sessions in date order, only those that count for the unit. */
  sessions: LiftSession[]
}

/** The session's value on the lift's chart. */
export const sessionValue = (s: LiftSession, unit: LiftHistory['unit']) => (unit === 'kg' ? s.weight ?? 0 : s.reps)

/** Best set per session for every lift in the muscle groups, from the workout log. */
export function liftHistories(data: AppData): Map<string, LiftHistory> {
  const byLift = new Map<string, LiftSession[]>()
  const dates = Object.keys(data.workouts).sort()
  for (const date of dates) {
    for (const ex of Object.values(data.workouts[date].exercises)) {
      if (ex.mode === 'time') continue
      // A set counts once it was ticked done or has reps typed in.
      const sets = ex.sets.filter((s) => (s.reps ?? 0) > 0 || (s.done && (s.weight ?? 0) > 0))
      if (!sets.length) continue
      const weighted = ex.weighted !== false ? sets.filter((s) => (s.weight ?? 0) > 0) : []
      let session: LiftSession
      if (weighted.length) {
        const top = Math.max(...weighted.map((s) => s.weight!))
        const reps = Math.max(0, ...weighted.filter((s) => s.weight === top).map((s) => s.reps ?? 0))
        session = { date, weight: top, reps }
      } else {
        session = { date, weight: null, reps: Math.max(...sets.map((s) => s.reps ?? 0)) }
      }
      const list = byLift.get(ex.chosenOption) ?? []
      // The same lift can appear twice in a day (two slots); keep the better one.
      const same = list.find((s) => s.date === date)
      if (!same) list.push(session)
      else if ((session.weight ?? 0) > (same.weight ?? 0) || (session.weight === same.weight && session.reps > same.reps)) {
        Object.assign(same, session)
      }
      byLift.set(ex.chosenOption, list)
    }
  }
  const out = new Map<string, LiftHistory>()
  for (const [name, sessions] of byLift) {
    const unit = sessions.some((s) => s.weight != null) ? 'kg' : 'reps'
    out.set(name, { name, unit, sessions: unit === 'kg' ? sessions.filter((s) => s.weight != null) : sessions })
  }
  return out
}

/** Change from the first session to the best one so far. */
export function liftGain(h: LiftHistory): number {
  const values = h.sessions.map((s) => sessionValue(s, h.unit))
  return values.length ? Math.max(...values) - values[0] : 0
}

/** The best session so far: heaviest weight, then most reps. */
export function bestSession(h: LiftHistory): LiftSession | undefined {
  return h.sessions.reduce<LiftSession | undefined>((best, s) => {
    if (!best) return s
    const a = sessionValue(s, h.unit)
    const b = sessionValue(best, h.unit)
    return a > b || (a === b && s.reps > best.reps) ? s : best
  }, undefined)
}

export const formatKg = (kg: number) => `${+kg.toFixed(2)} kg`
