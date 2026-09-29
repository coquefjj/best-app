import { useRef, type TouchEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { addDays } from './date'

/** Horizontal distance a finger must travel before a swipe changes the day. */
const MIN_DX = 60
/** A swipe must be clearly more sideways than up/down, so scrolling never flips the day. */
const RATIO = 1.8
const MAX_MS = 800

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

export type SwipeDir = 'next' | 'prev'

/**
 * Swipe left for the next day and right for the previous day on a dated page
 * such as `/workout/:date`. Spread the returned handlers on the page root.
 */
export function useDaySwipe(base: string, iso: string) {
  const navigate = useNavigate()
  const start = useRef<{ x: number; y: number; t: number } | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1 || blocksSwipe(e.target)) {
      start.current = null
      return
    }
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY, t: Date.now() }
  }

  const onTouchEnd = (e: TouchEvent) => {
    const s = start.current
    start.current = null
    if (!s || e.changedTouches.length !== 1) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < MIN_DX || Math.abs(dx) < Math.abs(dy) * RATIO || Date.now() - s.t > MAX_MS) return
    if (window.getSelection()?.toString()) return
    const dir: SwipeDir = dx < 0 ? 'next' : 'prev'
    window.scrollTo({ top: 0 })
    navigate(`/${base}/${addDays(iso, dir === 'next' ? 1 : -1)}`, { state: { swipe: dir } })
  }

  const onTouchCancel = () => {
    start.current = null
  }

  return { onTouchStart, onTouchEnd, onTouchCancel }
}

/** Class that slides the page in from the side it was swiped toward. */
export function useSwipeInClass(): string {
  const state = useLocation().state as { swipe?: SwipeDir } | null
  return state?.swipe === 'next' ? ' swipe-in-next' : state?.swipe === 'prev' ? ' swipe-in-prev' : ''
}
