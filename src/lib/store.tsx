import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { EMPTY_DATA, type AppData, type HabitDayLog, type WorkoutDayLog } from '../types'

const STORAGE_KEY = 'best-app:v1'

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_DATA
    return migrate({ ...EMPTY_DATA, ...JSON.parse(raw) })
  } catch {
    return EMPTY_DATA
  }
}

/** Brings logs saved by older versions up to the current shape; safe to run on current data. */
function migrate(data: AppData): AppData {
  const workouts: Record<string, WorkoutDayLog> = {}
  for (const [date, w] of Object.entries(data.workouts ?? {})) {
    const exercises: WorkoutDayLog['exercises'] = {}
    for (const [id, ex] of Object.entries(w.exercises ?? {})) {
      exercises[id] = {
        ...ex,
        mode: ex.mode ?? 'reps',
        weighted: ex.weighted ?? true,
        sets: (ex.sets ?? []).map((s) => ({ ...s, seconds: s.seconds ?? null })),
      }
    }
    workouts[date] = { ...w, exercises }
  }
  const habits: Record<string, HabitDayLog> = {}
  for (const [date, h] of Object.entries(data.habits ?? {})) habits[date] = migrateHabits(h)
  return { ...data, workouts, habits }
}

/**
 * Until Sep 29 2026 reading, meditation and phone were fixed yes/no targets. Turn a ticked
 * "Reading 30 min" into 30 minutes and "Meditation 10 min" into 10, and carry
 * "Phone < 1 hour" over to its replacement, "No social media", so streaks keep their history.
 */
function migrateHabits(day: HabitDayLog): HabitDayLog {
  const { reading30, meditation10, phoneUnder1h, ...rest } = day as HabitDayLog & Record<string, unknown>
  const out: HabitDayLog = { ...rest }
  if (reading30 === true && out.readingMin == null) out.readingMin = 30
  if (meditation10 === true && out.meditationMin == null) out.meditationMin = 10
  if (phoneUnder1h === true && out.noSocialMedia == null) out.noSocialMedia = true
  return out
}

interface StoreContextValue {
  data: AppData
  setData: (updater: (prev: AppData) => AppData) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage full or unavailable; fail silently, data stays in memory for this session
    }
  }, [data])

  const setData = (updater: (prev: AppData) => AppData) => {
    setDataState((prev) => updater(prev))
  }

  return <StoreContext.Provider value={{ data, setData }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
