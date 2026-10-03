// Training plans a profile can follow. A profile stores a small PlanRef (which template,
// when it starts, how long it runs); resolvePlan turns that into the full plan the app reads.
import {
  WEEKLY_TEMPLATE,
  SESSIONS_BY_TYPE,
  PHASES,
  NUTRITION_TARGETS,
  AEROBIC_EASY_OPTIONS,
  HARD_CONDITIONING_OPTIONS,
  LONG_ENDURANCE_OPTIONS,
  TRAVEL_SESSIONS,
  TRAVEL_EASY_RUN_OPTIONS,
  TRAVEL_QUALITY_RUN_OPTIONS,
  TRAVEL_LONG_RUN_OPTIONS,
  PLAN_START_DATE,
  PLAN_LENGTH_DAYS,
  type DayType,
  type Phase,
  type PlanExercise,
} from './plan'
import type { MuscleGroupId } from '../lib/strength'

export interface PlanSession {
  label: string
  /** Hard days get the hard-day calorie target. */
  hard: boolean
  exercises?: PlanExercise[]
  /** Cardio sessions: the menu to pick today's session from. */
  modalityOptions?: string[]
}

export interface DayMacros {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface PlanConfig {
  templateId: TemplateId
  startDate: string
  lengthDays: number
  /** Session for each weekday, JS getDay() numbering (0 = Sunday). */
  week: Record<number, DayType>
  sessions: Record<DayType, PlanSession>
  phases: Phase[]
  deloadWeeks: number[]
  /** Whether the Travel week button (Fernando's section 12 sessions) is offered. */
  travel: boolean
  /** Softer sessions the Swap button offers. */
  swapTo: DayType[]
  /** The plan's own nutrition by easy and hard day; a profile's targets override calories and protein. */
  nutrition: { easy: DayMacros; hard: DayMacros }
  /** Lifts listed on the muscle map, when they differ from Fernando's. */
  muscleLifts?: Record<MuscleGroupId, string[]>
}

export type TemplateId = 'hybrid100' | 'split3'

export interface PlanRef {
  templateId: TemplateId
  startDate: string
  lengthDays: number
  /** split3 only: weekdays for Day 1, Day 2 and Day 3. */
  trainingDays?: number[]
}

export const TEMPLATES: { id: TemplateId; name: string; blurb: string }[] = [
  { id: 'hybrid100', name: 'Hybrid athlete', blurb: "Fernando's plan: 3 strength days, easy aerobic, hard conditioning and a long session every week, in 4 phases with deloads." },
  { id: 'split3', name: '3-day gym split', blurb: "Mateo's plan: chest, arms and back twice a week, legs, glutes and shoulders once, rest in between." },
]

const REST: PlanSession = { label: 'Rest + long flexibility session', hard: false }

function hybrid100(ref: PlanRef): PlanConfig {
  const sessions: Record<DayType, PlanSession> = {}
  for (const d of Object.values(WEEKLY_TEMPLATE)) {
    sessions[d.dayType] = { label: d.label, hard: d.dayType !== 'aerobicEasy' && d.dayType !== 'rest', exercises: SESSIONS_BY_TYPE[d.dayType] }
  }
  sessions.aerobicEasy.modalityOptions = AEROBIC_EASY_OPTIONS
  sessions.hardConditioning.modalityOptions = HARD_CONDITIONING_OPTIONS
  sessions.longEndurance.modalityOptions = LONG_ENDURANCE_OPTIONS
  for (const t of TRAVEL_SESSIONS) {
    if (t.dayType === 'rest') continue
    sessions[t.dayType] = { label: t.label, hard: t.dayType !== 'travelEasyRun', exercises: SESSIONS_BY_TYPE[t.dayType] }
  }
  sessions.travelEasyRun.modalityOptions = TRAVEL_EASY_RUN_OPTIONS
  sessions.travelQualityRun.modalityOptions = TRAVEL_QUALITY_RUN_OPTIONS
  sessions.travelLongRun.modalityOptions = TRAVEL_LONG_RUN_OPTIONS
  const week: Record<number, DayType> = {}
  for (const [wd, d] of Object.entries(WEEKLY_TEMPLATE)) week[Number(wd)] = d.dayType
  return {
    templateId: 'hybrid100',
    startDate: ref.startDate,
    lengthDays: ref.lengthDays,
    week,
    sessions,
    phases: PHASES,
    deloadWeeks: [7, 14],
    travel: true,
    swapTo: ['aerobicEasy', 'rest'],
    nutrition: {
      easy: { calories: NUTRITION_TARGETS.easy.calories, protein: NUTRITION_TARGETS.easy.protein, fat: NUTRITION_TARGETS.easy.fat, carbs: NUTRITION_TARGETS.easy.carbs },
      hard: { calories: NUTRITION_TARGETS.hard.calories, protein: NUTRITION_TARGETS.hard.protein, fat: NUTRITION_TARGETS.hard.fat, carbs: NUTRITION_TARGETS.hard.carbs },
    },
  }
}

/** One lift of the 3-day split; `es` is the Spanish name, shown under the English one. */
const lift = (id: string, name: string, es: string, sets: number, reps: string, startKg: number | null): PlanExercise => ({
  id,
  options: [{ name, cue: '' }],
  target: { sets: String(sets), reps },
  note: es,
  startKg,
  weighted: startKg != null,
})

// Mateo's plan as Fernando sent it on Oct 3 2026. Reps for the cable crunch and pull-ups
// weren't given, so they start at 3 x 15 and 3 x AMRAP.
const SPLIT_DAY_1: PlanExercise[] = [
  lift('s-incline-db-press', 'Incline Dumbbell Press', 'Press inclinado con mancuernas', 3, '12', 20),
  lift('s-low-high-fly', 'Low-to-High Cable Fly', 'Cruce de poleas de abajo hacia arriba', 3, '10', 15),
  lift('s-incline-db-curl', 'Incline Dumbbell Curl', 'Curl inclinado con mancuernas', 3, '12', 12.5),
  lift('s-cable-curl', 'Cable Curl', 'Curl de bíceps en polea baja', 3, '12', 35),
  lift('s-rope-pushdown', 'Rope Pushdown', 'Extensión de tríceps en polea con cuerda', 3, '10', 40),
  lift('s-overhead-cable-ext', 'Overhead Cable Triceps Extension', 'Extensión de tríceps sobre la cabeza en polea, sin agarre', 3, '10', 15),
  lift('s-lat-pulldown', 'Lat Pulldown', 'Jalón al pecho', 3, '12', 55),
  lift('s-seated-row', 'Seated Cable Row', 'Remo sentado en polea baja', 3, '12', 45),
  lift('s-cable-crunch', 'Kneeling Cable Crunch', 'Crunch en polea alta de rodillas', 3, '15', null),
]

const SPLIT_DAY_2: PlanExercise[] = [
  lift('s-leg-extension', 'Leg Extension', 'Extensión de cuádriceps en máquina', 3, '12', 55),
  lift('s-leg-curl', 'Leg Curl', 'Curl femoral en máquina', 3, '10', 35),
  lift('s-sumo-squat', 'Sumo Squat', 'Sentadilla sumo con mancuerna', 3, '12', 15),
  lift('s-calf-raise', 'Calf Raise', 'Elevación de talones', 3, '15', null),
  lift('s-hip-thrust', 'Barbell Hip Thrust', 'Hip thrust con barra', 3, '12', 20),
  lift('s-overhead-press', 'Overhead Press', 'Press militar', 3, '12', 15),
  lift('s-cable-lateral', 'Cable Lateral Raise', 'Elevación lateral en polea', 3, '10', 10),
  lift('s-face-pull', 'Face Pull', 'Face pull con cuerda', 3, '8', 10),
]

const SPLIT_DAY_3: PlanExercise[] = [
  lift('s-cable-crossover', 'Cable Crossover', 'Cruce de poleas', 3, '10', 25),
  lift('s-bench-press', 'Barbell Bench Press', 'Press de banca con barra', 3, '8', 22.5),
  lift('s-preacher-curl', 'Preacher Curl', 'Curl predicador', 3, '10', 12.5),
  lift('s-hammer-curl', 'Standing Hammer Curl', 'Curl martillo de pie', 3, '10', 12.5),
  lift('s-rope-pushdown', 'Rope Pushdown', 'Extensión de tríceps en polea con cuerda', 3, '12', 40),
  lift('s-overhead-rope-ext', 'Overhead Rope Extension', 'Extensión de tríceps sobre la cabeza con cuerda', 3, '10', 25),
  lift('s-db-pullover', 'Dumbbell Pullover', 'Pullover con mancuerna', 3, '10', 15),
  lift('s-pull-ups', 'Pull-ups', 'Dominadas', 3, 'AMRAP', null),
  lift('s-cable-crunch', 'Kneeling Cable Crunch', 'Crunch en polea alta de rodillas', 3, '15', null),
]

export const SPLIT_DEFAULT_DAYS = [1, 3, 5]

function split3(ref: PlanRef): PlanConfig {
  const days = ref.trainingDays?.length === 3 ? ref.trainingDays : SPLIT_DEFAULT_DAYS
  const week: Record<number, DayType> = { 0: 'rest', 1: 'rest', 2: 'rest', 3: 'rest', 4: 'rest', 5: 'rest', 6: 'rest' }
  ;['splitDay1', 'splitDay2', 'splitDay3'].forEach((s, i) => (week[days[i]] = s))
  return {
    templateId: 'split3',
    startDate: ref.startDate,
    lengthDays: ref.lengthDays,
    week,
    sessions: {
      splitDay1: { label: 'Day 1 — Chest, biceps, triceps, back', hard: true, exercises: SPLIT_DAY_1 },
      splitDay2: { label: 'Day 2 — Legs, glutes, shoulders', hard: true, exercises: SPLIT_DAY_2 },
      splitDay3: { label: 'Day 3 — Chest, biceps, triceps, back', hard: true, exercises: SPLIT_DAY_3 },
      // Not on the week; offered by Swap.
      aerobicEasy: { label: 'Easy aerobic (Zone 2)', hard: false, modalityOptions: AEROBIC_EASY_OPTIONS },
      rest: REST,
    },
    phases: [],
    deloadWeeks: [],
    travel: false,
    swapTo: ['aerobicEasy', 'rest'],
    nutrition: {
      easy: { calories: 2500, protein: 155, fat: 80, carbs: 290 },
      hard: { calories: 2850, protein: 155, fat: 80, carbs: 375 },
    },
    muscleLifts: {
      arms: ['Overhead Press', 'Cable Lateral Raise', 'Face Pull', 'Incline Dumbbell Curl', 'Cable Curl', 'Preacher Curl', 'Standing Hammer Curl', 'Rope Pushdown', 'Overhead Cable Triceps Extension', 'Overhead Rope Extension'],
      back: ['Lat Pulldown', 'Seated Cable Row', 'Pull-ups', 'Dumbbell Pullover'],
      chest: ['Incline Dumbbell Press', 'Barbell Bench Press', 'Low-to-High Cable Fly', 'Cable Crossover'],
      legs: ['Leg Extension', 'Leg Curl', 'Sumo Squat', 'Calf Raise'],
      glutes: ['Barbell Hip Thrust'],
    },
  }
}

/** Fernando's plan as it was before profiles existed. */
export const FERNANDO_PLAN: PlanRef = { templateId: 'hybrid100', startDate: PLAN_START_DATE, lengthDays: PLAN_LENGTH_DAYS }

export function resolvePlan(ref: PlanRef | undefined): PlanConfig {
  const r = ref ?? FERNANDO_PLAN
  return r.templateId === 'split3' ? split3(r) : hybrid100(r)
}

// The plan of the profile on screen. The store sets it whenever the profile's data changes,
// so date and session helpers that only take a date still follow the right plan.
let active: PlanConfig = resolvePlan(FERNANDO_PLAN)

export function setActivePlan(plan: PlanConfig) {
  active = plan
}

export function activePlan(): PlanConfig {
  return active
}
