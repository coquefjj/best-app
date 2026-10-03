import {
  WEEKLY_TEMPLATE,
  TRAVEL_TEMPLATE,
  TRAVEL_SESSIONS,
  SESSIONS_BY_TYPE,
  isHardDay,
  NUTRITION_TARGETS,
  getPhase,
  getWeekNumber,
  isDeloadWeek,
  type DayType,
} from '../data/plan'
import type { AppData } from '../types'
import { dayOfPlan, weekdayOf, startOfWeek } from './date'

export interface DayInfo {
  iso: string
  dayNum: number
  inPlan: boolean
  dayType: DayType
  label: string
  weekNumber: number
  deload: boolean
  /** The day falls in a week switched to the travel plan. */
  travel: boolean
  phaseName: string | undefined
  hasStrengthExercises: boolean
  nutrition: (typeof NUTRITION_TARGETS)['easy']
}

type TravelData = Pick<AppData, 'travelWeeks' | 'travelDays'>

export function isTravelWeek(data: TravelData | undefined, iso: string): boolean {
  return !!data?.travelWeeks?.includes(startOfWeek(iso))
}

/** The day's session; pass the app data so travel weeks swap in the travel plan. */
export function getDayInfo(iso: string, data?: TravelData): DayInfo {
  const dayNum = dayOfPlan(iso)
  const inPlan = dayNum >= 1 && dayNum <= 100
  const weekday = weekdayOf(iso)
  const travel = isTravelWeek(data, iso)
  let dayType = WEEKLY_TEMPLATE[weekday].dayType
  let label = WEEKLY_TEMPLATE[weekday].label
  if (travel) {
    dayType = data?.travelDays?.[iso] ?? TRAVEL_TEMPLATE[weekday]
    label = TRAVEL_SESSIONS.find((s) => s.dayType === dayType)!.label
  }
  const weekNumber = getWeekNumber(Math.max(dayNum, 1))
  const deload = isDeloadWeek(weekNumber)
  const phase = getPhase(Math.max(dayNum, 1))
  const hard = isHardDay(dayType)

  return {
    iso,
    dayNum,
    inPlan,
    dayType,
    label,
    weekNumber,
    deload,
    travel,
    phaseName: phase?.name,
    hasStrengthExercises: !!SESSIONS_BY_TYPE[dayType],
    nutrition: hard ? NUTRITION_TARGETS.hard : NUTRITION_TARGETS.easy,
  }
}
