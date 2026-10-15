import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { library, type LibraryExercise } from '../data/library'
import { useMoveFrames } from './moves/MoveAnim'
import { MOVES, moveSrc } from './moves/moves'

/** First frame of the move's sprite, or an empty tile while it has none. */
function MoveIcon({ name }: { name: string }) {
  const move = MOVES[name]
  const frames = useMoveFrames(move)
  return (
    <span
      className="lib-icon"
      aria-hidden="true"
      style={
        move && frames
          ? { backgroundImage: `url(${moveSrc(move)})`, backgroundSize: `${frames * 100}% 100%` }
          : undefined
      }
    />
  )
}

/** The exercise library as a sheet: search, tap an exercise to add it to the day. */
export default function ExercisePicker({ added, onPick, onClose }: { added: string[]; onPick: (ex: LibraryExercise) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()
  const groups = library().map((g) => ({ ...g, exercises: g.exercises.filter((e) => !q || e.name.toLowerCase().includes(q)) })).filter((g) => g.exercises.length)

  // On the body, so the day pager's transform can't shift or clip the sheet.
  return createPortal(
    <div className="move-backdrop" onClick={onClose}>
      <div className="card move-sheet lib-sheet" role="dialog" aria-modal="true" aria-label="Exercise library" onClick={(e) => e.stopPropagation()}>
        <h2 className="card-head">
          <span>Exercise library</span>
          <button className="btn secondary small" onClick={onClose}>Close</button>
        </h2>
        <input className="lib-search" type="search" placeholder="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="lib-list">
          {groups.map((g) => (
            <section key={g.name}>
              <h3 className="lib-group">{g.name}</h3>
              {g.exercises.map((ex) => {
                const count = added.filter((n) => n === ex.name).length
                return (
                  <button key={ex.name} className="lib-row" onClick={() => onPick(ex)}>
                    <MoveIcon name={ex.name} />
                    <span className="lib-name">
                      {ex.name}
                      <span className="subtle">{ex.target.sets} x {ex.target.reps}</span>
                    </span>
                    <span className="lib-add" aria-hidden="true">{count ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </section>
          ))}
          {!groups.length && <p className="subtle">No exercise matches “{query}”.</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
