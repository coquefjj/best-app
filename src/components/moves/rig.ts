// Tiny pixel "trainer" rig. Poses are joint targets on a 48x48 grid (side
// view, facing right, floor at y=44); limbs are solved with 2-bone IK and
// rasterised as outlined capsules so every frame reads as hand-placed pixels.

export const SIZE = 48
export const FLOOR_Y = 44

type Pt = [number, number]

export interface Pose {
  hip: Pt
  /** Torso lean in degrees from vertical; 90 = lying face down, head to the right */
  torso: number
  ankleN: Pt
  ankleF: Pt
  handN: Pt
  handF: Pt
  /** Direction the foot points from the ankle */
  foot?: Pt
  /** Which way knees and elbows bend (1 or -1) */
  knee?: number
  elbow?: number
  prop?: 'barbell' | 'none'
  /** Dashed straight-line guide from ankle to head (0 = hidden, 1 = shown) */
  guide?: number
}

const LEN = { torso: 13, head: 18, upper: 7, fore: 7, thigh: 9, shin: 9 }

const PAL = {
  outline: '#3a2418',
  skin: '#f2c38e',
  skinDark: '#d69c68',
  shirt: '#d8402f',
  shirtDark: '#a52c20',
  shorts: '#2f5aa8',
  shortsDark: '#23437e',
  shoe: '#f6ead0',
  shoeDark: '#cdbf9f',
  hair: '#2b2530',
  cap: '#d8402f',
  capWhite: '#fbf6ea',
  plate: '#4a4a52',
  plateHub: '#9aa0a8',
  guide: '#3f9a5a',
  bg: '#f6ead0',
  floor: '#d7b27a',
  floorLine: '#b88a52',
}

type Buf = (string | null)[]

function newBuf(): Buf {
  return new Array(SIZE * SIZE).fill(null)
}

function capsule(buf: Buf, a: Pt, b: Pt, r: number, color: string) {
  const [x1, y1] = a
  const [x2, y2] = b
  const minX = Math.max(0, Math.floor(Math.min(x1, x2) - r - 1))
  const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(x1, x2) + r + 1))
  const minY = Math.max(0, Math.floor(Math.min(y1, y2) - r - 1))
  const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(y1, y2) + r + 1))
  const dx = x2 - x1
  const dy = y2 - y1
  const l2 = dx * dx + dy * dy || 1
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2))
      const qx = x1 + t * dx - px
      const qy = y1 + t * dy - py
      if (qx * qx + qy * qy <= r * r) buf[y * SIZE + x] = color
    }
  }
}

const disc = (buf: Buf, c: Pt, r: number, color: string) => capsule(buf, c, c, r, color)

/** Two-bone IK: returns the middle joint (knee/elbow). */
function solve(root: Pt, target: Pt, a: number, b: number, dir: number): [Pt, Pt] {
  let dx = target[0] - root[0]
  let dy = target[1] - root[1]
  let d = Math.hypot(dx, dy) || 0.001
  const maxD = a + b - 0.01
  if (d > maxD) {
    dx *= maxD / d
    dy *= maxD / d
    d = maxD
  }
  const theta = Math.atan2(dy, dx)
  const cos = (a * a + d * d - b * b) / (2 * a * d)
  const off = Math.acos(Math.max(-1, Math.min(1, cos)))
  const mid: Pt = [root[0] + a * Math.cos(theta + dir * off), root[1] + a * Math.sin(theta + dir * off)]
  return [mid, [root[0] + dx, root[1] + dy]]
}

/** Draws a group into its own layer, then stamps outline + fill onto buf. */
function stamp(buf: Buf, draw: (layer: Buf) => void) {
  const layer = newBuf()
  draw(layer)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (layer[y * SIZE + x]) continue
      const n =
        (x > 0 && layer[y * SIZE + x - 1]) ||
        (x < SIZE - 1 && layer[y * SIZE + x + 1]) ||
        (y > 0 && layer[(y - 1) * SIZE + x]) ||
        (y < SIZE - 1 && layer[(y + 1) * SIZE + x])
      if (n) buf[y * SIZE + x] = PAL.outline
    }
  }
  for (let i = 0; i < layer.length; i++) if (layer[i]) buf[i] = layer[i]
}

