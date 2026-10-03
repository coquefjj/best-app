import { useParams, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getDayInfo } from '../lib/session'
import { useState } from 'react'
import { formatHuman, addDays, todayISO, formatClock, formatDuration, parseDuration, startOfWeek, weekdayOf } from '../lib/date'
import {
  SESSIONS_BY_TYPE,
  AEROBIC_EASY_OPTIONS,
  HARD_CONDITIONING_OPTIONS,
  LONG_ENDURANCE_OPTIONS,
  MOBILITY_DAILY,
  TRAVEL_SESSIONS,
  TRAVEL_TEMPLATE,
  TRAVEL_EASY_RUN_OPTIONS,
  TRAVEL_QUALITY_RUN_OPTIONS,
  TRAVEL_LONG_RUN_OPTIONS,
  type DayType,
} from '../data/plan'
import RoomHeader from '../components/RoomHeader'
import DaySwiper from '../components/DaySwiper'
import MoveThumb from '../components/moves/MoveThumb'
import MoveSheet from '../components/moves/MoveSheet'
import StrengthProgress from '../components/StrengthProgress'
import type { AerobicLog, ExerciseLog, SetLog, WorkoutDayLog } from '../types'
import type { PlanExercise } from '../data/plan'

const MODALITY_OPTIONS: Record<string, string[]> = {
  aerobicEasy: AEROBIC_EASY_OPTIONS,
  hardConditioning: HARD_CONDITIONING_OPTIONS,
  longEndurance: LONG_ENDURANCE_OPTIONS,
  travelEasyRun: TRAVEL_EASY_RUN_OPTIONS,
  travelQualityRun: TRAVEL_QUALITY_RUN_OPTIONS,
  travelLongRun: TRAVEL_LONG_RUN_OPTIONS,
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

const emptySet = (): SetLog => ({ weight: null, reps: null, seconds: null, done: false })

/** Plan targets like "20-30s/side" are held for time, everything else is counted in reps. */
function defaultMode(ex: PlanExercise): 'reps' | 'time' {
  return /\d\s*(s|sec|min)\b/i.test(ex.target.reps) ? 'time' : 'reps'
}

/** Text box for a set's time in m:ss; keeps what's typed and saves it as seconds. */
function TimeInput({ seconds, placeholder, onChange }: { seconds: number | null; placeholder: string; onChange: (s: number | null) => void }) {
  const [text, setText] = useState<string | null>(null)
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={text ?? (seconds != null ? formatDuration(seconds) : '')}
      onChange={(e) => {
        setText(e.target.value)
        const parsed = parseDuration(e.target.value)
        if (parsed !== null || e.target.value.trim() === '') onChange(parsed)
      }}
      onBlur={() => setText(null)}
    />
  )
}

export default function Workout() {
  const { date } = useParams<{ date: string }>()
  return <DaySwiper base="workout" iso={date ?? todayISO()} renderDay={(iso) => <WorkoutDay iso={iso} />} />
}

