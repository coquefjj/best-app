import { useState } from 'react'
import { useStore } from '../lib/store'
import { todayISO, startOfWeek, addDays, formatHuman } from '../lib/date'
import { PLAN_LENGTH_DAYS, PHASES, PLAN_START_DATE } from '../data/plan'
import { isOnPlan } from '../lib/adherence'
import { sectionGrader, type Grade, type Section } from '../lib/consistency'

type View = 'all' | Section

const VIEWS: { id: View; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'workout', label: 'Workout' },
  { id: 'habits', label: 'Habits' },
  { id: 'nutrition', label: 'Food' },
  { id: 'recovery', label: 'Rest' },
]

const GRADE_LABEL: Record<Grade, string> = { full: 'Hit', partial: 'Partly', failed: 'Missed', none: 'No data' }

/** The 100-day calendar and this week's adherence, shown under the house on Home. */
export default function PlanProgress() {
  const { data } = useStore()
  const [view, setView] = useState<View>('all')
  const grade = view === 'all' ? null : sectionGrader(data, view)
  const counts: Record<Grade, number> = { full: 0, partial: 0, failed: 0, none: 0 }
  const today = todayISO()
  const weekStart = startOfWeek(today)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((d) => d <= today)

  const adherent = weekDates.filter((d) => isOnPlan(data, d)).length
  const adherencePct = weekDates.length ? Math.round((adherent / weekDates.length) * 100) : 0

  const restingHrEntries = Object.entries(data.habits)
    .map(([date, h]) => ({ date, hr: h.restingHr as number | undefined }))
    .filter((e) => typeof e.hr === 'number')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const recentHr = restingHrEntries.slice(-7)
  const hrRising = recentHr.length >= 3 && recentHr[recentHr.length - 1].hr! > recentHr[0].hr! + 3

  return (
    <div className="home-progress">
      <div className="card">
        <h2>This week</h2>
        <div className="row">
          <span className="subtle">{adherent} / {weekDates.length} days on plan</span>
          <span className="subtle">{adherencePct}%</span>
        </div>
        <div className="progress-bar"><div style={{ width: `${adherencePct}%` }} /></div>
      </div>

      <div className="card">
        <h2>100-day calendar</h2>
        <div className="cal-views" role="group" aria-label="Calendar view">
          {VIEWS.map((v) => (
            <button key={v.id} className={v.id === view ? 'on' : ''} aria-pressed={v.id === view} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
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
            let state = ''
            let g: Grade | null = null
            if (grade) {
              // Today stays plain until something is logged, so an unfinished day never shows red.
              g = iso > today ? null : grade(iso)
              if (g && isToday && g === 'failed') g = 'none'
              if (g) {
                counts[g]++
                state = g === 'none' ? (isToday ? '' : 'nodata') : g
              }
            } else {
              const done = iso <= today && isOnPlan(data, iso)
              state = done ? 'done' : past ? 'missed' : ''
            }
            const cls = ['tile', `w${phaseIdx + 1}`, state, isToday ? 'today' : ''].filter(Boolean).join(' ')
            return (
              <div key={dayNum} className={cls} title={`Day ${dayNum} · ${formatHuman(iso)}${g ? ` · ${GRADE_LABEL[g]}` : ''}`} />
            )
          })}
        </div>
        {grade ? (
        <div className="legend">
          <span><i className="swatch tile-full" /> Hit {counts.full}</span>
          <span><i className="swatch tile-partial" /> Partly {counts.partial}</span>
          <span><i className="swatch tile-failed" /> Missed {counts.failed}</span>
          <span><i className="swatch tile-nodata" /> No data</span>
          <span><i className="swatch" style={{ outline: '3px solid var(--orange)', outlineOffset: -3 }} /> Today</span>
        </div>
        ) : (
        <div className="legend">
          <span><i className="swatch" style={{ background: 'var(--hp-green)' }} /> On plan</span>
          <span><i className="swatch" style={{ background: '#f0c8c0', boxShadow: 'inset 0 0 0 2px var(--hp-red)' }} /> Missed</span>
          <span><i className="swatch" style={{ outline: '3px solid var(--orange)', outlineOffset: -3 }} /> Today</span>
        </div>
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
