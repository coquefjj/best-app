import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO, formatHuman } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { heroStats, XP_PER_LEVEL, FOES, foeHP, hpClass } from '../lib/game'
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

  const proteinPct = Math.min(100, Math.round((totals.protein / info.nutrition.protein) * 100))
  const caloriePct = Math.min(100, Math.round((totals.calories / info.nutrition.calories) * 100))
  const mobilityDone = workout?.mobilityDone ?? false
  const questsDone = quickHabits.filter((h) => habits[h.id]).length + (mobilityDone ? 1 : 0)

  const foe = FOES[info.dayType]
  const foeLeft = foeHP(data, iso)
  const fainted = foeLeft === 0
  const questTotal = quickHabits.length + 1
  const questFrac = questsDone / questTotal

  let message: ReactNode
  if (!info.inPlan) {
    message = <>No wild training out here. The 100-day journey is outside today's date.</>
  } else if (fainted) {
    message = <>The wild <strong>{foe.name}</strong> fainted! Today's training is done. Keep clearing side quests for EXP.</>
  } else if (foeLeft < 1) {
    message = <>The wild <strong>{foe.name}</strong> is weakened! Keep logging: {info.label}.</>
  } else {
    message = <>A wild <strong>{foe.name}</strong> appeared! Today: {info.label}. What will BEST do?</>
  }

  return (
    <div className="page">
      <Link to={`/workout/${iso}`} className="battle" aria-label={`Start today's training: ${info.label}`}>
        <div className="status-box foe">
          <div className="name-row">
            <span>{foe.name}</span>
            <span>{info.inPlan ? `D${info.dayNum}` : '--'}</span>
          </div>
          <div className="hp-row">
            <span className="hp-tag">HP</span>
            <div className={`progress-bar${hpClass(foeLeft)}`}><div style={{ width: `${foeLeft * 100}%` }} /></div>
          </div>
        </div>
        <div className={`foe-side${fainted ? ' fainted' : ''}`}>
          <span style={{ position: 'relative' }}>
            <Sprite name={foe.sprite} scale={5} title={foe.name} />
            {foe.sprite === 'slime' && !fainted && <span className="zzz">Zz</span>}
          </span>
          <div className="platform" />
        </div>

        <div className="me-side">
          <Sprite name="partner" scale={6} title="Your partner" />
          <div className="platform" />
        </div>
        <div className="status-box me">
          <div className="name-row">
            <span>BEST</span>
            <span>Lv{hero.level}</span>
          </div>
          <div className="hp-row">
            <span className="hp-tag">HP</span>
            <div className={`progress-bar${hpClass(questFrac)}`}><div style={{ width: `${questFrac * 100}%` }} /></div>
          </div>
          <div className="hp-num">{questsDone}/{questTotal}</div>
          <div className="progress-bar xp"><div style={{ width: `${(hero.levelXP / XP_PER_LEVEL) * 100}%` }} /></div>
        </div>
      </Link>
      <div className="dialog">
        <div className="dialog-text">
          <div className="subtle" style={{ marginBottom: 4 }}>
            {formatHuman(iso)} · {info.inPlan ? `Day ${info.dayNum} of ${PLAN_LENGTH_DAYS}` : 'Outside the plan'}
            {info.inPlan && info.deload ? ' · Deload week' : ''}
          </div>
          {message}
          {hero.streak > 0 && (
            <div className="streak" style={{ marginTop: 10 }}>
              <Sprite name="flame" scale={2} /> {hero.streak} day streak
            </div>
          )}
        </div>
        <nav className="battle-menu" aria-label="Actions">
          <Link to={`/workout/${iso}`}>FIGHT</Link>
          <Link to="/food">BAG</Link>
          <Link to="/habits">STATS</Link>
          <Link to="/progress">MAP</Link>
        </nav>
      </div>

      <div className="card">
        <h2>
          Side quests
          <span className="subtle" style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
            {questsDone}/{questTotal}
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
          ▶ Log weight, sleep &amp; more
        </Link>
      </div>

      <div className="card">
        <h2>Rations</h2>
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