function WorkoutDay({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const info = getDayInfo(iso, data)
  const workout = data.workouts[iso] ?? emptyWorkout()
  const exerciseDefs = SESSIONS_BY_TYPE[info.dayType]
  const modalityOptions = MODALITY_OPTIONS[info.dayType]

  const update = (fn: (w: WorkoutDayLog) => WorkoutDayLog) => {
    setData((prev) => ({
      ...prev,
      workouts: { ...prev.workouts, [iso]: fn(prev.workouts[iso] ?? emptyWorkout()) },
    }))
  }

  const setOption = (ex: PlanExercise, optionName: string) => {
    const lastLog = findLastLog(data.workouts, ex.id, iso)
    update((w) => {
      const current = w.exercises[ex.id]
      return {
        ...w,
        exercises: {
          ...w.exercises,
          [ex.id]: {
            mode: lastLog?.mode ?? defaultMode(ex),
            weighted: lastLog?.weighted ?? true,
            ...current,
            chosenOption: optionName,
            sets: current?.sets ?? Array.from({ length: parseInt(ex.target.sets) || 3 }, emptySet),
          },
        },
      }
    })
  }

  const updateExercise = (exerciseId: string, fn: (ex: ExerciseLog) => ExerciseLog) => {
    update((w) => {
      const ex = w.exercises[exerciseId]
      if (!ex) return w
      return { ...w, exercises: { ...w.exercises, [exerciseId]: fn(ex) } }
    })
  }

  const addSet = (exerciseId: string) => updateExercise(exerciseId, (ex) => ({ ...ex, sets: [...ex.sets, emptySet()] }))
  const removeSet = (exerciseId: string) => updateExercise(exerciseId, (ex) => ({ ...ex, sets: ex.sets.slice(0, -1) }))

  const finish = () => update((w) => ({ ...w, completedAt: new Date().toISOString() }))
  const reopen = () => update((w) => ({ ...w, completedAt: undefined }))

  const updateSet = (exerciseId: string, idx: number, patch: Partial<SetLog>) => {
    updateExercise(exerciseId, (ex) => ({ ...ex, sets: ex.sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)) }))
  }

  const setAerobic = (patch: Partial<AerobicLog>) => {
    update((w) => ({
      ...w,
      aerobic: { chosenOption: '', durationMin: null, distanceKm: null, effort: null, ...w.aerobic, ...patch },
    }))
  }

  const toggleMobility = () => update((w) => ({ ...w, mobilityDone: !w.mobilityDone }))

  // Travel weeks only change which session a day shows; logs already saved stay as they are.
  const week = startOfWeek(iso)
  const toggleTravel = () => {
    setData((prev) => {
      const weeks = prev.travelWeeks ?? []
      if (!weeks.includes(week)) return { ...prev, travelWeeks: [...weeks, week].sort() }
      const travelDays = { ...prev.travelDays }
      for (let i = 0; i < 7; i++) delete travelDays[addDays(week, i)]
      return { ...prev, travelWeeks: weeks.filter((w) => w !== week), travelDays }
    })
  }
  const swapTravelDay = (dayType: DayType) => {
    setData((prev) => {
      const travelDays = { ...prev.travelDays }
      if (dayType === TRAVEL_TEMPLATE[weekdayOf(iso)]) delete travelDays[iso]
      else travelDays[iso] = dayType
      return { ...prev, travelDays }
    })
  }

  /** Card heading with the week's Travel switch on the right; on travel days, the session swap sits under it. */
  const cardHead = (title: string) => (
    <>
      <h2 className="card-head">
        <span>{title}</span>
        <button className={`toggle-chip travel-btn${info.travel ? ' selected' : ''}`} aria-pressed={info.travel} onClick={toggleTravel}>
          {info.travel ? '✓ ' : ''}Travel
        </button>
      </h2>
      {info.travel && (
        <div className="pill-select travel-swap" aria-label="Swap this travel day">
          {TRAVEL_SESSIONS.map((t) => (
            <button key={t.dayType} className={info.dayType === t.dayType ? 'selected' : ''} onClick={() => swapTravelDay(t.dayType)}>
              {t.short}
            </button>
          ))}
        </div>
      )}
    </>
  )

  const [demo, setDemo] = useState<{ name: string; cue?: string } | null>(null)
  const [showProgress, setShowProgress] = useState(false)

  return (
    <div className="page room-page floor-gym">
      {demo && <MoveSheet name={demo.name} cue={demo.cue} onClose={() => setDemo(null)} />}
      <RoomHeader
        room="gym"
        title={info.label}
        subtitle={
          info.travel ? (
            <span className="badge travel">Travel week: maintain, don't progress</span>
          ) : info.deload ? (
            <span className="badge deload">Deload week: hold back on load</span>
          ) : undefined
        }
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
          {cardHead('Rest day')}
          <p className="subtle">Rest day. Active recovery only, resist filling it. Add a longer flexibility session below.</p>
        </div>
      )}

      {modalityOptions && (
        <div className="card">
          {cardHead("Pick today's session")}
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
                <label>Calories burned (kcal, optional)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={workout.aerobic.caloriesBurned ?? ''}
                  onChange={(e) => setAerobic({ caloriesBurned: e.target.value === '' ? null : Number(e.target.value) })}
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
          {cardHead('Exercises')}
          {exerciseDefs.map((ex) => {
            const log = workout.exercises[ex.id]
            const lastLog = findLastLog(data.workouts, ex.id, iso)
            const chosen = log?.chosenOption ?? ex.options[0].name
            const cue = ex.options.find((o) => o.name === chosen)?.cue

            return (
              <div className="exercise-block" key={ex.id}>
                <div className="exercise-head">
                  <MoveThumb name={chosen} onOpen={() => setDemo({ name: chosen, cue })} />
                  <div>
                    <h3>
                      {chosen}
                      {ex.optional && <span className="subtle"> (optional)</span>}
                    </h3>
                    <div className="subtle">
                      Target: {ex.target.sets} x {ex.target.reps}
                      {ex.note ? ` · ${ex.note}` : ''}
                    </div>
                    {cue && <div className="subtle">Cue: {cue}</div>}
                  </div>
                </div>

                {ex.options.length > 1 && (
                  <div className="pill-select">
                    {ex.options.map((opt) => (
                      <button
                        key={opt.name}
                        className={chosen === opt.name ? 'selected' : ''}
                        onClick={() => setOption(ex, opt.name)}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}

                {!log && (
                  <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => setOption(ex, chosen)}>
                    Start logging
                  </button>
                )}

                {log && (() => {
                  const mode = log.mode ?? 'reps'
                  const weighted = log.weighted ?? true
                  return (
                    <>
                      <div className="set-toggles">
                        <div className="segmented" role="group" aria-label="Count sets by">
                          <button className={mode === 'reps' ? 'selected' : ''} onClick={() => updateExercise(ex.id, (e) => ({ ...e, mode: 'reps' }))}>Reps</button>
                          <button className={mode === 'time' ? 'selected' : ''} onClick={() => updateExercise(ex.id, (e) => ({ ...e, mode: 'time' }))}>Time</button>
                        </div>
                        <button
                          className={`toggle-chip${weighted ? ' selected' : ''}`}
                          aria-pressed={weighted}
                          onClick={() => updateExercise(ex.id, (e) => ({ ...e, weighted: !weighted }))}
                        >
                          {weighted ? '✓ ' : ''}Weight
                        </button>
                      </div>

                      {log.sets.map((s, idx) => {
                        const lastSet = lastLog?.sets[idx]
                        return (
                          <div className={`set-row${weighted ? '' : ' no-weight'}`} key={idx}>
                            <span className="set-num">#{idx + 1}</span>
                            {weighted && (
                              <input
                                type="number"
                                inputMode="decimal"
                                placeholder={lastSet?.weight != null ? `${lastSet.weight} kg last` : 'kg'}
                                value={s.weight ?? ''}
                                onChange={(e) => updateSet(ex.id, idx, { weight: e.target.value === '' ? null : Number(e.target.value) })}
                              />
                            )}
                            {mode === 'time' ? (
                              <TimeInput
                                seconds={s.seconds ?? null}
                                placeholder={lastSet?.seconds != null ? `${formatDuration(lastSet.seconds)} last` : 'm:ss'}
                                onChange={(sec) => updateSet(ex.id, idx, { seconds: sec })}
                              />
                            ) : (
                              <input
                                type="number"
                                inputMode="numeric"
                                placeholder={lastSet?.reps != null ? `${lastSet.reps} reps last` : 'reps'}
                                value={s.reps ?? ''}
                                onChange={(e) => updateSet(ex.id, idx, { reps: e.target.value === '' ? null : Number(e.target.value) })}
                              />
                            )}
                            <input
                              type="checkbox"
                              aria-label={`Set ${idx + 1} done`}
                              checked={s.done}
                              onChange={(e) => updateSet(ex.id, idx, { done: e.target.checked })}
                            />
                          </div>
                        )
                      })}

                      <div className="set-actions">
                        <button className="btn secondary small" onClick={() => addSet(ex.id)}>+ Add set</button>
                        {log.sets.length > 1 && (
                          <button className="btn secondary small" onClick={() => removeSet(ex.id)}>− Remove set</button>
                        )}
                      </div>
                    </>
                  )
                })()}
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

      {info.dayType !== 'rest' && (
        <div className="card finish-card">
          {workout.completedAt ? (
            <>
              <div className="done-line">
                <span className="badge done">✓ Done</span>
                <span className="subtle">Workout finished at {formatClock(workout.completedAt)}</span>
              </div>
              <button className="btn secondary full" style={{ marginTop: 12 }} onClick={reopen}>
                Reopen workout
              </button>
            </>
          ) : (
            <button className="btn full" onClick={finish}>
              Finish workout
            </button>
          )}
        </div>
      )}

      <button
        className={`btn secondary full progress-toggle${showProgress ? ' open' : ''}`}
        aria-expanded={showProgress}
        onClick={() => setShowProgress((v) => !v)}
      >
        <span>Progress</span>
        <span aria-hidden="true">{showProgress ? '▲' : '▼'}</span>
      </button>
      {showProgress && <StrengthProgress />}
    </div>
  )
}