export function renderPose(p: Pose): Buf {
  const buf = newBuf()
  const rad = (p.torso * Math.PI) / 180
  const up: Pt = [Math.sin(rad), -Math.cos(rad)]
  const face: Pt = [-up[1], up[0]]
  const at = (from: Pt, v: Pt, k: number): Pt => [from[0] + v[0] * k, from[1] + v[1] * k]
  const shoulder = at(p.hip, up, LEN.torso)
  const head = at(p.hip, up, LEN.head)
  const knee = p.knee ?? -1
  const elbow = p.elbow ?? 1
  const foot = p.foot ?? [3, 0.5]

  const leg = (l: Buf, ankle: Pt, dark: boolean) => {
    const [k, a] = solve(p.hip, ankle, LEN.thigh, LEN.shin, knee)
    capsule(l, k, a, 1.3, dark ? PAL.skinDark : PAL.skin)
    capsule(l, a, [a[0] + foot[0], a[1] + foot[1]], 1.4, dark ? PAL.shoeDark : PAL.shoe)
    capsule(l, p.hip, k, 1.8, dark ? PAL.shortsDark : PAL.shorts)
  }
  const arm = (l: Buf, hand: Pt, dark: boolean) => {
    const [e, h] = solve(shoulder, hand, LEN.upper, LEN.fore, elbow)
    capsule(l, e, h, 1.2, dark ? PAL.skinDark : PAL.skin)
    capsule(l, shoulder, e, 1.5, dark ? PAL.shirtDark : PAL.shirt)
  }

  stamp(buf, (l) => {
    leg(l, p.ankleF, true)
    arm(l, p.handF, true)
  })
  stamp(buf, (l) => {
    capsule(l, p.hip, shoulder, 2.6, PAL.shirt)
    capsule(l, at(p.hip, up, -0.5), at(p.hip, up, 2), 2.7, PAL.shorts)
    capsule(l, shoulder, at(p.hip, up, LEN.torso + 2.5), 1.2, PAL.skin)
    // Head: skin, hair at the back, cap on top with the brim facing forward
    disc(l, head, 3.6, PAL.skin)
    disc(l, at(head, face, -1.4), 2.6, PAL.hair)
    capsule(l, at(at(head, up, 1.6), face, -2.2), at(at(head, up, 1.6), face, 1.6), 2, PAL.cap)
    capsule(l, at(at(head, up, 1.2), face, 2), at(at(head, up, 1.2), face, 4), 0.7, PAL.cap)
    capsule(l, at(at(head, up, 2.6), face, -0.4), at(at(head, up, 2.6), face, 0.6), 0.6, PAL.capWhite)
    const eye = at(at(head, face, 1.6), up, -0.2)
    l[Math.floor(eye[1]) * SIZE + Math.floor(eye[0])] = PAL.outline
  })
  stamp(buf, (l) => leg(l, p.ankleN, false))
  if (p.prop === 'barbell') {
    const c: Pt = [(p.handN[0] + p.handF[0]) / 2, (p.handN[1] + p.handF[1]) / 2 + 1]
    stamp(buf, (l) => {
      disc(l, c, 4.6, PAL.plate)
      disc(l, c, 1.2, PAL.plateHub)
    })
  }
  stamp(buf, (l) => arm(l, p.handN, false))

  if (p.guide && p.guide > 0.5) {
    const from: Pt = [p.ankleN[0], p.ankleN[1] - 3]
    const to = at(shoulder, up, 1)
    const n = Math.round(Math.hypot(to[0] - from[0], to[1] - from[1]))
    for (let i = 0; i <= n; i++) {
      if (i % 4 > 1) continue
      const x = Math.floor(from[0] + ((to[0] - from[0]) * i) / n)
      const y = Math.floor(from[1] + ((to[1] - from[1]) * i) / n) - 4
      if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) buf[y * SIZE + x] = PAL.guide
    }
  }
  return buf
}

export function paint(ctx: CanvasRenderingContext2D, buf: Buf) {
  const img = ctx.createImageData(SIZE, SIZE)
  const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x
      let c = buf[i]
      if (!c) c = y < FLOOR_Y ? PAL.bg : (x + (y - FLOOR_Y) * 2) % 8 === 0 || y === FLOOR_Y ? PAL.floorLine : PAL.floor
      const [r, g, b] = hex(c)
      img.data.set([r, g, b, 255], i * 4)
    }
  }
  ctx.putImageData(img, 0, 0)
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]

export function blend(a: Pose, b: Pose, t: number): Pose {
  return {
    ...a,
    hip: lerpPt(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    ankleN: lerpPt(a.ankleN, b.ankleN, t),
    ankleF: lerpPt(a.ankleF, b.ankleF, t),
    handN: lerpPt(a.handN, b.handN, t),
    handF: lerpPt(a.handF, b.handF, t),
    foot: lerpPt(a.foot ?? [3, 0.5], b.foot ?? [3, 0.5], t),
    guide: t < 0.5 ? a.guide : b.guide,
  }
}
