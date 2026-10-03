import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_HABITS } from '../data/plan'
import { FERNANDO_PLAN, resolvePlan, setActivePlan } from '../data/templates'
import { todayISO } from './date'
import { EMPTY_DATA, type AppData, type HabitDayLog, type WorkoutDayLog } from '../types'

/** Everything before profiles existed (Sep 27 to Oct 3 2026) was saved here; it is kept as a backup. */
const LEGACY_KEY = 'best-app:v1'
const INDEX_KEY = 'quest:profiles'
const profileKey = (id: string) => `quest:profile:${id}`

export interface ProfileIndex {
  active: string | null
  profiles: { id: string; name: string }[]
}

function readJSON<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : null
}

function loadIndex(): ProfileIndex {
  try {
    const index = readJSON<ProfileIndex>(INDEX_KEY)
    if (index?.profiles.length) return index
    // First launch with profiles: the data saved before becomes Fernando's profile. Write the
    // profile before the index, so a failed write leaves the next launch to try again.
    const legacy = readJSON<AppData>(LEGACY_KEY)
    if (legacy) {
      const data = migrate({ ...EMPTY_DATA, ...legacy })
      localStorage.setItem(profileKey('fernando'), JSON.stringify(data))
      const created: ProfileIndex = { active: 'fernando', profiles: [{ id: 'fernando', name: data.profile!.name }] }
      localStorage.setItem(INDEX_KEY, JSON.stringify(created))
      return created
    }
  } catch {
    // storage unavailable or unreadable; start with no profiles and leave what's stored alone
  }
  return { active: null, profiles: [] }
}

function loadProfile(id: string | null): AppData | null {
  if (!id) return null
  try {
    const data = readJSON<AppData>(profileKey(id))
    return data ? migrate({ ...EMPTY_DATA, ...data }) : null
  } catch {
    return null
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
  // Phone time was one of the starting habits until Fernando dropped it on Sep 29 2026.
  const habitList = data.habitList ?? DEFAULT_HABITS
  // Data from before profiles is Fernando's, on his 100-day plan.
  const profile = data.profile ?? { name: 'Fernando', plan: FERNANDO_PLAN }
  return { ...data, workouts, habits, habitList, profile }
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
  /** The profile on screen; empty data when there are no profiles yet. */
  data: AppData
  setData: (updater: (prev: AppData) => AppData) => void
  index: ProfileIndex
  hasProfile: boolean
  switchProfile: (id: string) => void
  /** Saves a new profile and switches to it. */
  addProfile: (data: AppData) => void
  removeProfile: (id: string) => void
  /** Downloads the profile on screen as a file. */
  exportProfile: () => void
  /** Adds a profile from an exported file and switches to it; throws if the file isn't one. */
  importProfile: (text: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

const newId = (name: string) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile'}-${Date.now().toString(36)}`

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    const index = loadIndex()
    return { index, data: loadProfile(index.active) }
  })
  const { index, data } = state

  useEffect(() => {
    try {
      // An empty index is never saved, so data from before profiles is always picked up.
      if (index.profiles.length) localStorage.setItem(INDEX_KEY, JSON.stringify(index))
      else localStorage.removeItem(INDEX_KEY)
      if (index.active && data) localStorage.setItem(profileKey(index.active), JSON.stringify(data))
    } catch {
      // storage full or unavailable; fail silently, data stays in memory for this session
    }
  }, [index, data])

  // Date and session helpers read the plan of the profile on screen.
  const planRef = data?.profile?.plan
  const plan = useMemo(() => resolvePlan(planRef), [planRef])
  setActivePlan(plan)

  const setData = (updater: (prev: AppData) => AppData) => {
    setState((prev) => (prev.data ? { ...prev, data: updater(prev.data) } : prev))
  }

  const switchProfile = (id: string) => {
    setState((prev) => {
      const next = loadProfile(id)
      return next ? { index: { ...prev.index, active: id }, data: next } : prev
    })
  }

  const addProfile = (newData: AppData) => {
    const name = newData.profile?.name ?? 'New profile'
    const id = newId(name)
    setState((prev) => ({ index: { active: id, profiles: [...prev.index.profiles, { id, name }] }, data: migrate({ ...EMPTY_DATA, ...newData }) }))
  }

  const removeProfile = (id: string) => {
    try {
      localStorage.removeItem(profileKey(id))
    } catch {
      // nothing stored to remove
    }
    setState((prev) => {
      const profiles = prev.index.profiles.filter((p) => p.id !== id)
      if (prev.index.active !== id) return { ...prev, index: { ...prev.index, profiles } }
      const active = profiles[0]?.id ?? null
      return { index: { active, profiles }, data: loadProfile(active) }
    })
  }

  const exportProfile = () => {
    if (!data) return
    const name = data.profile?.name ?? 'profile'
    const blob = new Blob([JSON.stringify({ quest: 1, exportedAt: new Date().toISOString(), data }, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `quest-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${todayISO()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const importProfile = (text: string) => {
    const parsed = JSON.parse(text) as { quest?: number; data?: AppData } & Partial<AppData>
    // Accepts an exported file, or the raw data saved before profiles existed.
    const imported = (parsed.quest ? parsed.data : parsed) as AppData | undefined
    if (!imported || typeof imported !== 'object' || !('workouts' in imported)) throw new Error('Not a Quest profile file')
    addProfile(imported)
  }

  return (
    <StoreContext.Provider
      value={{ data: data ?? EMPTY_DATA, setData, index, hasProfile: !!data, switchProfile, addProfile, removeProfile, exportProfile, importProfile }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
