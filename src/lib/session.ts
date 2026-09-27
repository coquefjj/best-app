import {
  WEEKLY_TEMPLATE,
  SESSIONS_BY_TYPE,
  isHardDay,
  NUTRITION_TARGETS,
  getPhase,
  getWeekNumber,
  isDeloadWeek,
  type DayType,
} from '../data/plan'
import { dayOfPlan, weekdayOf } from './date'

export interface DayInfo {
  iso: string
  dayNum: number
  inPlan: boolean
  dayType: DayType
  label: string
  weekNumber: number
  deload: boolean
  phaseName: string | undefined
  hasStrengthExercises: boolean
  nutrition: (typeof NUTRITION_TARGETS)['easy']
}

export function getDayInfo(iso: string): DayInfo {
  const dayNum = dayOfPlan(iso)
  const inPlan = dayNum >= 1 && dayNum <= 100
  const weekday = weekdayOf(iso)
  const tmpl = WEEKLY_TEMPLATE[weekday]
  const weekNumber = getWeekNumber(Math.max(dayNum, 1))
  const deload = isDeloadWeek(weekNumber)
  const phase = getPhase(Math.max(dayNum, 1))
  const hard = isHardDay(tmpl.dayType)

  return {
    iso,
    dayNum,
    inPlan,
    dayType: tmpl.dayType,
    label: tmpl.label,
    weekNumber,
    deload,
    phaseName: phase?.name,
    hasStrengthExercises: !!SESSIONS_BY_TYPE[tmpl.dayType],
    nutrition: hard ? NUTRITION_TARGETS.hard : NUTRITION_TARGETS.easy,
  }
}
