// The 100-day hybrid athletic plan, encoded as data.
// Source: 100-day-hybrid-athletic-plan.md (uploaded by Fernando).

export type DayType = 'strengthA' | 'aerobicEasy' | 'strengthB' | 'hardConditioning' | 'strengthC' | 'longEndurance' | 'rest'

export const PLAN_START_DATE = '2026-09-13' // Day 1
export const PLAN_LENGTH_DAYS = 100

export interface ExerciseSet {
  /** e.g. "3-4" or "3" */
  sets: string
  /** e.g. "6-8" or "AMRAP" or "20-30s" */
  reps: string
}

export interface ExerciseOption {
  name: string
  cue: string
}

export interface PlanExercise {
  id: string
  /** One or more interchangeable options, e.g. "RDL or single-leg RDL" */
  options: ExerciseOption[]
  target: ExerciseSet
  note?: string
  optional?: boolean
}

export const WEEKLY_TEMPLATE: Record<number, { dayType: DayType; label: string }> = {
  // JS getDay(): 0 = Sunday
  1: { dayType: 'strengthA', label: 'Strength A — Lower / Speed & Stability' },
  2: { dayType: 'aerobicEasy', label: 'Easy aerobic (Zone 2)' },
  3: { dayType: 'strengthB', label: 'Strength B — Upper (hypertrophy)' },
  4: { dayType: 'hardConditioning', label: 'Hard conditioning' },
  5: { dayType: 'strengthC', label: 'Strength C — Full body (upper bias)' },
  6: { dayType: 'longEndurance', label: 'Long endurance' },
  0: { dayType: 'rest', label: 'Rest + long flexibility session' },
}

export const AEROBIC_EASY_OPTIONS = [
  'Easy swim',
  'Easy outdoor ride',
  'Easy indoor spin',
  'Easy indoor row',
  'Easy trail jog',
]

export const HARD_CONDITIONING_OPTIONS = [
  'Hill repeats (6-10 x 60-90s hard uphill, jog down)',
  'Tempo run (20-30 min comfortably hard)',
  'Row intervals (6 x 500m hard / 90s easy)',
  'Bike intervals (5-6 x 3min hard / 3min easy)',
  'HYROX class',
]

export const LONG_ENDURANCE_OPTIONS = [
  'Long trail run',
  'Long ride',
]

export const STRENGTH_A: PlanExercise[] = [
  {
    id: 'a1',
    options: [{ name: 'Romanian deadlift', cue: 'Hinge, soft knees, bar close to legs' }, { name: 'Single-leg RDL', cue: 'Hinge on one leg, hips square' }],
    target: { sets: '3-4', reps: '6-8' },
    note: 'Hamstrings/glutes',
  },
  {
    id: 'a2',
    options: [{ name: 'Nordic hamstring curl', cue: 'Lower slow, control the fall' }, { name: 'Eccentric machine leg curl', cue: 'Slow lowering phase' }],
    target: { sets: '3', reps: '4-6' },
    note: 'Top exercise for hamstring strength & injury prevention',
  },
  {
    id: 'a3',
    options: [{ name: 'Hip thrust', cue: 'Drive hips up, squeeze glutes at top' }],
    target: { sets: '3', reps: '8-10' },
    note: 'Glute/hamstring hip-extension power = speed',
  },
  {
    id: 'a4',
    options: [{ name: 'Reverse lunge', cue: 'Step back, knee to floor' }, { name: 'Bulgarian split squat', cue: 'Rear foot elevated, upright torso' }],
    target: { sets: '2', reps: '8/leg' },
    note: 'Single-leg control, moderate',
  },
  {
    id: 'a5-copenhagen',
    options: [{ name: 'Copenhagen plank', cue: 'Side plank, top leg on bench' }, { name: 'Adductor squeeze', cue: 'Squeeze ball between knees' }],
    target: { sets: '3', reps: '20-30s/side' },
    note: 'Stability circuit — adductors',
  },
  {
    id: 'a5-lateral',
    options: [{ name: 'Banded lateral walk', cue: 'Stay low, tension on band' }, { name: 'Side-lying abduction', cue: 'Lift top leg, hips stacked' }],
    target: { sets: '3', reps: '12-15/side' },
    note: 'Stability circuit — abductors/glute med',
  },
  {
    id: 'a5-tib',
    options: [{ name: 'Tibialis raise', cue: 'Lean on wall, lift toes' }],
    target: { sets: '3', reps: '15-20' },
    note: 'Stability circuit — dorsiflexors (downhill & shin-splint protection)',
  },
  {
    id: 'a6',
    options: [{ name: 'Hanging knee raise', cue: 'Curl knees to chest, no swing' }, { name: 'Plank', cue: 'Straight line, brace core' }],
    target: { sets: '3', reps: 'to form' },
    note: 'Core',
  },
  {
    id: 'a7-calf',
    options: [{ name: 'Single-leg calf raise', cue: 'Full range, controlled' }],
    target: { sets: '2', reps: '12-15' },
    note: 'Optional cosmetic maintenance, ~2x/week',
    optional: true,
  },
]

