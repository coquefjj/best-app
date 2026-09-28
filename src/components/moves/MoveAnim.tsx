import { useEffect, useState } from 'react'
import { frameDurations, moveSrc, type Move } from './moves'

const frameCache = new Map<string, number>()

/** Number of frames in the move's strip, or null while loading / if it doesn't exist yet. */
export function useMoveFrames(move: Move | undefined) {
  const src = move ? moveSrc(move) : ''
  const [frames, setFrames] = useState<number | null>(() => frameCache.get(src) ?? null)

  useEffect(() => {
    if (!src) return
    if (frameCache.has(src)) {
      setFrames(frameCache.get(src)!)
      return
    }
    let alive = true
    const img = new Image()
    img.onload = () => {
      // Frames are square, so the strip's height is the frame size
      const n = Math.max(1, Math.round(img.naturalWidth / img.naturalHeight))
      frameCache.set(src, n)
      if (alive) setFrames(n)
    }
    img.src = src
    return () => {
      alive = false
    }
  }, [src])

  return move ? frames : null
}

export default function MoveAnim({ move, frames, size, label }: { move: Move; frames: number; size: number; label: string }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (frames < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const durations = frameDurations(frames)
    let i = 0
    let timer = 0
    const next = () => {
      timer = window.setTimeout(() => {
        i = (i + 1) % frames
        setFrame(i)
        next()
      }, durations[i])
    }
    next()
    return () => window.clearTimeout(timer)
  }, [frames])

  return (
    <div
      className="move-anim"
      role="img"
      aria-label={`${label} demonstration`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${moveSrc(move)})`,
        backgroundSize: `${frames * size}px ${size}px`,
        backgroundPosition: `${-frame * size}px 0`,
      }}
    />
  )
}
