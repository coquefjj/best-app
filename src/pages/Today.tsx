import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman, formatClock } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { nutritionTarget } from '../lib/targets'
import { PLAN_LENGTH_DAYS } from '../data/plan'
import RoomHeader from '../components/RoomHeader'
import WaterGlasses from '../components/WaterGlasses'

export default function Today() {
  const { data, setData } = useStore()
  const iso = todayISO()
  const info = getDayInfo(iso)
  const nTarget = nutritionTarget(data, iso)
  const workout = data.workouts[iso]
  const habits = data.habits[iso] ?? {}
  const food = data.food[iso]?.entries ?? []

  const totals = food.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
    }),
    { calories: 0, protein: 0 },
  )

  const quickHabits = data.habitList.filter((h) => h.type === 'boolean')

  const toggleHabit = (id: string, current: boolean) => {
    setData((prev) => ({
      ...prev,
      habits: { ...prev.habits, [iso]: { ...prev.habits[iso], [id]: !current } },
    }))
  }

  const toggleMobility = () => {
    setData((prev) => ({
      ...prev,
      workouts: {
        ...prev.workouts,
        [iso]: {
          ...prev.workouts[iso],
          mobilityDone: !(prev.workouts[iso]?.mobilityDone ?? false),
          exercises: prev.workouts[iso]?.exercises ?? {},
        },
      },
    }))
  }

  const exerciseCount = workout ? Object.keys(workout.exercises).length : 0
  const proteinPct = Math.min(100, Math.round((totals.protein / nTarget.protein) * 100))
  const caloriePct = Math.min(100, Math.round((totals.calories / nTarget.calories) * 100))
  const mobilityDone = workout?.mobilityDone ?? false

  return (
    <div className="page room-page floor-hall">
      <RoomHeader
        room="entrance"
        title={formatHuman(iso)}
        subtitle={info.inPlan ? `Day ${info.dayNum} of ${PLAN_LENGTH_DAYS}` : 'Outside the plan'}
      >
        <div className="top-bar">
          <Link to="/" className="arrow-btn" aria-label="Back to the house">◀</Link>
          {info.inPlan ? (
            <span className={`badge${info.deload ? ' deload' : ''}`}>{info.deload ? 'Deload' : `Week ${info.weekNumber}`}</span>
          ) : (
            <span />
          )}
        </div>
      </RoomHeader>

      <Link to={`/workout/${iso}`} className="card">
        <div className="card-kicker">Today's training</div>
        <div className="card-title">{info.label}</div>
        {workout?.completedAt ? (
          <div className="done-line">
            <span className="badge done">✓ Done</span>
            <span className="subtle">Finished at {formatClock(workout.completedAt)}</span>
          </div>
        ) : info.hasStrengthExercises ? (
          <div className="subtle">{exerciseCount > 0 ? `${exerciseCount} exercise(s) logged` : 'Not logged yet. Tap to start'}</div>
        ) : info.dayType === 'rest' ? (
          <div className="subtle">Active recovery / mobility only</div>
        ) : (
          <div className="subtle">{workout?.aerobic ? `Logged: ${workout.aerobic.chosenOption}` : "Not logged yet. Tap to choose today's session"}</div>
        )}
      </Link>

      <div className="card">
        <WaterGlasses iso={iso} />
      </div>

      <div className="card">
        <h2>Daily checklist</h2>
        <div className={`checklist-item${mobilityDone ? ' done' : ''}`} onClick={toggleMobility}>
          <input type="checkbox" checked={mobilityDone} onChange={toggleMobility} onClick={(e) => e.stopPropagation()} />
          <label>Daily mobility (10 min)</label>
        </div>
        {quickHabits.map((h) => (
          <div className={`checklist-item${habits[h.id] ? ' done' : ''}`} key={h.id} onClick={() => toggleHabit(h.id, !!habits[h.id])}>
            <input
              type="checkbox"
              checked={!!habits[h.id]}
              onChange={() => toggleHabit(h.id, !!habits[h.id])}
              onClick={(e) => e.stopPropagation()}
            />
            <label>{h.label}</label>
          </div>
        ))}
        <Link to="/habits" className="subtle" style={{ display: 'block', marginTop: 8 }}>
          ▶ Log habit times &amp; streaks
        </Link>
        <Link to="/recovery" className="subtle" style={{ display: 'block', marginTop: 6 }}>
          ▶ Log sleep &amp; heart rate
        </Link>
      </div>

      <div className="card">
        <h2>Nutrition</h2>
        <div className="bar-label">
          <span className="tag">Protein</span>
          <span className="subtle">{Math.round(totals.protein)} / {nTarget.protein} g</span>
        </div>
        <div className="progress-bar"><div style={{ width: `${proteinPct}%` }} /></div>
        <div className="bar-label">
          <span className="tag">Calories</span>
          <span className="subtle">{Math.round(totals.calories)} / {nTarget.calories} kcal</span>
        </div>
        <div className="progress-bar mp"><div style={{ width: `${caloriePct}%` }} /></div>
        <Link to="/food" className="btn secondary full" style={{ marginTop: 16 }}>
          Log food
        </Link>
      </div>
    </div>
  )
}