export const STRENGTH_B: PlanExercise[] = [
  {
    id: 'b1',
    options: [{ name: 'DB bench press', cue: 'Elbows ~45°, full range' }, { name: 'Push-up progression', cue: 'Body straight, chest to floor' }],
    target: { sets: '4', reps: '8-10' },
  },
  {
    id: 'b2',
    options: [{ name: 'Pull-up', cue: 'Full hang to chin over bar' }, { name: 'Lat pulldown', cue: 'Pull to upper chest' }],
    target: { sets: '4', reps: '8-10' },
  },
  {
    id: 'b3',
    options: [{ name: 'Overhead press', cue: 'Brace core, press straight up' }],
    target: { sets: '3', reps: '8-10' },
  },
  {
    id: 'b4',
    options: [{ name: 'Row (cable/DB)', cue: 'Squeeze shoulder blades' }],
    target: { sets: '3', reps: '10-12' },
  },
  {
    id: 'b5',
    options: [{ name: 'Lateral raises', cue: 'Light weight, lead with elbows' }],
    target: { sets: '3', reps: '12-15' },
    note: 'The V-taper',
  },
  {
    id: 'b6',
    options: [{ name: 'Biceps + triceps', cue: 'Any accessory pair' }],
    target: { sets: '2-3', reps: '12 each' },
  },
]

export const STRENGTH_C: PlanExercise[] = [
  {
    id: 'c1',
    options: [{ name: 'Trap-bar deadlift', cue: 'Moderate load, drive through floor' }, { name: 'Light hinge', cue: 'Any light hip-hinge variant' }],
    target: { sets: '3', reps: '6' },
    note: 'Moderate',
  },
  {
    id: 'c2',
    options: [{ name: 'Incline DB press', cue: '30-45° bench angle' }],
    target: { sets: '3', reps: '10' },
  },
  {
    id: 'c3',
    options: [{ name: 'Chin-ups', cue: 'Underhand grip, full range' }],
    target: { sets: '3', reps: 'AMRAP' },
  },
  {
    id: 'c4',
    options: [{ name: 'Single-leg RDL', cue: 'Hinge on one leg' }, { name: 'Reverse lunge', cue: 'Step back, knee to floor' }],
    target: { sets: '2', reps: '8/leg' },
    note: 'Hamstring/glute + single-leg control, light',
  },
  {
    id: 'c5',
    options: [{ name: 'Face pulls', cue: 'Pull to face, elbows high' }],
    target: { sets: '3', reps: '15' },
  },
  {
    id: 'c6',
    options: [{ name: 'Dead bug', cue: 'Opposite arm/leg, low back flat' }, { name: 'Side plank', cue: 'Hips stacked, straight line' }, { name: 'Pallof press', cue: 'Anti-rotation, press straight out' }],
    target: { sets: '3', reps: 'rounds' },
    note: 'Core circuit',
  },
]

export const SESSIONS_BY_TYPE: Partial<Record<DayType, PlanExercise[]>> = {
  strengthA: STRENGTH_A,
  strengthB: STRENGTH_B,
  strengthC: STRENGTH_C,
}

export const MOBILITY_DAILY = [
  'Hip flexor stretch 45s/side',
  '90/90 hips 8/side',
  'Wall ankle rocks 10/side',
  'Thoracic rotations 8/side',
  'Hamstring/calf 45s each',
]

export interface Phase {
  name: string
  weeks: [number, number]
  isDeload: boolean
  note: string
}

export const PHASES: Phase[] = [
  { name: 'Phase 1 — Foundation', weeks: [1, 3], isDeload: false, note: 'Technique, consistency, habit. Lock in the protein target first.' },
  { name: 'Phase 2 — Build', weeks: [4, 7], isDeload: false, note: 'Progressive overload. Deload week 7.' },
  { name: 'Phase 3 — Intensify', weeks: [8, 11], isDeload: false, note: 'Heaviest compound work. Hold aerobic volume steady.' },
  { name: 'Phase 4 — Sharpen & Reveal', weeks: [12, 14], isDeload: false, note: 'Consolidate, prioritize sleep. Deload + test week 14.' },
]

export function getWeekNumber(dayOfPlan: number): number {
  return Math.ceil(dayOfPlan / 7)
}

export function isDeloadWeek(week: number): boolean {
  return week === 7 || week === 14
}

export function getPhase(dayOfPlan: number): Phase | undefined {
  const week = getWeekNumber(dayOfPlan)
  return PHASES.find((p) => week >= p.weeks[0] && week <= p.weeks[1])
}

/** Nutrition targets per day type, per plan section 2. */
export const NUTRITION_TARGETS = {
  easy: { calories: 2100, calorieRange: [2000, 2200] as [number, number], protein: 150, fat: 65, carbs: 160 },
  hard: { calories: 2450, calorieRange: [2300, 2600] as [number, number], protein: 150, fat: 75, carbs: 280 },
}

export function isHardDay(dayType: DayType): boolean {
  return dayType === 'strengthA' || dayType === 'hardConditioning' || dayType === 'strengthC' || dayType === 'longEndurance' || dayType === 'strengthB'
}

export const HABIT_DEFS = [
  { id: 'water', label: 'Water', type: 'number', unit: 'L' },
  { id: 'sleepHours', label: 'Sleep hours', type: 'number', unit: 'h' },
  { id: 'sleepScore', label: 'Sleep score', type: 'number', unit: '' },
  { id: 'restingHr', label: 'Resting heart rate', type: 'number', unit: 'bpm' },
  { id: 'phoneUnder1h', label: 'Phone < 1 hour', type: 'boolean', unit: '' },
  { id: 'reading30', label: 'Reading 30 min', type: 'boolean', unit: '' },
  { id: 'meditation10', label: 'Meditation 10 min', type: 'boolean', unit: '' },
  { id: 'noAlcohol', label: 'No alcohol', type: 'boolean', unit: '' },
] as const

export type HabitId = (typeof HABIT_DEFS)[number]['id']
