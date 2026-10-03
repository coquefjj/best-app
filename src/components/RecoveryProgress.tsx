import { useState } from 'react'
import { useStore } from '../lib/store'
import { addDays, formatHuman, todayISO } from '../lib/date'
import { HABIT_DEFS } from '../data/plan'
import { average } from '../lib/nutritionReport'
import StepChart from './StepChart'
import { ChartDates, RangeToggle, type RangeDays } from './ReportBits'

const METRIC_COLORS: Record<string, string> = {
  water: 'var(--accent-2)',
  sleepHours: 'var(--gold)',
  sleepScore: 'var(--accent)',
  restingHr: 'var(--danger)',
}

/** Recorded values of one metric over `days` days ending `end`, oldest first. Water only counts once a glass is tapped. */
function recorded(habits: Record<string, Record<string, unknown> | undefined>, id: string, days: number, end: string) {
  const out: { date: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(end, -i)
    const v = habits[date]?.[id]
    if (typeof v === 'number' && (id !== 'water' || v > 0)) out.push({ date, value: v })
  }
  return out
}

const show = (v: number, decimals: number) => (+v.toFixed(decimals)).toString()

/** Water, sleep and resting heart rate over time; opened from the Progress button at the bottom of Recovery. */
export default function RecoveryProgress() {
  const { data } = useStore()
  const [range, setRange] = useState<RangeDays>(7)
  const today = todayISO()

  return (
    <div className="report">
      <RangeToggle value={range} onChange={setRange} />
      {HABIT_DEFS.filter((m) => data.profile?.watch !== false || m.id === 'water' || m.id === 'sleepHours').map((m) => {
        const now = recorded(data.habits, m.id, range, today)
        const before = recorded(data.habits, m.id, range, addDays(today, -range))
        const decimals = m.id === 'water' || m.id === 'sleepHours' ? 1 : 0
        const unit = m.unit ? ` ${m.unit}` : ''
        const avgNow = average(now.map((p) => p.value))
        const change = before.length && now.length ? avgNow - average(before.map((p) => p.value)) : null
        const last = now[now.length - 1]
        return (
          <div className="card" key={m.id}>
            <h2>{m.label}</h2>
            {now.length === 0 ? (
              <div className="subtle">Nothing recorded in the last {range} days.</div>
            ) : (
              <>
                <div className="report-headline">
                  {show(avgNow, decimals)}
                  {unit} <span className="subtle">average</span>
                </div>
                <div className="subtle">
                  Latest {show(last.value, decimals)}
                  {unit} on {formatHuman(last.date)}
                  {change != null && (
                    <>
                      {' · '}
                      {Math.abs(change) < 10 ** -decimals / 2
                        ? `same as the ${range} days before`
                        : `${change > 0 ? '+' : '−'}${show(Math.abs(change), decimals)}${unit} vs the ${range} days before`}
                    </>
                  )}
                </div>
                {now.length > 1 ? (
                  <div className="report-chart">
                    <StepChart
                      values={now.map((p) => p.value)}
                      color={METRIC_COLORS[m.id] ?? 'var(--accent)'}
                      width={300}
                      height={90}
                      showScale
                      unit={m.unit}
                    />
                    <ChartDates from={now[0].date} to={last.date} indent={44} />
                  </div>
                ) : null}
                <div className="subtle report-note">
                  Recorded on {now.length} of {range} days.
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
