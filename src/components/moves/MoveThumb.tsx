import MoveAnim, { useMoveFrames } from './MoveAnim'
import { MOVES } from './moves'

/** "How to" button for an exercise; renders nothing until its sprite exists. */
export default function MoveThumb({ name, onOpen }: { name: string; onOpen: () => void }) {
  const move = MOVES[name]
  const frames = useMoveFrames(move)
  if (!move || !frames) return null
  return (
    <button className="move-thumb" onClick={onOpen} aria-label={`Show how to do ${name}`}>
      <MoveAnim move={move} frames={frames} size={64} label={name} />
      <span>How to</span>
    </button>
  )
}
