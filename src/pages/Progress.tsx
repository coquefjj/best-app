import { useStore } from '../lib/store'
import { todayISO, startOfWeek, addDays, formatHuman } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { PLAN_LENGTH_DAYS } from '../data/plan'

export default function Progress() {
  const { data } = useStore()
  const today = todayISO()
  const info = getDayInfo(today)
  const weekStart = startOfWeek(today)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((d) => d <= today)

  let adherent = 0
  for (const d of weekDates) {
    const di = getDayInfo(d)
    const w = data.workouts[d]
    if (di.dayType === 'rest') {
      if (w?.mobilityDone) adherent++
    } else if (di.hasStrengthExercises) {
      if (w && Object.keys(w.exercises).length > 0) adherent++
    } else if (w?.aerobic?.chosenOption) {
      adherent++
    }
  }
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
      <h1>Progress</h1>
      <div className="subtle">Day {info.dayNum} of {PLAN_LENGTH_DAYS} · {info.phaseName}</div>

      <div className="card">
        <h2>This week's adherence</h2>
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
            <div className="subtle">{formatHuman(firstW.date)}: {firstW.weight} kg → {formatHuman(lastW.date)}: {lastW.weight} kg</div>
            <div style={{ marginTop: 4 }}>
              {weightDelta !== null && weightDelta <= 0
                ? `${Math.abs(weightDelta)} kg down — on track (target ~0.3-0.5 kg/week)`
                : weightDelta !== null
                ? `${weightDelta} kg up — check calories if this continues`
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
            Last: {formatHuman(lastCheckIn.date)} — {lastCheckIn.waistCm} cm
            {waistDelta !== null && ` (${waistDelta <= 0 ? waistDelta : '+' + waistDelta} cm since last check-in)`}
          </div>
        ) : (
          <div className="subtle">No check-in logged yet.</div>
        )}
      </div>

      {hrRising && (
        <div className="card" style={{ borderColor: 'var(--warn)' }}>
          <h2 style={{ color: 'var(--warn)' }}>Overreaching alarm</h2>
          <p className="subtle">Resting heart rate has been rising. Combined with worsening sleep or dead legs, that's the plan's signal to drop a session or take an extra easy day — not a failure.</p>
        </div>
      )}
    </div>
  )
}
