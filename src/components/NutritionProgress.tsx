import { useState } from 'react'
import { useStore } from '../lib/store'
import { addDays, formatMinutes, todayISO } from '../lib/date'
import {
  MEAL_GAP_MIN,
  average,
  nutritionDays,
  spreadWords,
  timingRows,
  type NutritionDay,
} from '../lib/nutritionReport'
import type { FoodEntry } from '../types'
import { ChartDates, DayBars, RangeToggle, type RangeDays } from './ReportBits'

const SLOT_COLORS: Record<FoodEntry['mealSlot'], string> = {
  breakfast: 'var(--gold)',
  lunch: 'var(--orange)',
  dinner: 'var(--accent-2)',
  snack: 'var(--surface-2)',
}

/** "Mon 28" for a row label. */
const shortDay = (iso: string) =>
  `${new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })} ${Number(iso.slice(8))}`

const fmt = (n: number) => Math.round(n).toLocaleString()

/** Each day with timed food as a row, each meal a square at the time it started. */
function MealTimeline({ days }: { days: NutritionDay[] }) {
  const width = 320
  const left = 56
  const top = 18
  const rowH = days.length > 10 ? 9 : 18
  const height = top + days.length * rowH + 4
  const all = days.flatMap((d) => d.mealTimes.map((m) => m.minutes))
  const startH = Math.min(6, Math.floor(Math.min(...all) / 60))
  const endH = Math.max(22, Math.ceil(Math.max(...all) / 60))
  const x = (min: number) => left + ((min - startH * 60) / ((endH - startH) * 60)) * (width - left - 6)
  const ticks: number[] = []
  for (let h = Math.ceil(startH / 3) * 3; h <= endH; h += 3) ticks.push(h)
  const dot = rowH > 10 ? 10 : 7
  const labelEvery = days.length > 10 ? 5 : 1
  return (
    <svg className="meal-timeline" viewBox={`0 0 ${width} ${height}`} shapeRendering="crispEdges" aria-hidden="true">
      {ticks.map((h) => (
        <g key={h}>
          <line x1={x(h * 60)} x2={x(h * 60)} y1={top - 4} y2={height} className="chart-grid" />
          <text x={x(h * 60)} y={12} textAnchor="middle" className="chart-label">
            {formatMinutes(h * 60).replace(':00', '')}
          </text>
        </g>
      ))}
      {days.map((d, i) => {
        const cy = top + i * rowH + rowH / 2
        return (
          <g key={d.date}>
            {(days.length - 1 - i) % labelEvery === 0 && (
              <text x={0} y={cy + 4} className="chart-label">{shortDay(d.date)}</text>
            )}
            {d.mealTimes.map((m, j) => (
              <rect
                key={j}
                x={Math.round(x(m.minutes) - dot / 2)}
                y={Math.round(cy - dot / 2)}
                width={dot}
                height={dot}
                fill={SLOT_COLORS[m.slot]}
                stroke="var(--ink)"
                strokeWidth={2}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

function MacroMeter({ label, eaten, target, unit }: { label: string; eaten: number; target: number; unit: string }) {
  const pct = target ? eaten / target : 0
  return (
    <div className="macro-meter">
      <div className="macro-meter-top">
        <span>{label}</span>
        <span>
          {fmt(eaten)} / {fmt(target)} {unit}
        </span>
      </div>
      <div className="meter">
        <div className="meter-fill" style={{ width: `${Math.min(100, pct * 100) / 1.25}%` }} />
        <div className="meter-target" style={{ left: `${100 / 1.25}%` }} />
      </div>
    </div>
  )
}

/** Meals, eating times, calories and macros; opened from the Progress button at the bottom of Nutrition. */
export default function NutritionProgress() {
  const { data } = useStore()
  const [range, setRange] = useState<RangeDays>(7)
  const today = todayISO()
  const days = nutritionDays(data, range, today)
  const logged = days.filter((d): d is NutritionDay => !!d)
  // Today is still going, so it shows in the charts but stays out of the averages.
  const complete = logged.filter((d) => d.date !== today)
  const avgBase = complete.length ? complete : logged
  const timed = logged.filter((d) => d.mealTimes.length)
  // A half-eaten today would drag the last meal and eating window earlier.
  const timedComplete = timed.some((d) => d.date !== today) ? timed.filter((d) => d.date !== today) : timed
  const rows = timingRows(timedComplete)
  const windowHours = average(timedComplete.filter((d) => d.mealTimes.length > 1).map((d) => d.mealTimes[d.mealTimes.length - 1].minutes - d.mealTimes[0].minutes)) / 60
  const firstISO = addDays(today, -(range - 1))

  const inRange = avgBase.filter((d) => d.calories >= d.target.calorieRange[0] && d.calories <= d.target.calorieRange[1]).length
  const proteinHit = avgBase.filter((d) => d.protein >= d.target.protein * 0.9).length
  const avg = (k: 'calories' | 'protein' | 'carbs' | 'fat') => average(avgBase.map((d) => d[k]))
  const avgTarget = (k: 'calories' | 'protein' | 'carbs' | 'fat') => average(avgBase.map((d) => d.target[k]))

  return (
    <div className="report">
      <RangeToggle value={range} onChange={setRange} />

      {logged.length === 0 ? (
        <div className="card">
          <div className="subtle">No food logged in the last {range} days yet.</div>
        </div>
      ) : (
        <>
          <div className="card">
            <h2>Meals per day</h2>
            <div className="report-headline">{average(avgBase.map((d) => d.meals)).toFixed(1)} meals a day</div>
            <DayBars values={days.map((d) => d?.meals ?? null)} color="var(--gold)" height={70} />
            <ChartDates from={firstISO} to={today} indent={44} />
            <div className="subtle report-note">
              {logged.length} of {range} days logged. Food eaten within {MEAL_GAP_MIN} min of each other counts as one meal.
            </div>
          </div>

          <div className="card">
            <h2>Eating times</h2>
            {timed.length === 0 ? (
              <div className="subtle">
                Times are saved for food you log from now on. Once a few days are logged, your usual meal times show here.
              </div>
            ) : (
              <>
                <MealTimeline days={timed} />
                <div className="slot-legend">
                  {(Object.keys(SLOT_COLORS) as FoodEntry['mealSlot'][]).map((s) => (
                    <span key={s}>
                      <i className="swatch" style={{ background: SLOT_COLORS[s] }} />
                      {s}
                    </span>
                  ))}
                </div>
                <ul className="report-rows">
                  {rows.map((r) => (
                    <li key={r.label}>
                      <span className="report-row-name">{r.label}</span>
                      <span>
                        {formatMinutes(r.usual)}
                        {r.days > 1 && <span className="subtle"> ± {Math.round(r.spread)} min</span>}
                      </span>
                      <span className="subtle report-row-words">{r.days > 1 ? spreadWords(r.spread) : 'One day so far'}</span>
                    </li>
                  ))}
                </ul>
                {windowHours > 0 && (
                  <div className="subtle report-note">
                    Eating window: {windowHours.toFixed(1)} h from first to last meal on average.
                  </div>
                )}
                {timed.length < logged.length && (
                  <div className="subtle report-note">Days logged before times were saved are left out here.</div>
                )}
              </>
            )}
          </div>

          <div className="card">
            <h2>Calories &amp; macros</h2>
            <div className="report-headline">
              {fmt(avg('calories'))} kcal a day <span className="subtle">/ {fmt(avgTarget('calories'))} target</span>
            </div>
            <DayBars
              values={days.map((d) => d?.calories ?? null)}
              targets={days.map((d) => d?.target.calories ?? null)}
              color="var(--accent)"
              height={90}
            />
            <ChartDates from={firstISO} to={today} indent={44} />
            <div className="subtle report-note">Dark ticks are each day's target.</div>
            <MacroMeter label="Protein" eaten={avg('protein')} target={avgTarget('protein')} unit="g" />
            <MacroMeter label="Carbs" eaten={avg('carbs')} target={avgTarget('carbs')} unit="g" />
            <MacroMeter label="Fat" eaten={avg('fat')} target={avgTarget('fat')} unit="g" />
            <ul className="report-rows">
              <li>
                <span className="report-row-name">Calories in range</span>
                <span>
                  {inRange} of {avgBase.length} days
                </span>
              </li>
              <li>
                <span className="report-row-name">Protein reached</span>
                <span>
                  {proteinHit} of {avgBase.length} days
                </span>
              </li>
            </ul>
            {complete.length > 0 && logged.some((d) => d.date === today) && (
              <div className="subtle report-note">Averages leave out today until it's over.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
