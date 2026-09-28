import { useEffect } from 'react'
import MoveAnim from './MoveAnim'
import { MOVES } from './moves'

export default function MoveSheet({ name, cue, onClose }: { name: string; cue?: string; onClose: () => void }) {
  const move = MOVES[name]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!move) return null
  return (
    <div className="move-backdrop" onClick={onClose}>
      <div className="card move-sheet" role="dialog" aria-modal="true" aria-label={`How to do ${name}`} onClick={(e) => e.stopPropagation()}>
        <div className="move-stage">
          <MoveAnim move={move} size={240} label={name} />
        </div>
        <h2>{name}</h2>
        {cue && <div className="subtle">Cue: {cue}</div>}
        <ol className="move-points">
          {move.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <button className="btn full" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}
