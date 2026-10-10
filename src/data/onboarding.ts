// Onboarding answers, the people whose answers come prefilled, and the targets suggested from them.
import { SPLIT_DEFAULT_DAYS, type TemplateId } from './templates'
import type { Habit, Profile } from '../types'

export type About = NonNullable<Profile['about']>

export interface Draft {
  name: string
  about: About
  templateId: TemplateId
  startDate: string
  lengthDays: number
  /** 3-day split only: weekdays for Day 1, 2 and 3. */
  trainingDays: number[]
  habits: Habit[]
  /** Food and water numbers typed in; anything missing uses the suggestion from `about`. */
  food: Partial<Suggested>
  watch: boolean
}

/** Habits offered on the Habits step, first four as Fernando started with. */
export const HABIT_CHOICES: Habit[] = [
  { id: 'readingMin', label: 'Reading', type: 'minutes' },
  { id: 'meditationMin', label: 'Meditation', type: 'minutes' },
  { id: 'noSocialMedia', label: 'No social media', type: 'boolean' },
  { id: 'noAlcohol', label: 'No alcohol', type: 'boolean' },
  { id: 'journaling', label: 'Journaling', type: 'boolean' },
  { id: 'stretchingMin', label: 'Stretching', type: 'minutes' },
  { id: 'steps10k', label: 'Walk 10k steps', type: 'boolean' },
  { id: 'noSugar', label: 'No sugar', type: 'boolean' },
]

export interface Suggested {
  caloriesHard: number
  caloriesEasy: number
  /** Set by hand; otherwise halfway between easy and hard. */
  caloriesModerate?: number
  protein: number
  fat: number
  waterL: number
  sleepHours: number
}

const round = (v: number, to: number) => Math.round(v / to) * to

/**
 * Starting numbers from body size, activity and goal: Mifflin-St Jeor resting burn times an
 * activity factor (lower on rest days), protein 1.8 g and fat 0.95 g per kg, water 35 ml per kg.
 * Estimates to start from, not advice.
 */
export function suggest(a: About): Suggested {
  const { age, heightCm: h, weightKg: w } = a
  if (!age || !h || !w) return { caloriesHard: 2450, caloriesEasy: 2100, protein: 150, fat: 70, waterL: 2, sleepHours: 8 }
  const bmr = 10 * w + 6.25 * h - 5 * age + (a.sex === 'female' ? -161 : 5)
  const [rest, training] = { light: [1.2, 1.375], moderate: [1.375, 1.55], very: [1.55, 1.725] }[a.activity]
  const adjust = a.goal === 'lose' ? -400 : 0
  return {
    caloriesHard: round(bmr * training + adjust, 50),
    caloriesEasy: round(bmr * rest + adjust, 50),
    protein: round(1.8 * w, 5),
    fat: round(0.95 * w, 5),
    waterL: +round(0.035 * w, 0.2).toFixed(1),
    sleepHours: 8,
  }
}

/** Carbs fill the calories left after protein and fat. */
export const carbsFor = (calories: number, protein: number, fat: number) => Math.max(0, round((calories - protein * 4 - fat * 9) / 4, 5))

export const BLANK_DRAFT = (startDate: string): Draft => ({
  name: '',
  about: { age: null, sex: null, heightCm: null, weightKg: null, activity: 'moderate', goal: 'muscle' },
  templateId: 'split3',
  startDate,
  lengthDays: 100,
  trainingDays: SPLIT_DEFAULT_DAYS,
  habits: HABIT_CHOICES.slice(0, 4),
  food: {},
  watch: true,
})

/**
 * Mateo, from Fernando's message on Oct 3 2026: 31, 183 cm, 84.9 kg, on the 3-day split.
 * Training days, start date, goal and habits weren't given and use the defaults; rest-day
 * calories are 2500 as in the plan doc.
 */
export const PRESETS: { id: string; label: string; draft: () => Draft }[] = [
  {
    id: 'mateo',
    label: 'Mateo',
    draft: () => ({
      name: 'Mateo',
      about: { age: 31, sex: 'male', heightCm: 183, weightKg: 84.9, activity: 'moderate', goal: 'muscle' },
      templateId: 'split3',
      startDate: '2026-10-05',
      lengthDays: 100,
      trainingDays: SPLIT_DEFAULT_DAYS,
      habits: HABIT_CHOICES.slice(0, 4),
      food: { caloriesHard: 2850, caloriesEasy: 2500, protein: 155, fat: 80, waterL: 3, sleepHours: 8 },
      watch: false,
    }),
  },
]
