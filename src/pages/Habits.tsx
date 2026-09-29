import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays } from '../lib/date'
import { HABIT_DEFS } from '../data/plan'
import RoomHeader from '../components/RoomHeader'
import { useDaySwipe, useSwipeInClass } from '../lib/useDaySwipe'
import WaterGlasses from '../components/WaterGlasses'

export default function Habits() {
  const { date } = useParams<{ date: string }>()
  const iso = date ?? todayISO()
  const swipe = useDaySwipe('habits', iso)
  const swipeIn = useSwipeInClass()
  const { data, setData } = useStore()
  const habits = data.habits[iso] ?? {}

  const setHabit = (id: string, value: number | boolean) => {
    setData((prev) => ({ ...prev, habits: { ...prev.habits, [iso]: { ...prev.habits[iso], [id]: value } } }))
  }

  return (
    <div key={iso} className={`page room-page floor-bedroom${swipeIn}`} {...swipe}>

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

    </div>
  )
}
