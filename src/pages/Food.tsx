import { useState } from 'react'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays, nowHHMM, hhmmToMinutes, formatMinutes } from '../lib/date'
import { getDayInfo } from '../lib/session'
import type { FoodEntry, SavedMeal } from '../types'
import RoomHeader from '../components/RoomHeader'
import DaySwiper from '../components/DaySwiper'
import NutritionProgress from '../components/NutritionProgress'
import { PICKABLE_SLOTS, nearestSlot, slotInfo } from '../data/meals'
import { Link, useParams } from 'react-router-dom'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

type MealForm = { name: string; calories: string; protein: string; carbs: string; fat: string; mealSlot: FoodEntry['mealSlot'] }
type MealValues = Omit<FoodEntry, 'id'>

const EMPTY_FORM: MealForm = { name: '', calories: '', protein: '', carbs: '', fat: '', mealSlot: 'breakfast' }

function toForm(m: MealValues): MealForm {
  return { name: m.name, calories: String(m.calories), protein: String(m.protein), carbs: String(m.carbs), fat: String(m.fat), mealSlot: m.mealSlot }
}

function fromForm(f: MealForm): MealValues {
  return {
    name: f.name.trim(),
    calories: Number(f.calories) || 0,
    protein: Number(f.protein) || 0,
    carbs: Number(f.carbs) || 0,
    fat: Number(f.fat) || 0,
    mealSlot: f.mealSlot,
  }
}

