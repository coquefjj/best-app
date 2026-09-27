import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { HABIT_DEFS, PLAN_LENGTH_DAYS } from '../data/plan'

export default function Today() {
  const { data, setData } = useStore()
  const iso = todayISO()
  const info = getDayInfo(iso)
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

  const quickHabits = HABIT_DEFS.filter((h) => h.type === 'boolean')

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
          mobilityDone: !(prev.workouts[iso]?.mobilityDone ?? false),
          exercises: prev.workouts[iso]?.exercises ?? {},
          aerobic: prev.workouts[iso]?.aerobic,
        },
      },
    }))
  }

  const exerciseCount = workout ? Object.keys(workout.exercises).length : 0
  const proteinPct = Math.min(100, Math.round((totals.protein / info.nutrition.protein) * 100))
  const caloriePct = Math.min(100, Math.round((totals.calories / info.nutrition.calories) * 100))

  return (
    <div className="page">
      <div className="row">
        <div>
          <h1>{formatHuman(iso)}</h1>
          <div className="subtle">
            {info.inPlan ? `Day ${info.dayNum} of ${PLAN_LENGTH_DAYS}` : 'Outside the 100-day plan'}
          </div>
        </div>
        {info.inPlan && (
          <span className={`badge${info.deload ? ' deload' : ''}`}>
            {info.deload ? 'Deload week' : `Week ${info.weekNumber}`}
          </span>
        )}
      </div>

      <Link to={`/workout/${iso}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <h2>{info.label}</h2>
        {info.hasStrengthExercises ? (
          <div className="subtle">{exerciseCount > 0 ? `${exerciseCount} exercise(s) logged` : 'Not logged yet — tap to start'}</div>
        ) : info.dayType === 'rest' ? (
          <div className="subtle">Active recovery / mobility only</div>
        ) : (
          <div className="subtle">{workout?.aerobic ? `Logged: ${workout.aerobic.chosenOption}` : 'Not logged yet — tap to choose today\'s session'}</div>
        )}
      </Link>

      <div className="card">
        <div className="checklist-item" onClick={toggleMobility} style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={workout?.mobilityDone ?? false} onChange={toggleMobility} />
          <label>Daily mobility (10 min)</label>
        </div>
        {quickHabits.map((h) => (
          <div className="checklist-item" key={h.id} onClick={() => toggleHabit(h.id, !!habits[h.id])} style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={!!habits[h.id]} onChange={() => toggleHabit(h.id, !!habits[h.id])} />
            <label>{h.label}</label>
          </div>
        ))}
        <Link to="/habits" className="subtle" style={{ display: 'inline-block', marginTop: 8 }}>
          Log weight, sleep &amp; more →
        </Link>
      </div>

      <div className="card">
        <h2>Nutrition today</h2>
        <div className="row">
          <span className="subtle">Protein</span>
          <span className="subtle">{Math.round(totals.protein)} / {info.nutrition.protein} g</span>
        </div>
        <div className="progress-bar"><div style={{ width: `${proteinPct}%` }} /></div>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="subtle">Calories</span>
          <span className="subtle">{Math.round(totals.calories)} / {info.nutrition.calories} kcal</span>
        </div>
        <div className="progress-bar"><div style={{ width: `${caloriePct}%`, background: 'var(--accent-2)' }} /></div>
        <Link to="/food" className="btn secondary full" style={{ marginTop: 12 }}>
          Log food
        </Link>
      </div>
    </div>
  )
}
