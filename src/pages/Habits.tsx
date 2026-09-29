import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays } from '../lib/date'
import RoomHeader from '../components/RoomHeader'
import DaySwiper from '../components/DaySwiper'
import { STREAK_HABITS, bestStreak, currentStreak, habitDone, recentDays, type StreakHabit } from '../lib/streaks'

const STRIP_DAYS = 14

export default function Habits() {
  const { date } = useParams<{ date: string }>()
  return <DaySwiper base="habits" iso={date ?? todayISO()} renderDay={(iso) => <HabitsDay iso={iso} />} />
}

function HabitsDay({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const day = data.habits[iso] ?? {}

  const setValue = (id: string, value: number | boolean | undefined) => {
    setData((prev) => ({ ...prev, habits: { ...prev.habits, [iso]: { ...prev.habits[iso], [id]: value } } }))
  }

  const doneCount = STREAK_HABITS.filter((h) => habitDone(h, day[h.id])).length

  return (
    <div className="page room-page floor-office">
      <RoomHeader room="office" title="Streaks" subtitle={`${doneCount} of ${STREAK_HABITS.length} logged`}>
        <div className="top-bar">
          <Link to={`/habits/${addDays(iso, -1)}`} className="arrow-btn" aria-label="Previous day">◀</Link>
          <strong>{formatHuman(iso)}</strong>
          <Link to={`/habits/${addDays(iso, 1)}`} className="arrow-btn" aria-label="Next day">▶</Link>
        </div>
      </RoomHeader>

      <div className="card">
        {STREAK_HABITS.map((h) => (
          <HabitRow key={h.id} habit={h} iso={iso} value={day[h.id]} onChange={(v) => setValue(h.id, v)} />
        ))}
      </div>

      <p className="subtle habits-note">A day counts toward the streak when it's logged. Time habits count any amount.</p>
    </div>
  )
}

function HabitRow({
  habit: h,
  iso,
  value,
  onChange,
}: {
  habit: StreakHabit
  iso: string
  value: number | boolean | undefined
  onChange: (v: number | boolean | undefined) => void
}) {
  const { data } = useStore()
  const done = habitDone(h, value)
  const streak = currentStreak(data, h, iso)
  const best = bestStreak(data, h, iso)
  const days = recentDays(data, h, iso, STRIP_DAYS)

  return (
    <div className={`habit${done ? ' done' : ''}`}>
      <div className="habit-head">
        <label className="habit-name" htmlFor={`habit-${h.id}-${iso}`}>{h.label}</label>
        {h.type === 'boolean' ? (
          <input
            id={`habit-${h.id}-${iso}`}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
        ) : (
          <span className="habit-time">
            <input
              id={`habit-${h.id}-${iso}`}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="--"
              value={typeof value === 'number' ? value : ''}
              onChange={(e) => onChange(e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))}
            />
            <span className="subtle">min</span>
          </span>
        )}
      </div>
      <div className="habit-streak">
        <span>
          <strong className="streak-num">{streak}</strong> {streak === 1 ? 'day' : 'days'} in a row
        </span>
        <span className="subtle">Best {best}</span>
      </div>
      <div className="streak-strip" aria-label={`Last ${STRIP_DAYS} days`}>
        {days.map((d) => (
          <i key={d.iso} className={`${d.done ? 'on' : ''}${d.iso === iso ? ' today' : ''}`} title={formatHuman(d.iso)} />
        ))}
      </div>
    </div>
  )
}
