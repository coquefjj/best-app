// How-to sprite strips drawn by Fernando: public/img/moves/<file>, square
// frames of any size laid out left to right. Spec: exercise-anims/sprite-spec.md in the
// project files. A move only shows its "How to" once its PNG exists.

export interface Move {
  file: string
  points?: string[]
}

/** Keyed by the exercise name used in the plan. */
export const MOVES: Record<string, Move> = {
  'Romanian deadlift': {
    file: 'romanian-deadlift.png',
    points: ['Push hips back, knees stay soft', 'Bar slides down close to your legs', 'Flat back, stop when hamstrings are tight', 'Squeeze glutes to stand tall'],
  },
  'Light hinge': { file: 'romanian-deadlift.png' },
  // Travel-week dumbbell versions show the same move.
  'DB Romanian deadlift': { file: 'romanian-deadlift.png' },
  'DB reverse lunge': { file: 'reverse-lunge.png' },
  'DB Bulgarian split squat': { file: 'bulgarian-split-squat.png' },
  'DB hip thrust': { file: 'hip-thrust.png' },
  'DB shoulder press': { file: 'overhead-press.png' },
  'DB single-arm row': { file: 'row.png' },
  'DB bent-over row': { file: 'row.png' },
  'DB lateral raise': { file: 'lateral-raises.png' },
  'DB curl': { file: 'biceps-curl.png' },
  'Single-leg RDL': { file: 'single-leg-rdl.png' },
  'Nordic hamstring curl': { file: 'nordic-hamstring-curl.png' },
  'Eccentric machine leg curl': { file: 'eccentric-leg-curl.png' },
  'Hip thrust': { file: 'hip-thrust.png' },
  'Reverse lunge': { file: 'reverse-lunge.png' },
  'Bulgarian split squat': { file: 'bulgarian-split-squat.png' },
  'Copenhagen plank': { file: 'copenhagen-plank.png' },
  'Adductor squeeze': { file: 'adductor-squeeze.png' },
  'Banded lateral walk': { file: 'banded-lateral-walk.png' },
  'Side-lying abduction': { file: 'side-lying-abduction.png' },
  'Tibialis raise': { file: 'tibialis-raise.png' },
  'Hanging knee raise': { file: 'hanging-knee-raise.png' },
  Plank: {
    file: 'plank.png',
    points: ['Elbows under shoulders', 'Straight line from heels to head', 'Squeeze glutes, brace like a punch is coming', 'Breathe slowly, don’t let hips sag'],
  },
  'Single-leg calf raise': { file: 'single-leg-calf-raise.png' },
  'DB bench press': { file: 'db-bench-press.png' },
  'Push-up progression': {
    file: 'push-up.png',
    points: ['Hands just outside shoulders', 'Body in one straight line', 'Elbows about 45° from your sides', 'Chest to the floor, then press away'],
  },
  'Pull-up': { file: 'pull-up.png' },
  'Lat pulldown': { file: 'lat-pulldown.png' },
  'Overhead press': { file: 'overhead-press.png' },
  'Row (cable/DB)': { file: 'row.png' },
  'Lateral raises': { file: 'lateral-raises.png' },
  'Biceps + triceps': { file: 'biceps-curl.png' },
  'Trap-bar deadlift': { file: 'trap-bar-deadlift.png' },
  'Incline DB press': { file: 'incline-db-press.png' },
  'Chin-ups': { file: 'chin-up.png' },
  'Face pulls': { file: 'face-pulls.png' },
  'Dead bug': { file: 'dead-bug.png' },
  'Side plank': { file: 'side-plank.png' },
  'Pallof press': { file: 'pallof-press.png' },
}

export const moveSrc = (m: Move) => `${import.meta.env.BASE_URL}img/moves/${m.file}`

/** How long each frame shows: pause at the start and end positions of a rep. */
export function frameDurations(frames: number): number[] {
  if (frames === 4) return [500, 220, 450, 220]
  if (frames <= 2) return Array(frames).fill(800)
  return Array(frames).fill(300)
}
