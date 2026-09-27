import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { EMPTY_DATA, type AppData } from '../types'

const STORAGE_KEY = 'best-app:v1'

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_DATA
    return { ...EMPTY_DATA, ...JSON.parse(raw) }
  } catch {
    return EMPTY_DATA
  }
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
