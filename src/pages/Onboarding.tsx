import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { midpoint } from '../lib/targets'
import { addDays, formatHuman, startOfWeek, todayISO } from '../lib/date'
import { TEMPLATES, resolvePlan, type PlanRef } from '../data/templates'
import { BLANK_DRAFT, HABIT_CHOICES, PRESETS, carbsFor, suggest, type About, type Draft } from '../data/onboarding'
import { GLASS_ML } from '../components/WaterGlasses'
import RoomHeader from '../components/RoomHeader'
import type { RoomId } from '../components/rooms'
import { EMPTY_DATA, type AppData, type Habit } from '../types'

const STEPS: { room: RoomId; title: string }[] = [
  { room: 'entrance', title: 'Who are you?' },
  { room: 'entrance', title: 'About you' },
  { room: 'gym', title: 'Fitness plan' },
  { room: 'office', title: 'Habits' },
  { room: 'kitchen', title: 'Eating targets' },
  { room: 'bedroom', title: 'Recovery targets' },
  { room: 'entrance', title: 'Ready' },
]

// Monday first, JS getDay() numbering.
const WEEKDAYS: { day: number; short: string }[] = [
  { day: 1, short: 'Mon' },
  { day: 2, short: 'Tue' },
  { day: 3, short: 'Wed' },
  { day: 4, short: 'Thu' },
  { day: 5, short: 'Fri' },
  { day: 6, short: 'Sat' },
  { day: 0, short: 'Sun' },
]

const nextMonday = () => addDays(startOfWeek(todayISO()), 7)
const num = (v: string) => (v === '' ? null : Number(v))

