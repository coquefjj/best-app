import { useParams, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getDayInfo } from '../lib/session'
import { formatHuman, addDays, todayISO } from '../lib/date'
import { SESSIONS_BY_TYPE, AEROBIC_EASY_OPTIONS, HARD_CONDITIONING_OPTIONS, LONG_ENDURANCE_OPTIONS, MOBILITY_DAILY } from '../data/plan'
import RoomHeader from '../components/RoomHeader'
import type { AerobicLog, ExerciseLog, SetLog, WorkoutDayLog } from '../types'

const MODALITY_OPTIONS: Record<string, string[]> = {
  aerobicEasy: AEROBIC_EASY_OPTIONS,
  hardConditioning: HARD_CONDITIONING_OPTIONS,
  longEndurance: LONG_ENDURANCE_OPTIONS,
}

function emptyWorkout(): WorkoutDayLog {
  return { mobilityDone: false, exercises: {} }
}

function findLastLog(workouts: Record<string, WorkoutDayLog>, exerciseId: string, beforeIso: string): ExerciseLog | undefined {
  const dates = Object.keys(workouts)
    .filter((d) => d < beforeIso && workouts[d].exercises[exerciseId])
    .sort()
    .reverse()
  return dates.length ? workouts[dates[0]].exercises[exerciseId] : undefined
}

export default function Workout() {
  const { date } = useParams<{ date: string }>()
  const iso = date ?? todayISO()
  const { data, setData } = useStore()
  const info = getDayInfo(iso)
  const workout = data.workouts[iso] ?? emptyWorkout()
  const exerciseDefs = SESSIONS_BY_TYPE[info.dayType]
  const modalityOptions = MODALITY_OPTIONS[info.dayType]

  const update = (fn: (w: WorkoutDayLog) => WorkoutDayLog) => {
    setData((prev) => ({
      ...prev,
      workouts: { ...prev.workouts, [iso]: fn(prev.workouts[iso] ?? emptyWorkout()) },
    }))
  }

  const setOption = (exerciseId: string, optionName: string, defaultSets: number) => {
    update((w) => ({
      ...w,
      exercises: {
        ...w.exercises,
        [exerciseId]: {
          chosenOption: optionName,
          sets: w.exercises[exerciseId]?.sets ?? Array.from({ length: defaultSets }, () => ({ weight: null, reps: null, done: false })),
        },
      },
    }))
  }

  const updateSet = (exerciseId: string, idx: number, patch: Partial<SetLog>) => {
    update((w) => {
      const ex = w.exercises[exerciseId]
      if (!ex) return w
      const sets = ex.sets.map((s, i) => (i === idx ? { ...s, ...patch } : s))
      return { ...w, exercises: { ...w.exercises, [exerciseId]: { ...ex, sets } } }
    })
  }

  const setAerobic = (patch: Partial<AerobicLog>) => {
    update((w) => ({
      ...w,
      aerobic: { chosenOption: '', durationMin: null, distanceKm: null, effort: null, ...w.aerobic, ...patch },
    }))
  }

  const toggleMobility = () => update((w) => ({ ...w, mobilityDone: !w.mobilityDone }))

  return (
    <div className="page room-page floor-gym">
      <RoomHeader
        room="gym"
        title={info.label}
        subtitle={info.deload ? <span className="badge deload">Deload week: hold back on load</span> : undefined}
      >
        <div className="top-bar">
          <Link to={`/workout/${addDays(iso, -1)}`} className="arrow-btn" aria-label="Previous day">◀</Link>
          <div style={{ textAlign: 'center' }}>
            <strong>{formatHuman(iso)}</strong>
            {info.inPlan && <div className="subtle">Day {info.dayNum}</div>}
          </div>
          <Link to={`/workout/${addDays(iso, 1)}`} className="arrow-btn" aria-label="Next day">▶</Link>
        </div>
      </RoomHeader>

      {info.dayType === 'rest' && (
        <div className="card">
          <p className="subtle">Rest day. Active recovery only, resist filling it. Add a longer flexibility session below.</p>
        </div>
      )}

      {modalityOptions && (
        <div className="card">
          <h2>Pick today's session</h2>
          <div className="pill-select">
            {modalityOptions.map((opt) => (
              <button
                key={opt}
                className={workout.aerobic?.chosenOption === opt ? 'selected' : ''}
                onClick={() => setAerobic({ chosenOption: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
          {workout.aerobic?.chosenOption && (
            <>
              <div className="field">
                <label>Duration (min)</label>
                <input
                  type="number"
                  value={workout.aerobic.durationMin ?? ''}
                  onChange={(e) => setAerobic({ durationMin: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Distance (km, optional)</label>
                <input
                  type="number"
                  value={workout.aerobic.distanceKm ?? ''}
                  onChange={(e) => setAerobic({ distanceKm: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Effort</label>
                <select
                  value={workout.aerobic.effort ?? ''}
                  onChange={(e) => setAerobic({ effort: (e.target.value || null) as AerobicLog['effort'] })}
                >
                  <option value="">Select</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {exerciseDefs && (
        <div className="card">
          <h2>Exercises</h2>
          {exerciseDefs.map((ex) => {
            const log = workout.exercises[ex.id]
            const lastLog = findLastLog(data.workouts, ex.id, iso)
            const chosen = log?.chosenOption ?? ex.options[0].name
            const cue = ex.options.find((o) => o.name === chosen)?.cue

            return (
              <div className="exercise-block" key={ex.id}>
                <h3>
                  {chosen}
                  {ex.optional && <span className="subtle"> (optional)</span>}
                </h3>
                <div className="subtle">
                  Target: {ex.target.sets} x {ex.target.reps}
                  {ex.note ? ` · ${ex.note}` : ''}
                </div>
                {cue && <div className="subtle">Cue: {cue}</div>}

                {ex.options.length > 1 && (
                  <div className="pill-select">
                    {ex.options.map((opt) => (
                      <button
                        key={opt.name}
                        className={chosen === opt.name ? 'selected' : ''}
                        onClick={() => setOption(ex.id, opt.name, parseInt(ex.target.sets) || 3)}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}

                {!log && (
                  <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => setOption(ex.id, chosen, parseInt(ex.target.sets) || 3)}>
                    Start logging
                  </button>
                )}

                {log?.sets.map((s, idx) => {
                  const lastSet = lastLog?.sets[idx]
                  return (
                    <div className="set-row" key={idx}>
                      <span className="set-num">#{idx + 1}</span>
                      <input
                        type="number"
                        placeholder={lastSet?.weight != null ? `${lastSet.weight} kg last` : 'kg'}
                        value={s.weight ?? ''}
                        onChange={(e) => updateSet(ex.id, idx, { weight: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                      <input
                        type="number"
                        placeholder={lastSet?.reps != null ? `${lastSet.reps} reps last` : 'reps'}
                        value={s.reps ?? ''}
                        onChange={(e) => updateSet(ex.id, idx, { reps: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                      <input
                        type="checkbox"
                        checked={s.done}
                        onChange={(e) => updateSet(ex.id, idx, { done: e.target.checked })}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      <div className="card">
        <div className={`checklist-item${workout.mobilityDone ? ' done' : ''}`} onClick={toggleMobility}>
          <input type="checkbox" checked={workout.mobilityDone} onChange={toggleMobility} onClick={(e) => e.stopPropagation()} />
          <label>Daily mobility (10 min)</label>
        </div>
        <div className="subtle" style={{ marginTop: 6 }}>
          {MOBILITY_DAILY.join(' · ')}
        </div>
      </div>
    </div>
  )
}
