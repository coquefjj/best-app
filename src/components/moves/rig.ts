// Tiny pixel "trainer" rig. Poses are joint targets on a 48-unit grid (side
// view, facing right, floor at y=44); limbs are solved with 2-bone IK and
// rasterised as outlined capsules so every frame reads as hand-placed pixels.

/** Poses are authored on a 48-unit grid and drawn onto a 64px canvas. */
export const SIZE = 64
export const FLOOR_Y = 60
const K = 1.2
const T = ([x, y]: Pt): Pt => [x * K + 3, (y - 44) * K + FLOOR_Y]

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

const LEN = { torso: 13, head: 18.5, upper: 7, fore: 7, thigh: 9, shin: 9 }

// Colours sampled from Fernando's reference sprite (orange side ponytail,
// yellow crop top, red suspenders, teal shorts, red-and-white sneakers).
const PAL = {
  outline: '#140c0a',
  skin: '#fccca1',
  skinShade: '#e3a878',
  skinFar: '#d19a70',
  hair: '#fa8219',
  hairLight: '#ffad66',
  hairDark: '#994700',
  top: '#fff373',
  topShade: '#d6c956',
  topFar: '#b0a341',
  strap: '#ff1100',
  shorts: '#21c4b6',
  shortsFar: '#14878f',
  shoe: '#ffffff',
  shoeFar: '#d6d6d6',
  sole: '#fc5d65',
  eye: '#3a00fa',
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

/** Capsule in pose units (converted to canvas pixels here). */
function capsule(buf: Buf, a0: Pt, b0: Pt, r0: number, color: string) {
  const [x1, y1] = T(a0)
  const [x2, y2] = T(b0)
  const r = r0 * K
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

function dot(buf: Buf, p0: Pt, color: string) {
  const [x, y] = T(p0).map(Math.floor)
  if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) buf[y * SIZE + x] = color
}

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
  const off = (from: Pt, u: number, f: number): Pt => at(at(from, up, u), face, f)
  const shoulder = at(p.hip, up, LEN.torso - 1)
  const head = at(p.hip, up, LEN.head)
  const knee = p.knee ?? -1
  const elbow = p.elbow ?? 1
  const foot = p.foot ?? [3, 0.5]

  const leg = (l: Buf, ankle: Pt, far: boolean) => {
    const [k, a] = solve(p.hip, ankle, LEN.thigh, LEN.shin, knee)
    const toe: Pt = [a[0] + foot[0], a[1] + foot[1]]
    capsule(l, p.hip, k, 1.5, far ? PAL.skinFar : PAL.skin)
    capsule(l, k, a, 1.35, far ? PAL.skinFar : PAL.skin)
    capsule(l, [a[0], a[1] + 0.35], [toe[0], toe[1] + 0.35], 1.45, PAL.sole)
    capsule(l, a, toe, 1.1, far ? PAL.shoeFar : PAL.shoe)
    // Short shorts: only the top third of the thigh
    capsule(l, p.hip, at(p.hip, [k[0] - p.hip[0], k[1] - p.hip[1]], 0.38), 2, far ? PAL.shortsFar : PAL.shorts)
  }
  const arm = (l: Buf, hand: Pt, far: boolean) => {
    const [e, h] = solve(shoulder, hand, LEN.upper, LEN.fore, elbow)
    capsule(l, shoulder, e, 1.1, far ? PAL.skinFar : PAL.skin)
    capsule(l, e, h, 1, far ? PAL.skinFar : PAL.skin)
    disc(l, h, 1.3, far ? PAL.skinFar : PAL.skin)
  }

  stamp(buf, (l) => {
    leg(l, p.ankleF, true)
    arm(l, p.handF, true)
  })
  stamp(buf, (l) => {
    // Side ponytail hangs behind the head
    capsule(l, off(head, 1, -4), off(head, -3, -6.5), 1.9, PAL.hair)
    capsule(l, off(head, -3, -6.5), off(head, -5, -6), 1.3, PAL.hair)
    dot(l, off(head, -1, -5.6), PAL.hairLight)
    dot(l, off(head, -4, -6.6), PAL.hairDark)
    // Torso: bare midriff, yellow crop top with red strap, teal shorts
    capsule(l, p.hip, shoulder, 3, PAL.skin)
    capsule(l, at(p.hip, up, 4.8), shoulder, 3.4, PAL.top)
    capsule(l, off(p.hip, 5.5, -2.6), off(shoulder, 0, -2.6), 0.6, PAL.topShade)
    capsule(l, off(p.hip, -0.3, 0), off(p.hip, 3, 0), 3, PAL.shorts)
    capsule(l, off(p.hip, 2.5, 1.2), off(shoulder, 0.8, 0.2), 0.45, PAL.strap)
    // Head: skin, hair cap with bangs over the forehead
    disc(l, at(head, face, 0.4), 4.9, PAL.skin)
    capsule(l, off(head, 1.2, -1.2), off(head, 1.2, -1.2), 5, PAL.hair)
    capsule(l, off(head, 3.2, -1), off(head, 2.6, 3.8), 1.8, PAL.hair)
    capsule(l, off(head, 3.8, -2.5), off(head, 3.6, 1.5), 0.6, PAL.hairLight)
    capsule(l, off(head, -1, -3.6), off(head, -3.2, -2.6), 1.2, PAL.hairDark)
    // Face
    capsule(l, off(head, -0.6, 0.2), off(head, -3.6, 3.6), 3.1, PAL.skin)
    capsule(l, off(head, 0.3, 2.8), off(head, -0.8, 2.8), 0.55, PAL.outline)
    dot(l, off(head, -1, 2.9), PAL.eye)
  })
  stamp(buf, (l) => leg(l, p.ankleN, false))
  if (p.prop === 'barbell') {
    const c: Pt = [(p.handN[0] + p.handF[0]) / 2, (p.handN[1] + p.handF[1]) / 2 + 1]
    stamp(buf, (l) => {
      disc(l, c, 4, PAL.plate)
      disc(l, c, 1.2, PAL.plateHub)
    })
  }
  stamp(buf, (l) => arm(l, p.handN, false))

  if (p.guide && p.guide > 0.5) {
    const from: Pt = [p.ankleN[0], p.ankleN[1] - 4]
    const to = at(shoulder, up, 1)
    const n = Math.round(Math.hypot(to[0] - from[0], to[1] - from[1]) * K)
    for (let i = 0; i <= n; i++) {
      if (i % 4 > 1) continue
      const pt: Pt = [from[0] + ((to[0] - from[0]) * i) / n, from[1] + ((to[1] - from[1]) * i) / n - 3]
      dot(buf, pt, PAL.guide)
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
