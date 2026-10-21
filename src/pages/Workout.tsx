import { useParams, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getDayInfo } from '../lib/session'
import { calorieReason, dayLevel, DAY_LEVELS, type DayLevel } from '../lib/targets'
import { useState } from 'react'
import { formatHuman, addDays, todayISO, formatClock, formatDuration, parseDuration, weekdayOf } from '../lib/date'
import { MOBILITY_DAILY, TRAVEL_SESSIONS, TRAVEL_TEMPLATES, TRAVEL_GEARS, travelGearOf, SWAP_SESSIONS, SWAP_REASONS, CARDIO_OPTIONS, SWAP_REASONS_SOFTER, SWAP_REASONS_FROM_REST, type DayType, type SwapReason, type TravelGear } from '../data/plan'
import { activePlan } from '../data/templates'
import RoomHeader from '../components/RoomHeader'
import DaySwiper from '../components/DaySwiper'
import MoveThumb from '../components/moves/MoveThumb'
import MoveSheet from '../components/moves/MoveSheet'
import StrengthProgress from '../components/StrengthProgress'
import ExercisePicker from '../components/ExercisePicker'
import { findLibraryExercise, type LibraryExercise } from '../data/library'
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

/** The last time an exercise with this name was logged before the day, from any session or slot. */
function findLastByName(workouts: Record<string, WorkoutDayLog>, name: string, beforeIso: string): ExerciseLog | undefined {
  const dates = Object.keys(workouts).filter((d) => d < beforeIso).sort().reverse()
  for (const d of dates) {
    const found = Object.values(workouts[d].exercises).find((ex) => ex.chosenOption === name && ex.sets.length)
    if (found) return found
  }
  return undefined
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

/** A gear session's closest match in the other gear, for days whose weekday plan is a run or rest. */
const TRAVEL_GEAR_SWAP: Record<DayType, DayType> = {
  travelDb1: 'travelCalB',
  travelDb2: 'travelCalC',
  travelCircuit: 'travelCalCircuit',
  travelCalA: 'travelDb2',
  travelCalB: 'travelDb1',
  travelCalC: 'travelDb1',
  travelCalCircuit: 'travelCircuit',
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

  // Exercises from the library apply to this day only; they log sets like the planned ones.
  const addFromLibrary = (lib: LibraryExercise) => {
    const lastLog = findLastByName(data.workouts, lib.name, iso)
    const id = `add-${Date.now().toString(36)}`
    update((w) => ({
      ...w,
      added: [...(w.added ?? []), { id, name: lib.name }],
      exercises: {
        ...w.exercises,
        [id]: {
          chosenOption: lib.name,
          mode: lib.mode === 'cardio' ? 'cardio' : lastLog?.mode ?? lib.mode,
          weighted: lastLog?.weighted ?? lib.weighted,
          // Cardio is one entry of time and calories, not sets.
          sets: lib.mode === 'cardio' ? [emptySet()] : Array.from({ length: lastLog?.sets.length || parseInt(lib.target.sets) || 3 }, emptySet),
        },
      },
    }))
  }
  const removeAdded = (id: string) =>
    update((w) => {
      const exercises = { ...w.exercises }
      delete exercises[id]
      return { ...w, added: (w.added ?? []).filter((a) => a.id !== id), exercises }
    })

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
  // The gear (dumbbells or a calisthenics park) is kept per day; dumbbells when unset.
  const travelGear: TravelGear = data.travelGear?.[iso] ?? travelGearOf(info.dayType) ?? 'dumbbells'
  const setTravelDay = (dayType: DayType | null, gear: TravelGear = travelGear) => {
    setData((prev) => {
      const travelDays = { ...prev.travelDays }
      const gears = { ...prev.travelGear }
      if (dayType) travelDays[iso] = dayType
      else delete travelDays[iso]
      if (dayType && gear !== 'dumbbells') gears[iso] = gear
      else delete gears[iso]
      return { ...prev, travelDays, travelGear: gears }
    })
  }
  // A trip usually runs several days, so a new travel day takes the day before's gear.
  const toggleTravel = () => {
    if (info.travel) return setTravelDay(null)
    const prevIso = addDays(iso, -1)
    const gear = data.travelDays?.[prevIso] ? data.travelGear?.[prevIso] ?? travelGearOf(data.travelDays[prevIso]) ?? 'dumbbells' : 'dumbbells'
    setTravelDay(TRAVEL_TEMPLATES[gear][weekdayOf(iso)], gear)
  }
  /** Runs and rest stay as they are; a dumbbell or calisthenics session turns into the other gear's. */
  const pickGear = (gear: TravelGear) => {
    const current = travelGearOf(info.dayType)
    if (!current || current === gear) return setTravelDay(info.dayType, gear)
    const planned = TRAVEL_TEMPLATES[gear][weekdayOf(iso)]
    setTravelDay(travelGearOf(planned) === gear ? planned : TRAVEL_GEAR_SWAP[info.dayType], gear)
  }

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
          .concat(plan.sessions.cardio ? [{ dayType: 'cardio', short: 'Cardio' }] : [])
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
          {swap?.to === 'cardio' && (
            <>
              <div className="subtle">Which cardio?</div>
              <div className="pill-select" aria-label="Cardio type">
                {CARDIO_OPTIONS.map((opt) => (
                  <button key={opt} className={workout.aerobic?.chosenOption === opt ? 'selected' : ''} onClick={() => setAerobic({ chosenOption: opt })}>
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
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
        <div className="travel-swap swap-panel">
          <div className="pill-select" aria-label="Travel gear">
            {TRAVEL_GEARS.map((g) => (
              <button key={g.id} className={travelGear === g.id ? 'selected' : ''} aria-pressed={travelGear === g.id} onClick={() => pickGear(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
          <div className="pill-select" aria-label="Swap this travel day">
            {TRAVEL_SESSIONS.filter((t) => !t.gear || t.gear === travelGear).map((t) => (
              <button key={t.dayType} className={info.dayType === t.dayType ? 'selected' : ''} onClick={() => setTravelDay(t.dayType)}>
                {t.short}
              </button>
            ))}
          </div>
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

  /** Reps/time and weight toggles, the set rows and add/remove set, for one logged exercise. */
  const renderSets = (exId: string, log: ExerciseLog, lastLog: ExerciseLog | undefined) => {
    const mode = log.mode ?? 'reps'
    const weighted = log.weighted ?? true
    return (
      <>
        <div className="set-toggles">
          <div className="segmented" role="group" aria-label="Count sets by">
            <button className={mode === 'reps' ? 'selected' : ''} onClick={() => updateExercise(exId, (e) => ({ ...e, mode: 'reps' }))}>Reps</button>
            <button className={mode === 'time' ? 'selected' : ''} onClick={() => updateExercise(exId, (e) => ({ ...e, mode: 'time' }))}>Time</button>
          </div>
          <button
            className={`toggle-chip${weighted ? ' selected' : ''}`}
            aria-pressed={weighted}
            onClick={() => updateExercise(exId, (e) => ({ ...e, weighted: !weighted }))}
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
                  onChange={(e) => updateSet(exId, idx, { weight: e.target.value === '' ? null : Number(e.target.value) })}
                />
              )}
              {mode === 'time' ? (
                <TimeInput
                  seconds={s.seconds ?? null}
                  placeholder={lastSet?.seconds != null ? `${formatDuration(lastSet.seconds)} last` : 'm:ss'}
                  onChange={(sec) => updateSet(exId, idx, { seconds: sec })}
                />
              ) : (
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={lastSet?.reps != null ? `${lastSet.reps} reps last` : 'reps'}
                  value={s.reps ?? ''}
                  onChange={(e) => updateSet(exId, idx, { reps: e.target.value === '' ? null : Number(e.target.value) })}
                />
              )}
              <input
                type="checkbox"
                aria-label={`Set ${idx + 1} done`}
                checked={s.done}
                onChange={(e) => updateSet(exId, idx, { done: e.target.checked })}
              />
            </div>
          )
        })}

        <div className="set-actions">
          <button className="btn secondary small" onClick={() => addSet(exId)}>+ Add set</button>
          {log.sets.length > 1 && (
            <button className="btn secondary small" onClick={() => removeSet(exId)}>− Remove set</button>
          )}
        </div>
      </>
    )
  }

  /** A cardio entry from the library: one row of minutes and calories burned. */
  const renderCardio = (exId: string, log: ExerciseLog, lastLog: ExerciseLog | undefined) => {
    const s = log.sets[0] ?? emptySet()
    const last = lastLog?.sets[0]
    return (
      <div className="cardio-row">
        <label>
          <span className="subtle">Time (min)</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder={last?.seconds != null ? `${Math.round(last.seconds / 60)} last` : 'min'}
            value={s.seconds != null ? Math.round((s.seconds / 60) * 10) / 10 : ''}
            onChange={(e) => updateSet(exId, 0, { seconds: e.target.value === '' ? null : Math.round(Number(e.target.value) * 60) })}
          />
        </label>
        <label>
          <span className="subtle">Calories (kcal)</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={last?.calories != null ? `${last.calories} last` : 'kcal'}
            value={s.calories ?? ''}
            onChange={(e) => updateSet(exId, 0, { calories: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </label>
        <input type="checkbox" aria-label="Done" checked={s.done} onChange={(e) => updateSet(exId, 0, { done: e.target.checked })} />
      </div>
    )
  }

  const [demo, setDemo] = useState<{ name: string; cue?: string } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const added = workout.added ?? []

  /** Exercises added from the library, then the button that opens it. */
  const addedSection = (
    <>
      {added.map((a) => {
        const log = workout.exercises[a.id]
        if (!log) return null
        const lib = findLibraryExercise(a.name)
        return (
          <div className="exercise-block added" key={a.id}>
            <div className="exercise-head">
              <MoveThumb name={a.name} onOpen={() => setDemo({ name: a.name, cue: lib?.cue })} />
              <div className="added-title">
                <h3>{a.name}</h3>
                <div className="subtle">
                  <span className="badge added-badge">Added</span>
                  {lib && log.mode !== 'cardio' ? ` Guide: ${lib.target.sets} x ${lib.target.reps}` : ''}
                </div>
                {lib?.cue && <div className="subtle">Cue: {lib.cue}</div>}
              </div>
              <button className="remove-added" aria-label={`Remove ${a.name} from this day`} onClick={() => removeAdded(a.id)}>✕</button>
            </div>
            {log.mode === 'cardio'
              ? renderCardio(a.id, log, findLastByName(data.workouts, a.name, iso))
              : renderSets(a.id, log, findLastByName(data.workouts, a.name, iso))}
          </div>
        )
      })}
      <button className="btn secondary full add-exercise" onClick={() => setPickerOpen(true)}>
        + Add exercise
      </button>
    </>
  )
  const [showProgress, setShowProgress] = useState(false)

  return (
    <div className="page room-page floor-gym">
      {demo && <MoveSheet name={demo.name} cue={demo.cue} onClose={() => setDemo(null)} />}
      {pickerOpen && (
        <ExercisePicker
          added={added.map((a) => a.name)}
          onPick={(ex) => { addFromLibrary(ex); setPickerOpen(false) }}
          onClose={() => setPickerOpen(false)}
        />
      )}
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
          {/* The open swap panel already shows the cardio picks. */}
          {!(swapOpen && swap?.to === 'cardio') && <div className="pill-select">
            {modalityOptions.map((opt) => (
              <button
                key={opt}
                className={workout.aerobic?.chosenOption === opt ? 'selected' : ''}
                onClick={() => setAerobic({ chosenOption: opt })}
              >
                {opt}
              </button>
            ))}
          </div>}
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

                {log && renderSets(ex.id, log, lastLog)}
              </div>
            )
          })}
          {addedSection}
        </div>
      )}

      {!exerciseDefs && (
        <div className="card">
          <h2>Extra exercises</h2>
          {!added.length && <p className="subtle">Add anything from the exercise library to this day.</p>}
          {addedSection}
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
