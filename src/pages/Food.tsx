import { useState } from 'react'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays } from '../lib/date'
import { getDayInfo } from '../lib/session'
import type { FoodEntry, SavedMeal } from '../types'
import RoomHeader from '../components/RoomHeader'
import { Link, useParams } from 'react-router-dom'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const MEAL_SLOTS: FoodEntry['mealSlot'][] = ['breakfast', 'lunch', 'dinner', 'snack']

export default function Food() {
  const { date } = useParams<{ date: string }>()
  const iso = date ?? todayISO()
  const { data, setData } = useStore()
  const info = getDayInfo(iso)
  const entries = data.food[iso]?.entries ?? []
  const [showForm, setShowForm] = useState(false)
  const [saveAsMeal, setSaveAsMeal] = useState(false)
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', mealSlot: 'breakfast' as FoodEntry['mealSlot'] })

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const addEntry = (entry: Omit<FoodEntry, 'id'>) => {
    setData((prev) => ({
      ...prev,
      food: {
        ...prev.food,
        [iso]: { entries: [...(prev.food[iso]?.entries ?? []), { ...entry, id: uid() }] },
      },
    }))
  }

  const removeEntry = (id: string) => {
    setData((prev) => ({
      ...prev,
      food: { ...prev.food, [iso]: { entries: (prev.food[iso]?.entries ?? []).filter((e) => e.id !== id) } },
    }))
  }

  const addFromMeal = (meal: SavedMeal) => {
    addEntry({ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, mealSlot: meal.mealSlot })
  }

  const submitForm = () => {
    if (!form.name.trim()) return
    const entry = {
      name: form.name.trim(),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      mealSlot: form.mealSlot,
    }
    addEntry(entry)
    if (saveAsMeal) {
      setData((prev) => ({ ...prev, savedMeals: [...prev.savedMeals, { ...entry, id: uid() }] }))
    }
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', mealSlot: 'breakfast' })
    setSaveAsMeal(false)
    setShowForm(false)
  }

  const removeSavedMeal = (id: string) => {
    setData((prev) => ({ ...prev, savedMeals: prev.savedMeals.filter((m) => m.id !== id) }))
  }

  return (
    <div className="page">
      <div className="top-bar">
        <Link to={`/food/${addDays(iso, -1)}`} className="arrow-btn" aria-label="Previous day">◀</Link>
        <strong>{formatHuman(iso)}</strong>
        <Link to={`/food/${addDays(iso, 1)}`} className="arrow-btn" aria-label="Next day">▶</Link>
      </div>

      <RoomHeader room="kitchen" title="Food log" subtitle={`Target today: ${info.nutrition.calories} kcal · ${info.nutrition.protein} g protein`} />

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
      </div>

      {data.savedMeals.length > 0 && (
        <div className="card">
          <h2>Saved meals</h2>
          {data.savedMeals.map((m) => (
            <div className="food-entry" key={m.id}>
              <span onClick={() => addFromMeal(m)} style={{ cursor: 'pointer' }}>
                + {m.name} <span className="subtle">({m.calories} kcal, {m.protein}g P)</span>
              </span>
              <button className="icon-btn" onClick={() => removeSavedMeal(m.id)}>remove</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Eaten today</h2>
        {entries.length === 0 && <div className="subtle">Nothing logged yet.</div>}
        {entries.map((e) => (
          <div className="food-entry" key={e.id}>
            <span>
              {e.name} <span className="subtle">({e.mealSlot}) · {e.calories} kcal, {e.protein}g P</span>
            </span>
            <button className="icon-btn" onClick={() => removeEntry(e.id)}>✕</button>
          </div>
        ))}

        {!showForm ? (
          <button className="btn secondary full" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>
            + Add food
          </button>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken + rice" />
            </div>
            <div className="field">
              <label>Meal</label>
              <select value={form.mealSlot} onChange={(e) => setForm({ ...form, mealSlot: e.target.value as FoodEntry['mealSlot'] })}>
                {MEAL_SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Calories</label>
                <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Protein (g)</label>
                <input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Carbs (g)</label>
                <input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Fat (g)</label>
                <input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
              </div>
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
    </div>
  )
}
