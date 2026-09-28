import { useStore } from '../lib/store'
import { todayISO, startOfWeek, addDays, formatHuman } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { PLAN_LENGTH_DAYS, PHASES, PLAN_START_DATE } from '../data/plan'
import { isOnPlan } from '../lib/adherence'
import RoomHeader from '../components/RoomHeader'

export default function Progress() {
  const { data } = useStore()
  const today = todayISO()
  const info = getDayInfo(today)
  const weekStart = startOfWeek(today)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((d) => d <= today)

  const adherent = weekDates.filter((d) => isOnPlan(data, d)).length
  const adherencePct = weekDates.length ? Math.round((adherent / weekDates.length) * 100) : 0

  const weightEntries = Object.entries(data.habits)
    .map(([date, h]) => ({ date, weight: h.morningWeight as number | undefined }))
    .filter((e) => typeof e.weight === 'number')
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const recentWeights = weightEntries.slice(-14)
  const firstW = recentWeights[0]
  const lastW = recentWeights[recentWeights.length - 1]
  const weightDelta = firstW && lastW && firstW !== lastW ? +(lastW.weight! - firstW.weight!).toFixed(1) : null

  const restingHrEntries = Object.entries(data.habits)
    .map(([date, h]) => ({ date, hr: h.restingHr as number | undefined }))
    .filter((e) => typeof e.hr === 'number')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const recentHr = restingHrEntries.slice(-7)
  const hrRising = recentHr.length >= 3 && recentHr[recentHr.length - 1].hr! > recentHr[0].hr! + 3

  const checkIns = [...data.checkIns].sort((a, b) => (a.date < b.date ? -1 : 1))
  const lastCheckIn = checkIns[checkIns.length - 1]
  const prevCheckIn = checkIns[checkIns.length - 2]
  const waistDelta = lastCheckIn && prevCheckIn ? +(lastCheckIn.waistCm! - prevCheckIn.waistCm!).toFixed(1) : null

  return (
    <div className="page">
      <RoomHeader room="studio" title="Progress" subtitle={`Day ${info.dayNum} of ${PLAN_LENGTH_DAYS} · ${info.phaseName ?? ''}`} />

      <div className="card">
        <h2>100-day calendar</h2>
        <div className="world-map">
          {Array.from({ length: PLAN_LENGTH_DAYS }, (_, i) => {
            const dayNum = i + 1
            const iso = addDays(PLAN_START_DATE, i)
            const week = Math.ceil(dayNum / 7)
            const found = PHASES.findIndex((p) => week >= p.weeks[0] && week <= p.weeks[1])
            // Days past the last phase's final week are shaded as the last phase.
            const phaseIdx = found === -1 ? PHASES.length - 1 : found
            const isToday = iso === today
            const past = iso < today
            const done = iso <= today && isOnPlan(data, iso)
            const cls = ['tile', `w${phaseIdx + 1}`, done ? 'done' : past ? 'missed' : '', isToday ? 'today' : '']
              .filter(Boolean)
              .join(' ')
            return (
              <div key={dayNum} className={cls} title={`Day ${dayNum} · ${formatHuman(iso)}`} />
            )
          })}
        </div>
        <div className="legend">
          <span><i className="swatch" style={{ background: 'var(--hp-green)' }} /> On plan</span>
          <span><i className="swatch" style={{ background: '#f0c8c0', boxShadow: 'inset 0 0 0 2px var(--hp-red)' }} /> Missed</span>
          <span><i className="swatch" style={{ outline: '3px solid var(--orange)', outlineOffset: -3 }} /> Today</span>
        </div>
      </div>

      <div className="card">
        <h2>This week</h2>
        <div className="row">
          <span className="subtle">{adherent} / {weekDates.length} days on plan</span>
          <span className="subtle">{adherencePct}%</span>
        </div>
        <div className="progress-bar"><div style={{ width: `${adherencePct}%` }} /></div>
      </div>

      <div className="card">
        <h2>Weight trend (last 2 weeks)</h2>
        {recentWeights.length >= 2 ? (
          <>
            <div className="subtle">{formatHuman(firstW.date)}: {firstW.weight} kg ▶ {formatHuman(lastW.date)}: {lastW.weight} kg</div>
            <div style={{ marginTop: 4 }}>
              {weightDelta !== null && weightDelta <= 0
                ? `${Math.abs(weightDelta)} kg down, on track (target ~0.3-0.5 kg/week)`
                : weightDelta !== null
                ? `${weightDelta} kg up, check calories if this continues`
                : 'Not enough change yet to tell'}
            </div>
          </>
        ) : (
          <div className="subtle">Log your morning weight daily in Habits to see a trend.</div>
        )}
      </div>

      <div className="card">
        <h2>Waist (every 2 weeks)</h2>
        {lastCheckIn ? (
          <div className="subtle">
            Last: {formatHuman(lastCheckIn.date)} · {lastCheckIn.waistCm} cm
            {waistDelta !== null && ` (${waistDelta <= 0 ? waistDelta : '+' + waistDelta} cm since last check-in)`}
          </div>
        ) : (
          <div className="subtle">No check-in logged yet.</div>
        )}
      </div>

      {hrRising && (
        <div className="card warn">
          <h2>Overreaching alarm</h2>
          <p className="subtle">Resting heart rate has been rising. Combined with worsening sleep or dead legs, that's the plan's signal to drop a session or take an extra easy day. Not a failure.</p>
        </div>
      )}
    </div>
  )
}
