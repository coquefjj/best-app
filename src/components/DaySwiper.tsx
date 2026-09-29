import { useLayoutEffect, useRef, type ReactNode, type TouchEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays } from '../lib/date'

/**
 * Day pager for dated pages such as `/workout/:date`, modelled on
 * react-native-swipe-calendar's infinite pager: the previous and next days are
 * rendered beside the current one, the strip follows your finger, and on release
 * it snaps to the next page or springs back based on distance and flick speed.
 * Swipe left for the next day, right for the previous day.
 */

/** Movement before we decide whether a touch is a sideways swipe or a scroll. */
const LOCK_PX = 10
/** Share of the screen width that commits a page change on a slow drag. */
const COMMIT_SHARE = 0.3
/** Flick speed (px per ms) that commits a page change even on a short drag. */
const COMMIT_VELOCITY = 0.35
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** Don't start a swipe on form fields, dialogs, or anything that scrolls sideways. */
function blocksSwipe(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null
  if (el?.closest('input, textarea, select, [contenteditable], [role="slider"], [role="dialog"], .move-backdrop, [data-no-swipe]')) {
    return true
  }
  for (; el && el !== document.body; el = el.parentElement) {
    const ox = getComputedStyle(el).overflowX
    if ((ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth) return true
  }
  return false
}

type Drag = {
  x: number
  y: number
  lock: 'x' | 'y' | null
  dx: number
  /** Recent samples for release velocity. */
  samples: { x: number; t: number }[]
}

export default function DaySwiper({
  base,
  iso,
  renderDay,
}: {
  base: string
  iso: string
  renderDay: (iso: string) => ReactNode
}) {
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const settling = useRef(false)
  /** Set when a swipe animation already carried us to the new day. */
  const swiped = useRef<string | null>(null)
  const lastIso = useRef(iso)

  const prev = addDays(iso, -1)
  const next = addDays(iso, 1)

  const setX = (x: number, ms = 0) => {
    const strip = stripRef.current
    if (!strip) return
    strip.style.transition = ms ? `transform ${ms}ms ${EASE}` : 'none'
    strip.style.transform = x ? `translate3d(${x}px, 0, 0)` : ''
  }

  /** Line the side pages up with the top of the screen so they peek in where you are looking. */
  const alignSides = (top: number) => {
    stripRef.current?.querySelectorAll<HTMLElement>('.day-side').forEach((el) => {
      el.style.top = `${top}px`
    })
  }

  // After the date changes, show the new day in place. If it came from an arrow tap,
  // slide it in from the matching side so arrows and swipes feel the same.
  useLayoutEffect(() => {
    const from = lastIso.current
    lastIso.current = iso
    if (from === iso) return
    alignSides(0)
    if (swiped.current === iso) {
      swiped.current = null
      setX(0)
      window.scrollTo({ top: 0 })
      return
    }
    const w = boxRef.current?.clientWidth ?? 0
    const dir = from === addDays(iso, -1) ? 1 : from === addDays(iso, 1) ? -1 : 0
    if (!dir || !w || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setX(0)
      return
    }
    setX(dir * w)
    void stripRef.current?.offsetWidth
    setX(0, 280)
  }, [iso])

  const onTouchStart = (e: TouchEvent) => {
    if (settling.current || e.touches.length !== 1 || blocksSwipe(e.target)) {
      drag.current = null
      return
    }
    const t = e.touches[0]
    drag.current = { x: t.clientX, y: t.clientY, lock: null, dx: 0, samples: [{ x: t.clientX, t: e.timeStamp }] }
  }

  const onTouchMove = (e: TouchEvent) => {
    const d = drag.current
    if (!d || e.touches.length !== 1) return
    const t = e.touches[0]
    const dx = t.clientX - d.x
    const dy = t.clientY - d.y
    if (!d.lock) {
      if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return
      d.lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'
      if (d.lock === 'y') return
      alignSides(Math.max(0, window.scrollY - (boxRef.current?.offsetTop ?? 0)))
    }
    if (d.lock !== 'x') return
    d.dx = dx
    d.samples.push({ x: t.clientX, t: e.timeStamp })
    if (d.samples.length > 5) d.samples.shift()
    setX(dx)
  }

  const onTouchEnd = () => {
    const d = drag.current
    drag.current = null
    if (!d || d.lock !== 'x') return
    const w = boxRef.current?.clientWidth ?? window.innerWidth
    const first = d.samples[0]
    const last = d.samples[d.samples.length - 1]
    const v = last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0
    const flick = Math.abs(v) > COMMIT_VELOCITY && Math.sign(v) === Math.sign(d.dx)
    if (Math.abs(d.dx) < w * COMMIT_SHARE && !flick) {
      setX(0, 260)
      return
    }
    const goNext = d.dx < 0
    const target = goNext ? -w : w
    // Faster flicks finish faster, like the pager's spring carrying the release speed.
    const remaining = Math.abs(target - d.dx)
    const ms = Math.round(Math.min(300, Math.max(140, remaining / Math.max(Math.abs(v), 0.8))))
    settling.current = true
    setX(target, ms)
    const strip = stripRef.current
    const done = () => {
      settling.current = false
      const day = goNext ? next : prev
      swiped.current = day
      navigate(`/${base}/${day}`)
    }
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      strip?.removeEventListener('transitionend', finish)
      done()
    }
    strip?.addEventListener('transitionend', finish)
    window.setTimeout(finish, ms + 80)
  }

  return (
    <div
      ref={boxRef}
      className="day-swiper"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div ref={stripRef} className="day-strip">
        {[prev, iso, next].map((day) => (
          <div
            key={day}
            className={day === iso ? 'day-current' : `day-side ${day === prev ? 'day-prev' : 'day-next'}`}
            aria-hidden={day === iso ? undefined : true}
            inert={day !== iso}
          >
            {renderDay(day)}
          </div>
        ))}
      </div>
    </div>
  )
}
