/** Pixel-style step line of one value per session, oldest on the left. */
export default function StepChart({
  values,
  color,
  width,
  height,
  showScale = false,
  unit = '',
}: {
  values: number[]
  color: string
  width: number
  height: number
  /** Show the low and high values on the left edge. */
  showScale?: boolean
  unit?: string
}) {
  const pad = 4
  const left = showScale ? 44 : pad
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const x = (i: number) => left + (i / Math.max(1, values.length - 1)) * (width - left - pad)
  const y = (v: number) => Math.round(pad + (1 - (v - lo) / span) * (height - pad * 2))
  // Flat series sit in the middle rather than on the floor.
  const yv = (v: number) => (hi === lo ? Math.round(height / 2) : y(v))
  let d = `M${x(0)},${yv(values[0])}`
  for (let i = 1; i < values.length; i++) d += ` H${x(i)} V${yv(values[i])}`
  const label = (v: number) => `${+v.toFixed(2)}${unit ? ` ${unit}` : ''}`
  return (
    <svg
      className="step-chart"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {showScale && (
        <>
          <line x1={left} x2={width - pad} y1={yv(hi)} y2={yv(hi)} className="chart-grid" />
          {hi !== lo && <line x1={left} x2={width - pad} y1={yv(lo)} y2={yv(lo)} className="chart-grid" />}
          <text x={0} y={yv(hi) + 4} className="chart-label">{label(hi)}</text>
          {hi !== lo && <text x={0} y={yv(lo) + 4} className="chart-label">{label(lo)}</text>}
        </>
      )}
      <path d={d} fill="none" stroke="var(--ink)" strokeWidth={6} strokeLinejoin="miter" />
      <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="miter" />
      {values.map((v, i) => (
        <rect key={i} x={x(i) - 3} y={yv(v) - 3} width={6} height={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
      ))}
    </svg>
  )
}
