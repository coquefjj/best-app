import { PLAN_START_DATE, PLAN_LENGTH_DAYS } from '../data/plan'

export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Day-of-plan for a given ISO date, 1-indexed. Can be < 1 (before start) or > length (after end). */
export function dayOfPlan(iso: string): number {
  const start = new Date(PLAN_START_DATE + 'T00:00:00')
  const d = new Date(iso + 'T00:00:00')
  const diffMs = d.getTime() - start.getTime()
  return Math.floor(diffMs / 86400000) + 1
}

export function isWithinPlan(iso: string): boolean {
  const d = dayOfPlan(iso)
  return d >= 1 && d <= PLAN_LENGTH_DAYS
}

export function weekdayOf(iso: string): number {
  return new Date(iso + 'T00:00:00').getDay()
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function formatHuman(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Start-of-week (Monday) ISO date for a given ISO date. */
export function startOfWeek(iso: string): string {
  const wd = weekdayOf(iso) // 0=Sun
  const back = wd === 0 ? 6 : wd - 1
  return addDays(iso, -back)
}

/** Local clock time (e.g. "7:42 PM") for an ISO timestamp. */
export function formatClock(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** Seconds as "m:ss". */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Parses "m:ss" (or a plain number of seconds) into seconds; null if blank or invalid. */
export function parseDuration(text: string): number | null {
  const t = text.trim()
  if (!t) return null
  const parts = t.split(/[:.]/)
  if (parts.length > 2 || parts.some((p) => !/^\d+$/.test(p))) return null
  if (parts.length === 1) return Number(parts[0])
  const [m, s] = parts.map(Number)
  if (s >= 60) return null
  return m * 60 + s
}
