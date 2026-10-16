// The exercise library: every exercise in every plan template, so any day can take extras
// from it (Workout page, "Add exercise"). Grouped like the muscle map on strength Progress.
import { MUSCLE_GROUPS } from '../lib/strength'
import type { ExerciseSet } from './plan'
import { activePlan, resolvePlan, SPLIT_DEFAULT_DAYS, type PlanConfig } from './templates'

export interface LibraryExercise {
  name: string
  cue: string
  /** The target from the plan it comes from, shown as a guide. */
  target: ExerciseSet
  weighted: boolean
  mode: 'reps' | 'time'
}

export interface LibraryGroup {
  name: string
  exercises: LibraryExercise[]
}

const CORE = ['Hanging knee raise', 'Plank', 'Dead bug', 'Side plank', 'Pallof press', 'Kneeling Cable Crunch', 'Copenhagen plank', 'Adductor squeeze', 'Banded lateral walk', 'Side-lying abduction', 'Tibialis raise']
const EXTRA_LEGS = ['Single-leg calf raise', 'Light hinge']
const CONDITIONING = ['DB thruster', 'DB swing', 'Burpees']

/** Exercises no plan uses yet, so they can still be added from the library. */
const EXTRAS: (LibraryExercise & { group: string })[] = [
  { name: 'Triceps pushdown (machine)', cue: 'Elbows pinned to your sides, press down to straight arms', target: { sets: '3', reps: '10-12' }, weighted: true, mode: 'reps', group: 'Arms & shoulders' },
  { name: 'Dips', cue: 'Shoulders down, lower until elbows reach 90°, press up', target: { sets: '3', reps: '6-10' }, weighted: false, mode: 'reps', group: 'Chest' },
]

/** Plan targets like "20-30s/side" are held for time, everything else is counted in reps. */
export const isTimeTarget = (reps: string) => /\d\s*(s|sec|min)\b/i.test(reps)

/** "Face Pull" and "Face pulls" are the same exercise in two plans. */
const sameKey = (name: string) => name.toLowerCase().replace(/-/g, ' ').replace(/s$/, '')

function build(active: PlanConfig): LibraryGroup[] {
  const split = resolvePlan({ templateId: 'split3', startDate: '2026-01-01', lengthDays: 100, trainingDays: SPLIT_DEFAULT_DAYS })
  // The profile's own plan goes first, so its names win when two plans spell an exercise differently.
  const plans = active.templateId === 'split3' ? [split, resolvePlan(undefined)] : [resolvePlan(undefined), split]
  const byName = new Map<string, LibraryExercise>()
  for (const plan of plans) {
    for (const session of Object.values(plan.sessions)) {
      for (const ex of session.exercises ?? []) {
        for (const opt of ex.options) {
          if (byName.has(sameKey(opt.name))) continue
          byName.set(sameKey(opt.name), {
            name: opt.name,
            cue: opt.cue,
            target: ex.target,
            weighted: ex.weighted ?? true,
            mode: isTimeTarget(ex.target.reps) ? 'time' : 'reps',
          })
        }
      }
    }
  }

  for (const { group: _group, ...ex } of EXTRAS) if (!byName.has(sameKey(ex.name))) byName.set(sameKey(ex.name), ex)

  const groupOf = (name: string): string => {
    const extra = EXTRAS.find((e) => e.name === name)
    if (extra) return extra.group
    for (const g of MUSCLE_GROUPS) {
      if (g.lifts.includes(name) || g.travelLifts.includes(name) || split.muscleLifts?.[g.id].includes(name)) return g.name
    }
    if (EXTRA_LEGS.includes(name)) return 'Legs'
    if (CORE.includes(name)) return 'Core & stability'
    if (CONDITIONING.includes(name)) return 'Conditioning'
    return 'Other'
  }

  const order = [...MUSCLE_GROUPS.map((g) => g.name), 'Core & stability', 'Conditioning', 'Other']
  const groups = new Map<string, LibraryExercise[]>(order.map((n) => [n, []]))
  for (const ex of byName.values()) groups.get(groupOf(ex.name))!.push(ex)
  return order
    .map((name) => ({ name, exercises: groups.get(name)!.sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.exercises.length)
}

const cache = new Map<string, LibraryGroup[]>()

/** The library for the profile on screen. */
export function library(): LibraryGroup[] {
  const plan = activePlan()
  if (!cache.has(plan.templateId)) cache.set(plan.templateId, build(plan))
  return cache.get(plan.templateId)!
}

export const findLibraryExercise = (name: string) => library().flatMap((g) => g.exercises).find((e) => e.name === name)
