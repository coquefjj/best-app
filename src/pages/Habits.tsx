import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays } from '../lib/date'
import { HABIT_DEFS } from '../data/plan'
import { useState } from 'react'
import RoomHeader from '../components/RoomHeader'
import WaterGlasses from '../components/WaterGlasses'

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
    <div className="page room-page floor-bedroom">

      <RoomHeader room="bedroom" title="Daily log" subtitle="Water, sleep, heart rate and routines">
        <div className="top-bar">
          <Link to={`/habits/${addDays(iso, -1)}`} className="arrow-btn" aria-label="Previous day">◀</Link>
          <strong>{formatHuman(iso)}</strong>
          <Link to={`/habits/${addDays(iso, 1)}`} className="arrow-btn" aria-label="Next day">▶</Link>
        </div>
      </RoomHeader>

      <div className="card">
        <WaterGlasses iso={iso} />
      </div>

      <div className="card">
        <h2>Numbers</h2>
        {HABIT_DEFS.filter((h) => h.type === 'number' && h.id !== 'water').map((h) => (
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
        <h2>Habits</h2>
        {HABIT_DEFS.filter((h) => h.type === 'boolean').map((h) => (
          <div className={`checklist-item${habits[h.id] ? ' done' : ''}`} key={h.id} onClick={() => setHabit(h.id, !habits[h.id])}>
            <input type="checkbox" checked={!!habits[h.id]} onChange={() => setHabit(h.id, !habits[h.id])} onClick={(e) => e.stopPropagation()} />
            <label>{h.label}</label>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Check-in (every 2 weeks)</h2>
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
