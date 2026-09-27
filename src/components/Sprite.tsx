import { PALETTE, SPRITES, type SpriteName } from './sprites'

interface SpriteProps {
  name: SpriteName
  /** Size of one sprite pixel in CSS px. */
  scale?: number
  className?: string
  title?: string
}

export default function Sprite({ name, scale = 3, className, title }: SpriteProps) {
  const rows = SPRITES[name]
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  const rects: { x: number; y: number; len: number; fill: string }[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let len = 1
      while (row[x + len] === ch) len++
      if (ch !== '.' && PALETTE[ch]) rects.push({ x, y, len, fill: PALETTE[ch] })
      x += len
    }
  })

  return (
    <svg
      className={className ? `sprite ${className}` : 'sprite'}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.len} height={1} fill={r.fill} />
      ))}
    </svg>
  )
}
