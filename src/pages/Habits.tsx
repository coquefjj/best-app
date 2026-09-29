import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, addDays } from '../lib/date'
import RoomHeader from '../components/RoomHeader'
import DaySwiper from '../components/DaySwiper'
import { bestStreak, currentStreak, habitDone, recentDays } from '../lib/streaks'
import type { Habit } from '../types'

const STRIP_DAYS = 14

export default function Habits() {
  const { date } = useParams<{ date: string }>()
  return <DaySwiper base="habits" iso={date ?? todayISO()} renderDay={(iso) => <HabitsDay iso={iso} />} />
}

function HabitsDay({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const [editing, setEditing] = useState(false)
  const day = data.habits[iso] ?? {}
  const list = data.habitList

  const setValue = (id: string, value: number | boolean | undefined) => {
    setData((prev) => ({ ...prev, habits: { ...prev.habits, [iso]: { ...prev.habits[iso], [id]: value } } }))
  }

  const doneCount = list.filter((h) => habitDone(h, day[h.id])).length

  return (
    <div className="page room-page floor-office">
      <RoomHeader room="office" title="Streaks" subtitle={`${doneCount} of ${list.length} logged`}>
        <div className="top-bar">
          <Link to={`/habits/${addDays(iso, -1)}`} className="arrow-btn" aria-label="Previous day">◀</Link>
          <strong>{formatHuman(iso)}</strong>
          <Link to={`/habits/${addDays(iso, 1)}`} className="arrow-btn" aria-label="Next day">▶</Link>
        </div>
      </RoomHeader>

      {editing ? (
        <EditHabits onDone={() => setEditing(false)} />
      ) : (
        <>
          <div className="card">
            {list.length === 0 && <p className="subtle">No habits yet. Tap Edit habits to add one.</p>}
            {list.map((h) => (
              <HabitRow key={h.id} habit={h} iso={iso} value={day[h.id]} onChange={(v) => setValue(h.id, v)} />
            ))}
          </div>
          <button className="btn secondary full habits-edit-btn" onClick={() => setEditing(true)}>
            Edit habits
          </button>
          <p className="subtle habits-note">A day counts toward the streak when it's logged. Time habits count any amount.</p>
        </>
      )}
    </div>
  )
}

function HabitRow({
  habit: h,
  iso,
  value,
  onChange,
}: {
  habit: Habit
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

/** Add, rename and remove habits. Removing one hides it; its old entries stay saved. */
function EditHabits({ onDone }: { onDone: () => void }) {
  const { data, setData } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<Habit['type']>('boolean')

  const setList = (fn: (list: Habit[]) => Habit[]) => setData((prev) => ({ ...prev, habitList: fn(prev.habitList) }))

  const add = () => {
    const label = name.trim()
    if (!label) return
    setList((list) => [...list, { id: `h-${Date.now().toString(36)}`, label, type }])
    setName('')
  }

  const remove = (h: Habit) => {
    if (window.confirm(`Remove "${h.label}"? Its past entries stay saved.`)) setList((list) => list.filter((x) => x.id !== h.id))
  }

  return (
    <>
      <div className="card">
        <h2>Your habits</h2>
        {data.habitList.length === 0 && <p className="subtle">No habits yet.</p>}
        {data.habitList.map((h) => (
          <div className="habit-edit-row" key={h.id}>
            <input
              type="text"
              aria-label="Habit name"
              value={h.label}
              onChange={(e) => setList((list) => list.map((x) => (x.id === h.id ? { ...x, label: e.target.value } : x)))}
              onBlur={() => !h.label.trim() && setList((list) => list.map((x) => (x.id === h.id ? { ...x, label: 'Habit' } : x)))}
            />
            <span className="subtle habit-edit-type">{h.type === 'minutes' ? 'Time' : 'Yes/no'}</span>
            <button className="habit-remove" aria-label={`Remove ${h.label}`} onClick={() => remove(h)}>✕</button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Add a habit</h2>
        <div className="field">
          <label htmlFor="new-habit">Name</label>
          <input
            id="new-habit"
            type="text"
            placeholder="e.g. Cold shower"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>
        <div className="segmented habit-type" role="group" aria-label="How to log it">
          <button className={type === 'boolean' ? 'selected' : ''} onClick={() => setType('boolean')}>Yes / no</button>
          <button className={type === 'minutes' ? 'selected' : ''} onClick={() => setType('minutes')}>Time (min)</button>
        </div>
        <button className="btn full" disabled={!name.trim()} onClick={add}>+ Add habit</button>
      </div>

      <button className="btn secondary full habits-edit-btn" onClick={onDone}>Done</button>
    </>
  )
}
