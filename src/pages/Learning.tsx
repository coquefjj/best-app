import { useStore } from '../lib/store'
import { formatHuman } from '../lib/date'
import RoomHeader from '../components/RoomHeader'
import StepChart from '../components/StepChart'
import {
  MUSCLE_GROUPS,
  bestSession,
  formatKg,
  liftGain,
  liftHistories,
  sessionValue,
  type LiftHistory,
  type LiftSession,
  type MuscleGroupId,
} from '../lib/strength'

const MAP_IMG = `${import.meta.env.BASE_URL}img/muscle-map.webp`

const setText = (s: LiftSession, unit: LiftHistory['unit']) =>
  unit === 'kg' ? `${formatKg(s.weight!)}${s.reps ? ` × ${s.reps}` : ''}` : `${s.reps} reps`

const gainText = (gain: number, unit: LiftHistory['unit']) =>
  gain > 0 ? `+${unit === 'kg' ? formatKg(gain) : `${gain} reps`}` : 'Holding steady'

function groupSummary(lifts: LiftHistory[]): string {
  const kgLifts = lifts.filter((h) => h.unit === 'kg' && h.sessions.length >= 2)
  const repLifts = lifts.filter((h) => h.unit === 'reps' && h.sessions.length >= 2)
  if (!lifts.length) return 'No sets logged yet'
  if (!kgLifts.length && !repLifts.length) return 'Starting points set'
  const parts: string[] = []
  if (kgLifts.length) parts.push(`+${formatKg(kgLifts.reduce((sum, h) => sum + liftGain(h), 0))}`)
  if (repLifts.length) parts.push(`+${repLifts.reduce((sum, h) => sum + liftGain(h), 0)} reps`)
  return parts.join(' · ')
}

function LiftRow({ lift, color }: { lift: LiftHistory; color: string }) {
  const best = bestSession(lift)!
  const values = lift.sessions.map((s) => sessionValue(s, lift.unit))
  const first = lift.sessions[0]
  const last = lift.sessions[lift.sessions.length - 1]
  if (lift.sessions.length === 1) {
    return (
      <div className="lift">
        <div className="lift-summary">
          <div className="lift-text">
            <div className="lift-name">{lift.name}</div>
            <div className="subtle">Starting point: {setText(first, lift.unit)}</div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <details className="lift">
      <summary className="lift-summary">
        <div className="lift-text">
          <div className="lift-name">{lift.name}</div>
          <div className="subtle">
            Best {setText(best, lift.unit)} · <span className="lift-gain">{gainText(liftGain(lift), lift.unit)}</span>
          </div>
        </div>
        <StepChart values={values} color={color} width={96} height={36} />
      </summary>
      <div className="lift-detail">
        <StepChart values={values} color={color} width={300} height={110} showScale unit={lift.unit === 'kg' ? 'kg' : 'reps'} />
        <div className="chart-dates subtle">
          <span>{formatHuman(first.date)}</span>
          <span>{formatHuman(last.date)}</span>
        </div>
        <ul className="lift-sessions">
          {[...lift.sessions].reverse().slice(0, 6).map((s) => (
            <li key={s.date}>
              <span>{formatHuman(s.date)}</span>
              <span>{setText(s, lift.unit)}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

export default function Learning() {
  const { data } = useStore()
  const histories = liftHistories(data)
  const groups = MUSCLE_GROUPS.map((g) => {
    const lifts = g.lifts.map((name) => histories.get(name)).filter((h): h is LiftHistory => !!h)
    return { ...g, lifts, notLogged: g.lifts.filter((name) => !histories.has(name)) }
  })

  const jumpTo = (id: MuscleGroupId) =>
    document.getElementById(`group-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="page room-page floor-office">
      <RoomHeader room="office" title="Strength" subtitle="Best lifts by muscle group" />

      <div className="card muscle-map-card">
        <img className="muscle-map" src={MAP_IMG} alt="Muscle groups: arms and shoulders, back, chest, legs and glutes" />
        <div className="muscle-legend">
          {groups.map((g) => (
            <button key={g.id} className="muscle-chip" onClick={() => jumpTo(g.id)}>
              <i className="swatch" style={{ background: g.color }} />
              <span className="muscle-chip-name">{g.name}</span>
              <span className="muscle-chip-gain">{groupSummary(g.lifts)}</span>
            </button>
          ))}
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.id} id={`group-${g.id}`} className="card muscle-group" style={{ ['--group' as string]: g.color }}>
          <h2>
            <i className="swatch" style={{ background: g.color }} />
            {g.name}
          </h2>
          <div className="group-headline">{groupSummary(g.lifts)}</div>
          {g.lifts.map((h) => (
            <LiftRow key={h.name} lift={h} color={g.color} />
          ))}
          {g.notLogged.length > 0 && (
            <div className="subtle not-logged">Not logged yet: {g.notLogged.join(', ')}</div>
          )}
        </div>
      ))}
    </div>
  )
}
