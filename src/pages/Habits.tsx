import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays } from '../lib/date'
import { HABIT_DEFS } from '../data/plan'
import { useState } from 'react'
import Sprite from '../components/Sprite'

export default function Habits() {
  const { date } = useParams<{ date: string }>()
  const iso = date ?? todayISO()
  const { data, setData } = useStore()
  const habits = data.habits[iso] ?? {}
  const [waistInput, setWaistInput] = useState('')

  const setHabit = (id: string, value: number | boolean) => {
    setData((prev) => ({ ...prev, habits: { ...prev.habits, [iso]: { ...prev.habits[iso], [id]: value } } }))
  }

  const addCheckIn = () => {
    const waist = Number(waistInput)
    if (!waist) return
    setData((prev) => ({
      ...prev,
      checkIns: [...prev.checkIns.filter((c) => c.date !== iso), { date: iso, waistCm: waist, notes: '' }],
    }))
    setWaistInput('')
  }

  const existingCheckIn = data.checkIns.find((c) => c.date === iso)

  return (
    <div className="page">
      <div className="top-bar">
        <Link to={`/habits/${addDays(iso, -1)}`} className="arrow-btn" aria-label="Previous day">◀</Link>
        <strong>{formatHuman(iso)}</strong>
        <Link to={`/habits/${addDays(iso, 1)}`} className="arrow-btn" aria-label="Next day">▶</Link>
      </div>

      <div className="page-header">
        <Sprite name="potion" scale={3} />
        <h1>Trainer stats</h1>
      </div>

      <div className="card">
        <h2><Sprite name="heart" scale={2} /> Vitals</h2>
        {HABIT_DEFS.filter((h) => h.type === 'number').map((h) => (
          <div className="field" key={h.id}>
            <label>{h.label}{h.unit ? ` (${h.unit})` : ''}</label>
            <input
              type="number"
              value={(habits[h.id] as number) ?? ''}
              onChange={(e) => setHabit(h.id, e.target.value === '' ? 0 : Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Daily habits</h2>
        {HABIT_DEFS.filter((h) => h.type === 'boolean').map((h) => (
          <div className={`checklist-item${habits[h.id] ? ' done' : ''}`} key={h.id} onClick={() => setHabit(h.id, !habits[h.id])}>
            <input type="checkbox" checked={!!habits[h.id]} onChange={() => setHabit(h.id, !habits[h.id])} onClick={(e) => e.stopPropagation()} />
            <label>{h.label}</label>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Checkpoint (every 2 weeks)</h2>
        <p className="subtle">Waist measurement (at navel) + progress photos, same light &amp; pose.</p>
        <div className="field">
          <label>Waist (cm)</label>
          <input type="number" value={existingCheckIn?.waistCm ?? waistInput} onChange={(e) => setWaistInput(e.target.value)} />
        </div>
        <button className="btn secondary" onClick={addCheckIn}>Save check-in</button>
      </div>
    </div>
  )
}
