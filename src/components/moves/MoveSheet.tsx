import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import MoveAnim, { useMoveFrames } from './MoveAnim'
import { MOVES } from './moves'

export default function MoveSheet({ name, cue, onClose }: { name: string; cue?: string; onClose: () => void }) {
  const move = MOVES[name]
  const frames = useMoveFrames(move)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!move || !frames) return null
  // Portal to <body>: the day swiper's transform would otherwise make position:fixed
  // relative to the whole (scrolled) page instead of the screen
  return createPortal(
    <div className="move-backdrop" onClick={onClose}>
      <div className="card move-sheet" role="dialog" aria-modal="true" aria-label={`How to do ${name}`} onClick={(e) => e.stopPropagation()}>
        <div className="move-stage">
          <MoveAnim move={move} frames={frames} size={256} label={name} />
        </div>
        <h2>{name}</h2>
        {cue && <div className="subtle">Cue: {cue}</div>}
        {move.points && (
          <ol className="move-points">
            {move.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        )}
        <button className="btn full" onClick={onClose}>Got it</button>
      </div>
    </div>,
    document.body,
  )
}
