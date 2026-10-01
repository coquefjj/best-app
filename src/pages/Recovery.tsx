import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays } from '../lib/date'
import { HABIT_DEFS } from '../data/plan'
import RoomHeader from '../components/RoomHeader'
import DaySwiper from '../components/DaySwiper'
import WaterGlasses from '../components/WaterGlasses'
import RecoveryProgress from '../components/RecoveryProgress'

export default function Recovery() {
  const { date } = useParams<{ date: string }>()
  return <DaySwiper base="recovery" iso={date ?? todayISO()} renderDay={(iso) => <RecoveryDay iso={iso} />} />
}

function RecoveryDay({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const day = data.habits[iso] ?? {}
  const [showProgress, setShowProgress] = useState(false)

  const setValue = (id: string, value: number | undefined) => {
    setData((prev) => ({ ...prev, habits: { ...prev.habits, [iso]: { ...prev.habits[iso], [id]: value } } }))
  }

  return (
    <div className="page room-page floor-bedroom">

      <RoomHeader room="bedroom" title="Daily log" subtitle="Water, sleep and heart rate">
        <div className="top-bar">
          <Link to={`/recovery/${addDays(iso, -1)}`} className="arrow-btn" aria-label="Previous day">◀</Link>
          <strong>{formatHuman(iso)}</strong>
          <Link to={`/recovery/${addDays(iso, 1)}`} className="arrow-btn" aria-label="Next day">▶</Link>
        </div>
      </RoomHeader>

      <div className="card">
        <WaterGlasses iso={iso} />
      </div>

      <div className="card">
        <h2>Sleep &amp; heart</h2>
        {HABIT_DEFS.filter((h) => h.id !== 'water').map((h) => (
          <div className="field" key={h.id}>
            <label>{h.label}{h.unit ? ` (${h.unit})` : ''}</label>
            <input
              type="number"
              inputMode="decimal"
              value={(day[h.id] as number) ?? ''}
              onChange={(e) => setValue(h.id, e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <button
        className={`btn secondary full progress-toggle${showProgress ? ' open' : ''}`}
        aria-expanded={showProgress}
        onClick={() => setShowProgress((v) => !v)}
      >
        <span>Progress</span>
        <span aria-hidden="true">{showProgress ? '▲' : '▼'}</span>
      </button>
      {showProgress && <RecoveryProgress />}
    </div>
  )
}
