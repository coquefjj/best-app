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
