import type { Pose } from './rig'

export interface Key {
  pose: Pose
  /** ms to hold this pose before moving on */
  hold: number
  /** ms to move from this pose to the next one */
  move: number
}

export interface Move {
  keys: Key[]
  points: string[]
}

const rdlTop: Pose = { hip: [25.5, 24], torso: 3, ankleN: [26, 41], ankleF: [27, 41], handN: [27, 26], handF: [28, 26], prop: 'barbell' }
const rdlBottom: Pose = { ...rdlTop, hip: [17, 25.5], torso: 74, handN: [29.8, 35.5], handF: [30.8, 35.5] }

const pushTop: Pose = { hip: [23.5, 32.1], torso: 60, ankleN: [8, 41], ankleF: [9, 41], handN: [34, 41], handF: [35, 41], foot: [1, 1.5] }
const pushBottom: Pose = { ...pushTop, hip: [25.5, 37.3], torso: 78 }

const plank: Pose = { hip: [23.3, 37.7], torso: 78, ankleN: [6, 41], ankleF: [7, 41], handN: [43, 42], handF: [44, 42], foot: [1, 1.5] }

/** Keyed by the exercise name used in the plan. */
export const MOVES: Record<string, Move> = {
  'Romanian deadlift': {
    keys: [
      { pose: rdlTop, hold: 500, move: 1100 },
      { pose: rdlBottom, hold: 350, move: 700 },
    ],
    points: ['Push hips back, knees stay soft', 'Bar slides down close to your legs', 'Flat back, stop when hamstrings are tight', 'Squeeze glutes to stand tall'],
  },
  'Push-up progression': {
    keys: [
      { pose: pushTop, hold: 400, move: 900 },
      { pose: pushBottom, hold: 250, move: 600 },
    ],
    points: ['Hands just outside shoulders', 'Body in one straight line', 'Elbows about 45° from your sides', 'Chest to the floor, then press away'],
  },
  Plank: {
    keys: [
      { pose: { ...plank, guide: 0 }, hold: 700, move: 0 },
      { pose: { ...plank, guide: 1 }, hold: 700, move: 0 },
    ],
    points: ['Elbows under shoulders', 'Straight line from heels to head', 'Squeeze glutes, brace like a punch is coming', 'Breathe slowly, don’t let hips sag'],
  },
}
