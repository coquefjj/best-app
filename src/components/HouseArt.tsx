// Top-down pixel-art house, drawn in code as a list of 1x1-unit rects.
// Coordinates are in art pixels; the SVG scales them up with crisp edges.

export const HOUSE_W = 120
export const HOUSE_H = 136

/** Room rectangles (floor area incl. back wall), used for tap targets and labels. */
export const ROOMS = {
  gym: { x: 8, y: 9, w: 42, h: 40 },
  kitchen: { x: 70, y: 9, w: 42, h: 40 },
  bedroom: { x: 8, y: 52, w: 42, h: 43 },
  studio: { x: 70, y: 52, w: 42, h: 43 },
  entrance: { x: 50, y: 86, w: 20, h: 26 },
} as const

type Rect = [number, number, number, number, string]

const OUT = '#202030'
const WOOD = '#a06838'
const LEAF = '#38a048'
const POT = '#c86838'
const GLASS = '#90d0f8'

function draw(): Rect[] {
  const px: Rect[] = []
  const r = (x: number, y: number, w: number, h: number, c: string) => px.push([x, y, w, h, c])
  /** Box with a 1px dark outline, the classic handheld-RPG furniture look. */
  const ob = (x: number, y: number, w: number, h: number, c: string) => {
    r(x, y, w, h, OUT)
    r(x + 1, y + 1, w - 2, h - 2, c)
  }
  const plant = (x: number, y: number) => {
    ob(x + 1, y + 5, 5, 5, POT)
    r(x + 2, y + 6, 3, 1, '#e08850')
    ob(x, y, 7, 6, LEAF)
    r(x + 2, y + 1, 2, 2, '#68c860')
  }
  const windowAt = (x: number, y: number) => {
    ob(x, y, 9, 5, GLASS)
    r(x + 4, y + 1, 1, 3, '#f8f8f8')
    r(x + 1, y + 2, 7, 1, '#f8f8f8')
  }
  const tree = (x: number, y: number) => {
    ob(x + 4, y + 10, 4, 5, '#8a5028')
    ob(x, y, 12, 11, '#389840')
    r(x + 1, y + 7, 10, 3, '#287830')
    r(x + 2, y + 2, 4, 3, '#68c060')
    r(x + 3, y + 1, 2, 1, '#88d878')
  }
  const planks = (x: number, y: number, w: number, h: number, c: string, line: string) => {
    r(x, y, w, h, c)
    for (let yy = y + 3; yy < y + h; yy += 4) r(x, yy, w, 1, line)
    for (let yy = y, i = 0; yy < y + h; yy += 4, i++) {
      for (let xx = x + (i % 2 ? 5 : 11); xx < x + w; xx += 14) r(xx, yy, 1, 3, line)
    }
  }
  const wallFace = (x: number, y: number, w: number, c: string, base: string) => {
    r(x, y, w, 6, c)
    r(x, y + 5, w, 1, base)
  }

  // Grass with tufts
  r(0, 0, HOUSE_W, HOUSE_H, '#88d070')
  for (let i = 0; i < 90; i++) {
    const x = (i * 37 + 11) % (HOUSE_W - 3)
    const y = (i * 53 + 7) % (HOUSE_H - 2)
    r(x, y, 1, 1, '#68b050')
    r(x + 2, y, 1, 1, '#68b050')
    r(x + 1, y + 1, 1, 1, '#68b050')
  }

  // House shell: outline, then wall mass, then carve rooms
  r(4, 5, 112, 94, OUT)
  r(5, 6, 110, 92, '#585868')
  r(5, 6, 110, 1, '#787888')

  // ---- Gym (top-left)
  wallFace(8, 9, 42, '#b8c8e0', '#8898b8')
  r(8, 15, 42, 34, '#607080')
  for (let x = 8; x < 50; x += 7) r(x, 15, 1, 34, '#566676')
  for (let y = 21; y < 49; y += 7) r(8, y, 42, 1, '#566676')
  ob(11, 9, 13, 5, '#d8f4fc') // mirror
  r(13, 10, 1, 3, '#ffffff')
  windowAt(31, 9)
  ob(10, 16, 18, 5, '#8a6040') // dumbbell rack
  ;['#e04040', '#4070e0', '#f0c030', '#40b060', '#303038'].forEach((c, i) => {
    ob(11 + i * 3, 16, 3, 3, c)
  })
  ob(19, 26, 6, 14, '#c83838') // bench
  r(20, 27, 4, 3, '#e05858')
  ob(16, 25, 2, 5, '#9098a0') // rack uprights
  ob(26, 25, 2, 5, '#9098a0')
  r(13, 28, 18, 1, '#b8b8c0') // barbell
  ob(12, 26, 3, 5, '#303038')
  ob(29, 26, 3, 5, '#303038')
  ob(37, 16, 11, 5, '#707880') // treadmill console
  r(40, 17, 5, 2, '#58d0f0')
  ob(38, 20, 9, 20, '#404048')
  r(40, 22, 5, 16, '#282830')
  ob(12, 42, 5, 5, '#383840') // kettlebells
  r(13, 41, 3, 1, '#383840')
  ob(18, 42, 5, 5, '#e07020')
  r(19, 41, 3, 1, '#e07020')
  ob(27, 42, 16, 5, '#48a868') // yoga mat
  r(28, 43, 14, 1, '#68c888')

  // ---- Kitchen (top-right)
  wallFace(70, 9, 42, '#f8e8b8', '#d8b888')
  for (let y = 15; y < 49; y += 4)
    for (let x = 70; x < 112; x += 4) r(x, y, 4, 4, ((x - 70) / 4 + (y - 15) / 4) % 2 ? '#f8f8f0' : '#c0dcf0')
  windowAt(80, 9)
  ob(71, 14, 28, 7, '#c89060') // cabinets
  r(72, 15, 26, 2, '#e8e8e8') // countertop
  r(72, 18, 26, 1, '#a07040')
  ob(75, 14, 7, 4, '#a8b8c8') // sink
  r(76, 15, 5, 2, '#6888a8')
  r(78, 13, 1, 2, '#909098')
  ob(87, 14, 9, 7, '#383840') // stove
  r(88, 15, 2, 2, '#e04030')
  r(93, 15, 2, 2, '#e04030')
  r(88, 18, 7, 1, '#58585f')
  ob(100, 11, 10, 12, '#e8f0f8') // fridge
  r(101, 16, 8, 1, '#b0c0d0')
  r(102, 13, 1, 2, '#8090a0')
  r(102, 18, 1, 3, '#8090a0')
  ob(79, 28, 18, 10, '#b07840') // table
  r(80, 29, 16, 1, '#c89058')
  r(82, 31, 3, 3, '#ffffff')
  r(91, 32, 3, 3, '#ffffff')
  ob(86, 30, 4, 3, '#f8f8f8')
  r(87, 29, 1, 1, '#e04030')
  r(88, 29, 1, 1, '#f8c030')
  ob(75, 30, 4, 6, '#8a5a30') // chairs
  ob(97, 30, 4, 6, '#8a5a30')
  ob(85, 38, 6, 4, '#8a5a30')
  plant(103, 37)

  // ---- Bedroom (bottom-left)
  wallFace(8, 52, 42, '#f8d0d8', '#d0a0b0')
  planks(8, 58, 42, 37, '#d8a868', '#c09050')
  windowAt(30, 52)
  ob(10, 56, 14, 23, '#905830') // bed frame
  ob(11, 57, 12, 5, '#ffffff') // pillow
  ob(11, 61, 12, 17, '#3868d0') // blanket
  r(12, 62, 10, 2, '#6890f0')
  ob(25, 58, 6, 6, WOOD) // nightstand + lamp
  ob(26, 55, 4, 4, '#f8e070')
  r(27, 56, 1, 1, '#fff8c0')
  ob(24, 74, 17, 11, '#d05858') // rug
  r(27, 77, 11, 5, '#e88888')
  ob(40, 57, 9, 15, '#8a5028') // wardrobe
  r(44, 58, 1, 13, '#603818')
  r(43, 64, 1, 1, '#f8d060')
  r(45, 64, 1, 1, '#f8d060')
  ob(42, 86, 6, 5, '#d8d8e0') // scale
  r(43, 87, 4, 1, '#303038')
  plant(10, 83)

  // ---- Studio (bottom-right)
  wallFace(70, 52, 42, '#d8e8c0', '#a8c090')
  r(70, 58, 42, 37, '#a898c8')
  for (let y = 60; y < 95; y += 3) for (let x = 71 + (y % 2); x < 112; x += 4) r(x, y, 1, 1, '#9888b8')
  ob(73, 52, 15, 5, '#f8f8f8') // whiteboard with a trend line
  ;[[75, 55], [77, 54], [79, 54], [81, 53], [83, 53], [85, 52]].forEach(([x, y]) => r(x, y + 1, 2, 1, '#e04030'))
  ob(72, 58, 10, 15, '#8a5028') // bookshelf
  for (const sy of [59, 63, 67]) {
    ;['#e04040', '#4070e0', '#f0c030', '#40b060', '#b060d0', '#f08030', '#e04040', '#4070e0'].forEach((c, i) =>
      r(73 + i, sy, 1, 3, c),
    )
    r(73, sy + 3, 8, 1, '#603818')
  }
  ob(91, 59, 19, 7, WOOD) // desk
  ob(95, 55, 9, 6, '#383848') // PC monitor
  r(96, 56, 7, 4, '#58c8f0')
  r(97, 57, 2, 1, '#ffffff')
  r(97, 62, 7, 1, '#d8d8e0')
  ob(97, 67, 6, 6, '#d04848') // chair
  ob(79, 82, 9, 7, '#f0a030') // meditation cushion
  r(81, 84, 5, 3, '#f8c860')
  plant(103, 83)

  // ---- Hall + entrance
  wallFace(53, 9, 14, '#e8d8b8', '#c0a880')
  planks(53, 15, 14, 80, '#c89858', '#b08040')
  ob(57, 9, 6, 5, '#f8f0d0') // clock
  r(59, 10, 1, 2, OUT)
  r(60, 11, 1, 1, OUT)
  r(57, 18, 6, 66, '#f8c860') // runner rug
  r(58, 18, 4, 66, '#c84848')
  plant(54, 16)
  // Doorways from the hall into each room
  for (const [x, y] of [[50, 37], [67, 37], [50, 81], [67, 81]]) {
    r(x, y, 3, 8, '#c89858')
    r(x, y - 1, 3, 1, OUT)
    r(x, y + 8, 3, 1, OUT)
  }
  ob(55, 87, 10, 6, '#a08050') // doormat
  r(57, 89, 6, 2, '#c8a870')
  r(55, 95, 10, 3, '#784828') // front door threshold
  r(55, 95, 10, 1, OUT)

  // ---- Garden
  ob(52, 98, 16, 4, '#c8c0b0') // porch step
  r(55, 102, 10, HOUSE_H - 102, '#d8cca8') // path
  for (let y = 105; y < HOUSE_H; y += 5) {
    r(55, y, 10, 1, '#b8ac88')
    r(y % 2 ? 58 : 61, y - 4, 1, 4, '#b8ac88')
  }
  ob(49, 99, 3, 5, '#f8d860') // lanterns
  ob(68, 99, 3, 5, '#f8d860')
  for (const bx of [7, 72]) {
    ob(bx, 100, 41, 7, '#48a848')
    for (let i = 0; i < 12; i++) r(bx + 2 + i * 3, 101 + (i % 3), 1, 1, ['#f84848', '#f8f048', '#ffffff'][i % 3])
  }
  ob(72, 112, 5, 4, '#e04030') // mailbox
  r(74, 116, 1, 5, '#8a5028')
  ob(38, 112, 12, 7, '#c89058') // sign
  r(40, 114, 8, 1, '#8a5028')
  r(40, 116, 6, 1, '#8a5028')
  r(43, 119, 2, 4, '#8a5028')
  tree(2, 110)
  tree(106, 110)
  tree(18, 121)
  tree(90, 121)
  return px
}

const RECTS = draw()

export default function HouseArt() {
  return (
    <svg
      className="house-art"
      viewBox={`0 0 ${HOUSE_W} ${HOUSE_H}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {RECTS.map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={c} />
      ))}
    </svg>
  )
}
