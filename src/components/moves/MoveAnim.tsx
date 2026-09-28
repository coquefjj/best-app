import { useEffect, useRef } from 'react'
import { SIZE, blend, paint, renderPose } from './rig'
import type { Move } from './moves'

const FPS = 10

function poseAt(move: Move, t: number) {
  const total = move.keys.reduce((s, k) => s + k.hold + k.move, 0)
  let ms = t % total
  for (let i = 0; i < move.keys.length; i++) {
    const k = move.keys[i]
    if (ms < k.hold) return k.pose
    ms -= k.hold
    if (ms < k.move) {
      const next = move.keys[(i + 1) % move.keys.length].pose
      const x = ms / k.move
      return blend(k.pose, next, x * x * (3 - 2 * x))
    }
    ms -= k.move
  }
  return move.keys[0].pose
}

export default function MoveAnim({ move, size, label }: { move: Move; size: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let lastFrame = -1
    const start = performance.now()
    const tick = (now: number) => {
      // Step at a low frame rate for a hand-animated feel
      const frame = Math.floor(((now - start) / 1000) * FPS)
      if (frame !== lastFrame) {
        lastFrame = frame
        paint(ctx, renderPose(poseAt(move, (frame * 1000) / FPS)))
      }
      raf = requestAnimationFrame(tick)
    }
    if (reduce) paint(ctx, renderPose(move.keys[move.keys.length - 1].pose))
    else raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [move])

  return <canvas ref={ref} className="move-anim" width={SIZE} height={SIZE} style={{ width: size, height: size }} role="img" aria-label={`${label} demonstration`} />
}