/** Sets up a new profile one room at a time: plan, habits, eating and recovery targets. */
export default function Onboarding() {
  const { hasProfile, addProfile } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(() => BLANK_DRAFT(nextMonday()))
  const [preset, setPreset] = useState<string | null>(null)

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const setAbout = (patch: Partial<About>) => setDraft((d) => ({ ...d, about: { ...d.about, ...patch } }))
  const food = { ...suggest(draft.about), ...draft.food }
  const moderate = food.caloriesModerate ?? midpoint(food.caloriesEasy, food.caloriesHard)
  const setFood = (key: keyof typeof food, v: number | null) =>
    setDraft((d) => {
      const next = { ...d.food }
      if (v == null) delete next[key]
      else next[key] = v
      return { ...d, food: next }
    })

  const planRef: PlanRef = { templateId: draft.templateId, startDate: draft.startDate, lengthDays: draft.lengthDays, trainingDays: draft.trainingDays }
  const plan = resolvePlan(planRef)

  const canNext = step !== 0 || draft.name.trim() !== ''
  const last = step === STEPS.length - 1

  const finish = () => {
    const proteinMin = Math.round((food.protein * 0.8) / 5) * 5
    const data: AppData = {
      ...EMPTY_DATA,
      habitList: draft.habits,
      profile: {
        name: draft.name.trim(),
        about: draft.about,
        plan: planRef,
        watch: draft.watch,
        baseTargets: {
          caloriesHard: food.caloriesHard,
          caloriesEasy: food.caloriesEasy,
          ...(food.caloriesModerate != null ? { caloriesModerate: food.caloriesModerate } : {}),
          protein: food.protein,
          proteinMin,
          waterL: food.waterL,
          waterMinL: +(Math.round((food.waterL * 0.75) / 0.2) * 0.2).toFixed(1),
          sleepHours: food.sleepHours,
          sleepHoursMin: Math.max(0, food.sleepHours - 1),
        },
        macros: {
          easy: { fat: food.fat, carbs: carbsFor(food.caloriesEasy, food.protein, food.fat) },
          hard: { fat: food.fat, carbs: carbsFor(food.caloriesHard, food.protein, food.fat) },
        },
      },
    }
    addProfile(data)
    navigate('/')
  }

  const pickPreset = (id: string | null) => {
    setPreset(id)
    const p = PRESETS.find((x) => x.id === id)
    setDraft(p ? p.draft() : BLANK_DRAFT(nextMonday()))
  }

  const toggleHabit = (h: Habit) =>
    set({ habits: draft.habits.some((x) => x.id === h.id) ? draft.habits.filter((x) => x.id !== h.id) : [...draft.habits, h] })
  const [customLabel, setCustomLabel] = useState('')
  const [customType, setCustomType] = useState<Habit['type']>('boolean')
  const addCustom = () => {
    const label = customLabel.trim()
    if (!label) return
    set({ habits: [...draft.habits, { id: `custom-${Date.now().toString(36)}`, label, type: customType }] })
    setCustomLabel('')
  }

  const toggleTrainingDay = (day: number) => {
    const has = draft.trainingDays.includes(day)
    if (!has && draft.trainingDays.length >= 3) return
    const days = has ? draft.trainingDays.filter((d) => d !== day) : [...draft.trainingDays, day]
    // Day 1, 2, 3 follow the week from Monday.
    set({ trainingDays: days.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)) })
  }
  const splitDaysOk = draft.templateId !== 'split3' || draft.trainingDays.length === 3

  const [openDay, setOpenDay] = useState<number | null>(null)
  const glasses = Math.max(1, Math.round((food.waterL * 1000) / GLASS_ML))

  const pill = (on: boolean, label: string, onClick: () => void, key?: string) => (
    <button key={key ?? label} className={on ? 'selected' : ''} aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  )

  const field = (label: string, value: number | null, onChange: (v: number | null) => void, step = 1) => (
    <div className="field">
      <label>{label}</label>
      <input type="number" inputMode="decimal" step={step} min={0} value={value ?? ''} onChange={(e) => onChange(num(e.target.value))} />
    </div>
  )

  return (
    <div className={`page room-page onboarding floor-${STEPS[step].room === 'entrance' ? 'hall' : STEPS[step].room}`}>
      <RoomHeader room={STEPS[step].room} title={STEPS[step].title} subtitle={`Step ${step + 1} of ${STEPS.length}`}>
        <div className="onb-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <i key={i} className={i <= step ? 'on' : ''} />
          ))}
        </div>
      </RoomHeader>

      {step === 0 && (
        <div className="card">
          {!hasProfile && <p className="subtle">Welcome to Quest. A few questions set up your plan, habits and targets; you can change everything later.</p>}
          {PRESETS.length > 0 && (
            <>
              <h2>Start from</h2>
              <div className="pill-select">
                {PRESETS.map((p) => pill(preset === p.id, `${p.label}'s answers`, () => pickPreset(p.id), p.id))}
                {pill(preset === null, 'Someone new', () => pickPreset(null))}
              </div>
            </>
          )}
          <div className="field">
            <label>Name</label>
            <input type="text" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your name" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <p className="subtle">Only used to suggest your eating and water targets.</p>
          {field('Age', draft.about.age, (v) => setAbout({ age: v }))}
          <div className="field">
            <label>Sex</label>
            <div className="pill-select">
              {pill(draft.about.sex === 'male', 'Male', () => setAbout({ sex: 'male' }))}
              {pill(draft.about.sex === 'female', 'Female', () => setAbout({ sex: 'female' }))}
            </div>
          </div>
          {field('Height (cm)', draft.about.heightCm, (v) => setAbout({ heightCm: v }))}
          {field('Weight (kg)', draft.about.weightKg, (v) => setAbout({ weightKg: v }), 0.1)}
          <div className="field">
            <label>How active</label>
            <div className="pill-select">
              {pill(draft.about.activity === 'light', 'Light', () => setAbout({ activity: 'light' }))}
              {pill(draft.about.activity === 'moderate', 'Moderate', () => setAbout({ activity: 'moderate' }))}
              {pill(draft.about.activity === 'very', 'Very', () => setAbout({ activity: 'very' }))}
            </div>
          </div>
          <div className="field">
            <label>Main goal</label>
            <div className="pill-select">
              {pill(draft.about.goal === 'lose', 'Lose fat', () => setAbout({ goal: 'lose' }))}
              {pill(draft.about.goal === 'muscle', 'Build muscle', () => setAbout({ goal: 'muscle' }))}
              {pill(draft.about.goal === 'hybrid', 'Hybrid athlete', () => setAbout({ goal: 'hybrid' }))}
              {pill(draft.about.goal === 'health', 'General health', () => setAbout({ goal: 'health' }))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="card">
            <h2>Plan</h2>
            <div className="pill-select">
              {TEMPLATES.map((t) => pill(draft.templateId === t.id, t.name, () => set({ templateId: t.id }), t.id))}
            </div>
            <p className="subtle">{TEMPLATES.find((t) => t.id === draft.templateId)!.blurb}</p>
            {draft.templateId === 'split3' && (
              <div className="field">
                <label>Training days (pick 3)</label>
                <div className="pill-select">
                  {WEEKDAYS.map((w) => pill(draft.trainingDays.includes(w.day), w.short, () => toggleTrainingDay(w.day), w.short))}
                </div>
              </div>
            )}
            <div className="field">
              <label>Start date</label>
              <input type="date" value={draft.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
            </div>
            <div className="field">
              <label>Length</label>
              <div className="pill-select">
                {[30, 60, 100].map((n) => pill(draft.lengthDays === n, `${n} days`, () => set({ lengthDays: n }), String(n)))}
              </div>
            </div>
          </div>
          <div className="card">
            <h2>Your week</h2>
            <div className="onb-week">
              {WEEKDAYS.map((w) => {
                const s = plan.sessions[plan.week[w.day]]
                const open = openDay === w.day && !!s.exercises
                return (
                  <div key={w.day} className={`onb-day${s.hard ? ' hard' : ''}`}>
                    <button className="onb-day-head" aria-expanded={open} disabled={!s.exercises} onClick={() => setOpenDay(open ? null : w.day)}>
                      <strong>{w.short}</strong>
                      <span>{s.label}</span>
                      {s.exercises && <span aria-hidden="true">{open ? '▲' : '▼'}</span>}
                    </button>
                    {open && (
                      <ul className="onb-exercises">
                        {s.exercises!.map((ex) => (
                          <li key={ex.id}>
                            <span>{ex.options.map((o) => o.name).join(' / ')}</span>
                            <span className="subtle">
                              {ex.target.sets} x {ex.target.reps}
                              {ex.startKg != null ? ` · ${ex.startKg} kg` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="card">
          <p className="subtle">Tick the habits to track each day. Minutes habits take any time you did.</p>
          {[...HABIT_CHOICES, ...draft.habits.filter((h) => !HABIT_CHOICES.some((c) => c.id === h.id))].map((h) => {
            const on = draft.habits.some((x) => x.id === h.id)
            return (
              <div key={h.id} className={`checklist-item${on ? ' done' : ''}`} onClick={() => toggleHabit(h)}>
                <input type="checkbox" checked={on} onChange={() => toggleHabit(h)} onClick={(e) => e.stopPropagation()} />
                <label>
                  {h.label}
                  <span className="subtle"> {h.type === 'minutes' ? '(minutes)' : '(yes/no)'}</span>
                </label>
              </div>
            )
          })}
          <div className="field">
            <label>Add your own</label>
            <input type="text" value={customLabel} placeholder="e.g. Cold shower" onChange={(e) => setCustomLabel(e.target.value)} />
          </div>
          <div className="pill-select">
            {pill(customType === 'boolean', 'Yes/no', () => setCustomType('boolean'))}
            {pill(customType === 'minutes', 'Minutes', () => setCustomType('minutes'))}
          </div>
          <button className="btn secondary full" style={{ marginTop: 8 }} onClick={addCustom} disabled={!customLabel.trim()}>
            + Add habit
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <p className="subtle">Suggested from your body numbers, activity and goal. These are estimates to start from; change them any time on Nutrition.</p>
          {field('Calories on training days (kcal)', food.caloriesHard, (v) => setFood('caloriesHard', v), 50)}
          {field('Calories on moderate days (kcal)', moderate, (v) => setFood('caloriesModerate', v), 25)}
          {field('Calories on rest days (kcal)', food.caloriesEasy, (v) => setFood('caloriesEasy', v), 50)}
          {field('Protein (g)', food.protein, (v) => setFood('protein', v), 5)}
          {field('Fat (g)', food.fat, (v) => setFood('fat', v), 5)}
          <p className="subtle">
            Carbs fill the rest: {carbsFor(food.caloriesHard, food.protein, food.fat)} g on training days,{' '}
            {carbsFor(food.caloriesEasy, food.protein, food.fat)} g on rest days.
          </p>
        </div>
      )}

      {step === 5 && (
        <div className="card">
          {field('Water (L)', food.waterL, (v) => setFood('waterL', v), 0.2)}
          <p className="subtle">{glasses} glasses of 200 ml to fill each day.</p>
          {field('Sleep (hours)', food.sleepHours, (v) => setFood('sleepHours', v), 0.5)}
          <div className="field">
            <label>Do you wear a watch that scores sleep and heart rate?</label>
            <div className="pill-select">
              {pill(draft.watch, 'Yes', () => set({ watch: true }))}
              {pill(!draft.watch, 'No', () => set({ watch: false }))}
            </div>
          </div>
          {!draft.watch && <p className="subtle">Sleep score and resting heart rate stay hidden.</p>}
        </div>
      )}

      {step === 6 && (
        <>
          <div className="card">
            <div className="card-kicker">Workout</div>
            <div className="card-title">{TEMPLATES.find((t) => t.id === draft.templateId)!.name}</div>
            <div className="subtle">
              {draft.lengthDays} days from {formatHuman(draft.startDate)} ·{' '}
              {WEEKDAYS.filter((w) => plan.week[w.day] !== 'rest').map((w) => w.short).join(', ')}
            </div>
          </div>
          <div className="card">
            <div className="card-kicker">Habits</div>
            <div className="subtle">{draft.habits.length ? draft.habits.map((h) => h.label).join(', ') : 'None yet'}</div>
          </div>
          <div className="card">
            <div className="card-kicker">Nutrition</div>
            <div className="subtle">
              {food.caloriesHard} kcal training days · {moderate} kcal moderate days · {food.caloriesEasy} kcal rest days · {food.protein} g protein
            </div>
          </div>
          <div className="card">
            <div className="card-kicker">Recovery</div>
            <div className="subtle">
              {food.waterL} L water · {food.sleepHours} h sleep{draft.watch ? ' · watch' : ''}
            </div>
          </div>
        </>
      )}

      <div className="onb-nav">
        {step > 0 ? (
          <button className="btn secondary" onClick={() => setStep(step - 1)}>◀ Back</button>
        ) : hasProfile ? (
          <button className="btn secondary" onClick={() => navigate('/')}>Cancel</button>
        ) : (
          <span />
        )}
        {last ? (
          <button className="btn" onClick={finish}>Start ▶</button>
        ) : (
          <button className="btn" disabled={!canNext || (step === 2 && !splitDaysOk)} onClick={() => setStep(step + 1)}>
            Next ▶
          </button>
        )}
      </div>
    </div>
  )
}
