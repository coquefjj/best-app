import { formatHuman } from '../lib/date'

export const RANGES = [7, 30] as const
export type RangeDays = (typeof RANGES)[number]

/** "Last 7 days / Last 30 days" switch at the top of the Nutrition and Recovery reports. */
export function RangeToggle({ value, onChange }: { value: RangeDays; onChange: (d: RangeDays) => void }) {
  return (
    <div className="range-toggle" role="group" aria-label="Report range">
      {RANGES.map((d) => (
        <button key={d} className={d === value ? 'on' : ''} aria-pressed={d === value} onClick={() => onChange(d)}>
          Last {d} days
        </button>
      ))}
    </div>
  )
}

/** First and last date under a chart. */
export function ChartDates({ from, to, indent = 0 }: { from: string; to: string; indent?: number }) {
  return (
    <div className="chart-dates subtle" style={{ paddingLeft: indent }}>
      <span>{formatHuman(from)}</span>
      <span>{formatHuman(to)}</span>
    </div>
  )
}

/**
 * Pixel column chart with one bar per day, oldest on the left. Days with nothing logged
 * leave a gap. An optional target per day is drawn as a dark tick across its bar.
 */
export function DayBars({
  values,
  targets,
  color,
  height = 90,
  unit = '',
}: {
  values: (number | null)[]
  targets?: (number | null)[]
  color: string
  height?: number
  unit?: string
}) {
  const width = 320
  const left = 44
  const pad = 4
  const hi = Math.max(1, ...values.map((v) => v ?? 0), ...(targets ?? []).map((t) => t ?? 0))
  const slot = (width - left - pad) / values.length
  const barW = Math.max(3, Math.floor(slot * 0.7))
  const y = (v: number) => Math.round(pad + (1 - v / hi) * (height - pad * 2))
  const x = (i: number) => Math.round(left + i * slot + (slot - barW) / 2)
  const label = (v: number) => `${Math.round(v)}${unit ? ` ${unit}` : ''}`
  return (
    <svg className="day-bars" viewBox={`0 0 ${width} ${height}`} shapeRendering="crispEdges" aria-hidden="true">
      <line x1={left} x2={width - pad} y1={y(hi)} y2={y(hi)} className="chart-grid" />
      <line x1={left} x2={width - pad} y1={y(0)} y2={y(0)} className="chart-axis" />
      <text x={0} y={y(hi) + 4} className="chart-label">{label(hi)}</text>
      <text x={0} y={y(0)} className="chart-label">0</text>
      {values.map((v, i) =>
        v == null || v <= 0 ? null : (
          <rect key={i} x={x(i)} y={y(v)} width={barW} height={y(0) - y(v)} fill={color} stroke="var(--ink)" strokeWidth={2} />
        ),
      )}
      {targets?.map((t, i) =>
        t == null ? null : <rect key={`t${i}`} x={x(i) - 2} y={y(t) - 1} width={barW + 4} height={3} fill="var(--ink)" />,
      )}
    </svg>
  )
}
