import { useParams, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getDayInfo } from '../lib/session'
import { calorieReason, dayLevel, DAY_LEVELS, type DayLevel } from '../lib/targets'
import { useState } from 'react'
import { formatHuman, addDays, todayISO, formatClock, formatDuration, parseDuration, weekdayOf } from '../lib/date'
import { MOBILITY_DAILY, TRAVEL_SESSIONS, TRAVEL_TEMPLATE, SWAP_SESSIONS, SWAP_REASONS, SWAP_REASONS_SOFTER, SWAP_REASONS_FROM_REST, type DayType, type SwapReason } from '../data/plan'
import { activePlan } from '../data/templates'
import RoomHeader from '../components/RoomHeader'
import DaySwiper from '../components/DaySwiper'
import MoveThumb from '../components/moves/MoveThumb'
import MoveSheet from '../components/moves/MoveSheet'
import StrengthProgress from '../components/StrengthProgress'
import type { AerobicLog, ExerciseLog, SetLog, WorkoutDayLog } from '../types'
import type { PlanExercise } from '../data/plan'

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
  const kcal = calorieReason(data, iso)
  const workout = data.workouts[iso] ?? emptyWorkout()
  const plan = activePlan()
  const exerciseDefs = plan.sessions[info.dayType].exercises
  const modalityOptions = plan.sessions[info.dayType].modalityOptions

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
            weighted: lastLog?.weighted ?? ex.weighted ?? true,
            ...current,
            chosenOption: optionName,
            // The very first time, sets start at the plan's starting weight when it has one.
            sets:
              current?.sets ??
              Array.from({ length: parseInt(ex.target.sets) || 3 }, () => ({ ...emptySet(), weight: lastLog ? null : ex.startKg ?? null })),
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

  // Travel only changes which session the day shows; logs already saved stay as they are.
  const setTravelDay = (dayType: DayType | null) => {
    setData((prev) => {
      const travelDays = { ...prev.travelDays }
      if (dayType) travelDays[iso] = dayType
      else delete travelDays[iso]
      return { ...prev, travelDays }
    })
  }
  const toggleTravel = () => setTravelDay(info.travel ? null : TRAVEL_TEMPLATE[weekdayOf(iso)])

  // A swap only changes which session the day shows; logs for the planned session are kept.
  const swap = info.travel ? undefined : data.swaps?.[iso]
  const [swapOpen, setSwapOpen] = useState(false)
  const plannedType = getDayInfo(iso, { ...data, swaps: undefined }).dayType
  // A rest day can take any workout on the plan's week; a workout day goes to a softer session.
  const swapTargets: { dayType: DayType; short: string }[] =
    plannedType === 'rest'
      ? [...new Set(Object.keys(plan.week).sort((a, b) => ((+a + 6) % 7) - ((+b + 6) % 7)).map((wd) => plan.week[+wd]))]
          .filter((t) => t !== 'rest')
          .map((t) => ({ dayType: t, short: plan.sessions[t].label.split(' —')[0].replace(/ \(.*\)$/, '') }))
      : SWAP_SESSIONS.filter((t) => plan.swapTo.includes(t.dayType) && t.dayType !== plannedType)
  const swapReasons = (plannedType === 'rest' ? SWAP_REASONS_FROM_REST : SWAP_REASONS_SOFTER).map((id) => SWAP_REASONS.find((r) => r.id === id)!)
  const setSwap = (to: DayType | null, reason: SwapReason | null = swap?.reason ?? null) => {
    setData((prev) => {
      const swaps = { ...prev.swaps }
      if (to) swaps[iso] = { to, reason }
      else delete swaps[iso]
      return { ...prev, swaps }
    })
  }

  /** Picking the level the session already gives clears the pick, so the day follows the session again. */
  const pickLevel = (level: DayLevel) => {
    const auto = dayLevel({ ...data, dayLevels: {} }, iso).auto
    setData((prev) => {
      const dayLevels = { ...prev.dayLevels }
      if (level === auto) delete dayLevels[iso]
      else dayLevels[iso] = level
      return { ...prev, dayLevels }
    })
  }

  /** Card heading with the Swap and day Travel buttons on the right; the pickers sit under it. */
  const cardHead = (title: string) => (
    <>
      <h2 className="card-head">
        <span>{title}</span>
        <span className="card-head-btns">
          {!info.travel && swapTargets.length > 0 && (
            <button
              className={`toggle-chip travel-btn${swap || swapOpen ? ' selected' : ''}`}
              aria-expanded={swapOpen}
              onClick={() => setSwapOpen((o) => !o)}
            >
              {swap ? '✓ ' : ''}Swap
            </button>
          )}
          {plan.travel && (
            <button className={`toggle-chip travel-btn${info.travel ? ' selected' : ''}`} aria-pressed={info.travel} onClick={toggleTravel}>
              {info.travel ? '✓ ' : ''}Travel
            </button>
          )}
        </span>
      </h2>
      {!info.travel && swapOpen && (
        <div className="travel-swap swap-panel">
          <div className="subtle">Swap {plannedType === 'rest' ? 'rest day' : swap ? info.swap?.fromShort : info.label.split(' —')[0]} for</div>
          <div className="pill-select" aria-label="Swap to">
            {swapTargets.map((t) => (
              <button key={t.dayType} className={swap?.to === t.dayType ? 'selected' : ''} onClick={() => setSwap(t.dayType)}>
                {t.short}
              </button>
            ))}
          </div>
          {swap && (
            <>
              <div className="subtle">Why?</div>
              <div className="pill-select" aria-label="Why swap">
                {swapReasons.map((r) => (
                  <button key={r.id} className={swap.reason === r.id ? 'selected' : ''} onClick={() => setSwap(swap.to, swap.reason === r.id ? null : r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
              <button className="btn secondary" onClick={() => { setSwap(null); setSwapOpen(false) }}>
                Undo swap
              </button>
            </>
          )}
        </div>
      )}
      {info.travel && (
        <div className="pill-select travel-swap" aria-label="Swap this travel day">
          {TRAVEL_SESSIONS.map((t) => (
            <button key={t.dayType} className={info.dayType === t.dayType ? 'selected' : ''} onClick={() => setTravelDay(t.dayType)}>
              {t.short}
            </button>
          ))}
        </div>
      )}
      <div className="kcal-pick">
        <div className="subtle">
          Calories for this day: <strong>{kcal.calories} kcal</strong>
          {kcal.calories !== kcal.plannedCalories ? ` (was ${kcal.plannedCalories})` : ''}
        </div>
        <div className="pill-select" aria-label="Calorie day">
          {DAY_LEVELS.map((l) => (
            <button key={l.id} className={kcal.level === l.id ? 'selected' : ''} aria-pressed={kcal.level === l.id} onClick={() => pickLevel(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
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
            <span className="badge travel">Travel day: maintain, don't progress</span>
          ) : info.swap ? (
            <span className="badge travel">
              Swapped from {info.swap.fromShort}
              {info.swap.reasonLabel ? ` · ${info.swap.reasonLabel}` : ''}
            </span>
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
