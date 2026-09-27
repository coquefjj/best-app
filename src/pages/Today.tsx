import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { heroStats, XP_PER_LEVEL } from '../lib/game'
import { HABIT_DEFS, PLAN_LENGTH_DAYS } from '../data/plan'
import Sprite from '../components/Sprite'

export default function Today() {
  const { data, setData } = useStore()
  const iso = todayISO()
  const info = getDayInfo(iso)
  const workout = data.workouts[iso]
  const habits = data.habits[iso] ?? {}
  const food = data.food[iso]?.entries ?? []
  const hero = heroStats(data, iso)

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
  const mobilityDone = workout?.mobilityDone ?? false
  const questsDone = quickHabits.filter((h) => habits[h.id]).length + (mobilityDone ? 1 : 0)

  return (
    <div className="page">
      <div className="card gold">
        <div className="hero">
          <div className="hero-avatar">
            <Sprite name="hero" scale={4} title="Your hero" />
          </div>
          <div className="hero-info">
            <div className="row">
              <div className="hero-level">LV {hero.level}</div>
              {info.inPlan && (
                <span className={`badge${info.deload ? ' deload' : ''}`}>
                  {info.deload ? 'Rest camp' : `Week ${info.weekNumber}`}
                </span>
              )}
            </div>
            <div className="card-title">{formatHuman(iso)}</div>
            <div className="subtle">
              {info.inPlan ? `Day ${info.dayNum} of ${PLAN_LENGTH_DAYS}` : 'Outside the 100-day plan'}
            </div>
            <div className="bar-label">
              <span className="tag">XP</span>
              <span className="subtle">{hero.levelXP} / {XP_PER_LEVEL}</span>
            </div>
            <div className="progress-bar xp"><div style={{ width: `${(hero.levelXP / XP_PER_LEVEL) * 100}%` }} /></div>
            {hero.streak > 0 && (
              <div className="streak" style={{ marginTop: 10 }}>
                <Sprite name="flame" scale={2} /> {hero.streak} day streak
              </div>
            )}
          </div>
        </div>
      </div>

      <Link to={`/workout/${iso}`} className="card">
        <div className="card-kicker">Main quest</div>
        <div className="row">
          <div>
            <div className="card-title">{info.label}</div>
            {info.hasStrengthExercises ? (
              <div className="subtle">{exerciseCount > 0 ? `${exerciseCount} exercise(s) logged` : 'Not started. Tap to begin'}</div>
            ) : info.dayType === 'rest' ? (
              <div className="subtle">Active recovery / mobility only</div>
            ) : (
              <div className="subtle">{workout?.aerobic ? `Logged: ${workout.aerobic.chosenOption}` : "Not started. Tap to choose today's session"}</div>
            )}
          </div>
          <Sprite name={info.dayType === 'rest' ? 'tent' : 'sword'} scale={3} />
        </div>
      </Link>

      <div className="card">
        <h2>
          <Sprite name="chest" scale={2} /> Side quests
          <span className="subtle" style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
            {questsDone}/{quickHabits.length + 1}
          </span>
        </h2>
        <div className={`checklist-item${mobilityDone ? ' done' : ''}`} onClick={toggleMobility}>
          <input type="checkbox" checked={mobilityDone} onChange={toggleMobility} onClick={(e) => e.stopPropagation()} />
          <label>Daily mobility (10 min)</label>
          <span className="xp-tag">+10</span>
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
            <span className="xp-tag">+10</span>
          </div>
        ))}
        <Link to="/habits" className="subtle" style={{ display: 'inline-block', marginTop: 8 }}>
          Log weight, sleep &amp; more ▶
        </Link>
      </div>

      <div className="card">
        <h2><Sprite name="meat" scale={2} /> Rations</h2>
        <div className="bar-label">
          <span className="tag">Protein</span>
          <span className="subtle">{Math.round(totals.protein)} / {info.nutrition.protein} g</span>
        </div>
        <div className="progress-bar"><div style={{ width: `${proteinPct}%` }} /></div>
        <div className="bar-label">
          <span className="tag">Energy</span>
          <span className="subtle">{Math.round(totals.calories)} / {info.nutrition.calories} kcal</span>
        </div>
        <div className="progress-bar mp"><div style={{ width: `${caloriePct}%` }} /></div>
        <Link to="/food" className="btn secondary full" style={{ marginTop: 16 }}>
          Log food
        </Link>
      </div>
    </div>
  )
}
