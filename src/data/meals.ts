import type { FoodEntry } from '../types'

/**
 * Meals in the order of the day, with the time a new food in that meal starts at
 * (Fernando's schedule, Oct 1 2026). The preset only fills in new food; food already
 * logged keeps its own time. 'snack' is the old catch-all and is only kept for food
 * logged before the morning and afternoon snacks existed.
 */
export const MEAL_SLOTS: { id: FoodEntry['mealSlot']; label: string; time: string; color: string }[] = [
  { id: 'preWorkout', label: 'Pre-workout', time: '06:30', color: 'var(--accent)' },
  { id: 'breakfast', label: 'Breakfast', time: '08:30', color: 'var(--gold)' },
  { id: 'morningSnack', label: 'Morning snack', time: '11:30', color: 'var(--surface-2)' },
  { id: 'lunch', label: 'Lunch', time: '14:00', color: 'var(--orange)' },
  { id: 'afternoonSnack', label: 'Afternoon snack', time: '17:00', color: 'var(--wood)' },
  { id: 'dinner', label: 'Dinner', time: '19:00', color: 'var(--accent-2)' },
  { id: 'snack', label: 'Snack', time: '17:00', color: 'var(--status-bg)' },
]

/** Meals offered when picking one; the old 'snack' only shows on food that already has it. */
export const PICKABLE_SLOTS = MEAL_SLOTS.filter((s) => s.id !== 'snack')

export const slotInfo = (id: FoodEntry['mealSlot']) => MEAL_SLOTS.find((s) => s.id === id) ?? MEAL_SLOTS[MEAL_SLOTS.length - 1]

/** The meal whose preset time is closest to a time of day (minutes since midnight). */
export function nearestSlot(minutes: number): FoodEntry['mealSlot'] {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  return PICKABLE_SLOTS.reduce((best, s) =>
    Math.abs(toMin(s.time) - minutes) < Math.abs(toMin(best.time) - minutes) ? s : best,
  ).id
}
