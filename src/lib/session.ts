import { TRAVEL_TEMPLATE, SWAP_REASONS, getWeekNumber, type DayType, type SwapReason } from '../data/plan'
import { activePlan, type DayMacros } from '../data/templates'
import type { AppData } from '../types'
import { dayOfPlan, weekdayOf } from './date'

export interface DayInfo {
  iso: string
  dayNum: number
  inPlan: boolean
  dayType: DayType
  label: string
  weekNumber: number
  deload: boolean
  /** The day is switched to the travel plan. */
  travel: boolean
  /** Set when the day was swapped to a softer session: what was planned and why. */
  swap?: { fromLabel: string; reason: SwapReason | null; reasonLabel: string | undefined }
  phaseName: string | undefined
  /** Hard days get the hard-day calorie target. */
  hard: boolean
  hasStrengthExercises: boolean
  nutrition: DayMacros
}

type TravelData = Pick<AppData, 'travelDays' | 'swaps'>

export function isTravelDay(data: TravelData | undefined, iso: string): boolean {
  return data?.travelDays?.[iso] != null
}

/**
 * The day's session in the active profile's plan; pass the app data so travel days and
 * swapped days show what was done.
 */
export function getDayInfo(iso: string, data?: TravelData): DayInfo {
  const plan = activePlan()
  const dayNum = dayOfPlan(iso)
  const inPlan = dayNum >= 1 && dayNum <= plan.lengthDays
  const weekday = weekdayOf(iso)
  const travel = plan.travel && isTravelDay(data, iso)
  let dayType = plan.week[weekday]
  if (travel) dayType = data?.travelDays?.[iso] ?? TRAVEL_TEMPLATE[weekday]
  // Travel days have their own session picker, so a swap only applies to regular days.
  const swapped = travel ? undefined : data?.swaps?.[iso]
  let swap: DayInfo['swap']
  if (swapped && swapped.to !== dayType && plan.sessions[swapped.to]) {
    swap = { fromLabel: plan.sessions[dayType].label, reason: swapped.reason, reasonLabel: SWAP_REASONS.find((r) => r.id === swapped.reason)?.label }
    dayType = swapped.to
  }
  const session = plan.sessions[dayType]
  const label = session.label
  const weekNumber = getWeekNumber(Math.max(dayNum, 1))
  const deload = plan.deloadWeeks.includes(weekNumber)
  const phase = plan.phases.find((p) => weekNumber >= p.weeks[0] && weekNumber <= p.weeks[1])
  const hard = session.hard

  return {
    iso,
    dayNum,
    inPlan,
    dayType,
    label,
    weekNumber,
    deload,
    travel,
    swap,
    phaseName: phase?.name,
    hard,
    hasStrengthExercises: !!session.exercises,
    nutrition: hard ? plan.nutrition.hard : plan.nutrition.easy,
  }
}