function MealFields({ form, setForm }: { form: MealForm; setForm: (f: MealForm) => void }) {
  return (
    <>
      <div className="field">
        <label>Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken + rice" />
      </div>
      <div className="field">
        <label>Meal</label>
        <select value={form.mealSlot} onChange={(e) => setForm({ ...form, mealSlot: e.target.value as FoodEntry['mealSlot'] })}>
          {PICKABLE_SLOTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
          {form.mealSlot === 'snack' && <option value="snack">Snack</option>}
        </select>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Calories</label>
          <input type="number" inputMode="decimal" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Protein (g)</label>
          <input type="number" inputMode="decimal" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
        </div>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Carbs (g)</label>
          <input type="number" inputMode="decimal" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Fat (g)</label>
          <input type="number" inputMode="decimal" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
        </div>
      </div>
    </>
  )
}

// Inline editor that replaces a row while it is being changed
function MealEditor({ initial, onSave, onCancel, onDelete, note, withTime = false }: {
  initial: MealValues
  onSave: (m: MealValues) => void
  onCancel: () => void
  onDelete: () => void
  note?: string
  /** Show the time eaten (logged food only; saved meals have no time). */
  withTime?: boolean
}) {
  const [form, setForm] = useState(() => toForm(initial))
  const [time, setTime] = useState(initial.time ?? '')
  const save = () => {
    if (!form.name.trim()) return
    onSave(withTime ? { ...fromForm(form), time: time || undefined } : fromForm(form))
  }
  return (
    <div className="meal-editor">
      {withTime && (
        <div className="field">
          <label>Time eaten</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      )}
      <MealFields form={form} setForm={setForm} />
      {note && <div className="subtle" style={{ marginBottom: 8 }}>{note}</div>}
      <div className="row">
        <button className="btn secondary" onClick={onCancel}>Cancel</button>
        <button className="btn" onClick={save}>Save</button>
      </div>
      <button className="btn danger full" style={{ marginTop: 8 }} onClick={onDelete}>Delete</button>
    </div>
  )
}

export default function Food() {
  const { date } = useParams<{ date: string }>()
  return <DaySwiper base="food" iso={date ?? todayISO()} renderDay={(iso) => <FoodDay iso={iso} />} />
}

function FoodDay({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const info = getDayInfo(iso)
  const entries = data.food[iso]?.entries ?? []
  // Earliest first; food logged before times were saved keeps its order at the top.
  const shown = [...entries].sort((a, b) => (hhmmToMinutes(a.time) ?? -1) - (hhmmToMinutes(b.time) ?? -1))
  const [showProgress, setShowProgress] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saveAsMeal, setSaveAsMeal] = useState(false)
  const [form, setForm] = useState<MealForm>(EMPTY_FORM)
  // New food starts at its meal's preset time; picking another meal moves it to that preset.
  const [newTime, setNewTime] = useState('')
  const setNewForm = (f: MealForm) => {
    if (f.mealSlot !== form.mealSlot) setNewTime(slotInfo(f.mealSlot).time)
    setForm(f)
  }
  const openForm = () => {
    const slot = nearestSlot(hhmmToMinutes(nowHHMM())!)
    setForm({ ...EMPTY_FORM, mealSlot: slot })
    setNewTime(slotInfo(slot).time)
    setShowForm(true)
  }
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editingMeal, setEditingMeal] = useState<string | null>(null)

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
  const burned = data.workouts[iso]?.aerobic?.caloriesBurned ?? 0

  const addEntry = (entry: Omit<FoodEntry, 'id'>) => {
    setData((prev) => ({
      ...prev,
      food: {
        ...prev.food,
        [iso]: { entries: [...(prev.food[iso]?.entries ?? []), { ...entry, time: entry.time ?? nowHHMM(), id: uid() }] },
      },
    }))
  }

  const removeEntry = (id: string) => {
    setData((prev) => ({
      ...prev,
      food: { ...prev.food, [iso]: { entries: (prev.food[iso]?.entries ?? []).filter((e) => e.id !== id) } },
    }))
  }

  const updateEntry = (id: string, values: MealValues) => {
    setData((prev) => ({
      ...prev,
      food: {
        ...prev.food,
        [iso]: { entries: (prev.food[iso]?.entries ?? []).map((e) => (e.id === id ? { ...values, id } : e)) },
      },
    }))
    setEditingEntry(null)
  }

  const updateSavedMeal = (id: string, values: MealValues) => {
    setData((prev) => ({ ...prev, savedMeals: prev.savedMeals.map((m) => (m.id === id ? { ...values, id } : m)) }))
    setEditingMeal(null)
  }

  const addFromMeal = (meal: SavedMeal) => {
    addEntry({ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, mealSlot: meal.mealSlot, time: slotInfo(meal.mealSlot).time })
    setShowForm(false)
  }

  const submitForm = () => {
    if (!form.name.trim()) return
    const entry = fromForm(form)
    addEntry({ ...entry, time: newTime || undefined })
    if (saveAsMeal) {
      // Saving under an existing name replaces that saved meal
      setData((prev) => ({
        ...prev,
        savedMeals: [
          ...prev.savedMeals.filter((m) => m.name.toLowerCase() !== entry.name.toLowerCase()),
          { ...entry, id: uid() },
        ],
      }))
    }
    setForm(EMPTY_FORM)
    setSaveAsMeal(false)
    setShowForm(false)
  }

  const removeSavedMeal = (id: string) => {
    setData((prev) => ({ ...prev, savedMeals: prev.savedMeals.filter((m) => m.id !== id) }))
    setEditingMeal(null)
  }

  return (
    <div className="page room-page floor-kitchen">

      <RoomHeader room="kitchen" title="Food log" subtitle={`Target today: ${info.nutrition.calories} kcal · ${info.nutrition.protein} g protein`}>
        <div className="top-bar">
          <Link to={`/food/${addDays(iso, -1)}`} className="arrow-btn" aria-label="Previous day">◀</Link>
          <strong>{formatHuman(iso)}</strong>
          <Link to={`/food/${addDays(iso, 1)}`} className="arrow-btn" aria-label="Next day">▶</Link>
        </div>
      </RoomHeader>

      <div className="card">
        <h2>Totals</h2>
        <div className="stat-grid">
          <div>
            <div className="stat-value">{Math.round(totals.calories)}</div>
            <div className="stat-label">kcal / {info.nutrition.calories}</div>
          </div>
          <div>
            <div className="stat-value">{Math.round(totals.protein)}g</div>
            <div className="stat-label">protein / {info.nutrition.protein}g</div>
          </div>
          <div>
            <div className="stat-value">{Math.round(totals.carbs)}g / {Math.round(totals.fat)}g</div>
            <div className="stat-label">carbs / fat</div>
          </div>
        </div>
        {burned > 0 && (
          <div className="subtle burned-line">
            Burned in workout: {Math.round(burned)} kcal · Net: {Math.round(totals.calories - burned)} kcal
          </div>
        )}
      </div>

      <div className="card">
        <h2>Eaten today</h2>
        {entries.length === 0 && <div className="subtle">Nothing logged yet.</div>}
        {shown.map((e) =>
          editingEntry === e.id ? (
            <MealEditor
              key={e.id}
              withTime
              initial={e}
              onSave={(v) => updateEntry(e.id, v)}
              onCancel={() => setEditingEntry(null)}
              onDelete={() => removeEntry(e.id)}
            />
          ) : (
            <div className="food-entry" key={e.id}>
              <button className="entry-text" onClick={() => setEditingEntry(e.id)}>
                {e.time && <span className="entry-time">{formatMinutes(hhmmToMinutes(e.time)!)}</span>}
                {e.name} <span className="subtle">({slotInfo(e.mealSlot).label.toLowerCase()}) · {e.calories} kcal, {e.protein}g P · {e.carbs}g C · {e.fat}g F</span>
              </button>
              <button className="icon-btn edit" aria-label={`Edit ${e.name}`} onClick={() => setEditingEntry(e.id)}>✎</button>
              <button className="icon-btn" aria-label={`Delete ${e.name}`} onClick={() => removeEntry(e.id)}>✕</button>
            </div>
          ),
        )}

        {!showForm ? (
          <button className="btn secondary full" style={{ marginTop: 12 }} onClick={openForm}>
            + Add food
          </button>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div className="quick-add">
              <h3>Quick add</h3>
              {data.savedMeals.length === 0 ? (
                <div className="subtle">No saved meals yet. Tick "Save as a meal" below and it will show up here.</div>
              ) : (
                data.savedMeals.map((m) =>
                  editingMeal === m.id ? (
                    <MealEditor
                      key={m.id}
                      initial={m}
                      note="Changes apply next time you log it. Food already logged stays as it was."
                      onSave={(v) => updateSavedMeal(m.id, v)}
                      onCancel={() => setEditingMeal(null)}
                      onDelete={() => removeSavedMeal(m.id)}
                    />
                  ) : (
                    <div className="food-entry" key={m.id}>
                      <button className="quick-meal" onClick={() => addFromMeal(m)}>
                        <strong>+ {m.name}</strong>
                        <span className="subtle">{slotInfo(m.mealSlot).label} · {m.calories} kcal · {m.protein}g P · {m.carbs}g C · {m.fat}g F</span>
                      </button>
                      <button className="icon-btn edit" aria-label={`Edit saved meal ${m.name}`} onClick={() => setEditingMeal(m.id)}>✎</button>
                      <button className="icon-btn" aria-label={`Delete saved meal ${m.name}`} onClick={() => removeSavedMeal(m.id)}>✕</button>
                    </div>
                  ),
                )
              )}
              <h3>Or enter a new one</h3>
            </div>
            <MealFields form={form} setForm={setNewForm} />
            <div className="field">
              <label>Time eaten</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
            <div className="checklist-item" onClick={() => setSaveAsMeal((v) => !v)}>
              <input type="checkbox" checked={saveAsMeal} onChange={(e) => setSaveAsMeal(e.target.checked)} onClick={(e) => e.stopPropagation()} />
              <label>Save as a meal for quick logging later</label>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn" onClick={submitForm}>Add</button>
            </div>
          </div>
        )}
      </div>

      <button
        className={`btn secondary full progress-toggle${showProgress ? ' open' : ''}`}
        aria-expanded={showProgress}
        onClick={() => setShowProgress((v) => !v)}
      >
        <span>Progress</span>
        <span aria-hidden="true">{showProgress ? '▲' : '▼'}</span>
      </button>
      {showProgress && <NutritionProgress />}
    </div>
  )
}
