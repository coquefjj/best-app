import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays } from '../lib/date'
import { HABIT_DEFS } from '../data/plan'
import RoomHeader from '../components/RoomHeader'
import DaySwiper from '../components/DaySwiper'
import WaterGlasses from '../components/WaterGlasses'
import RecoveryProgress from '../components/RecoveryProgress'
import TargetSettings from '../components/TargetSettings'

export default function Recovery() {
  const { date } = useParams<{ date: string }>()
  return <DaySwiper base="recovery" iso={date ?? todayISO()} renderDay={(iso) => <RecoveryDay iso={iso} />} />
}

function RecoveryDay({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const day = data.habits[iso] ?? {}
  const [showProgress, setShowProgress] = useState(false)
  // Without a watch there is no sleep score or resting heart rate to type in.
  const watch = data.profile?.watch !== false

  const setValue = (id: string, value: number | undefined) => {
    setData((prev) => ({ ...prev, habits: { ...prev.habits, [iso]: { ...prev.habits[iso], [id]: value } } }))
  }

  return (
    <div className="page room-page floor-bedroom">

      <RoomHeader room="bedroom" title="Daily log" subtitle={watch ? 'Water, sleep and heart rate' : 'Water and sleep'}>
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
        <h2>{watch ? <>Sleep &amp; heart</> : 'Sleep'}</h2>
        {HABIT_DEFS.filter((h) => h.id !== 'water' && (watch || h.id === 'sleepHours')).map((h) => (
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

      <TargetSettings
        rows={[
          { label: 'Water', unit: 'L', target: 'waterL', min: 'waterMinL', step: 0.2 },
          { label: 'Sleep', unit: 'h', target: 'sleepHours', min: 'sleepHoursMin', step: 0.5 },
          ...(watch ? [{ label: 'Sleep score', unit: '', target: 'sleepScore', min: 'sleepScoreMin' } as const] : []),
        ]}
        note={`The water target also sets how many glasses you fill. On the Home calendar a day is green when all ${watch ? 'three are' : 'are'} on target, yellow when at least one reaches its minimum, red when none do.`}
      />

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
