import { useState } from 'react'
import { useStore } from '../lib/store'
import { formatHuman } from '../lib/date'
import { WEIGHT_KEY, parseKg, showKg, weighIns, weightOn } from '../lib/weight'

/** That day's body weight on Nutrition, with the change since the weigh-in before it. */
export default function WeightCard({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const kg = weightOn(data, iso)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const previous = weighIns(data).filter((w) => w.date < iso).pop()
  const typed = parseKg(text)

  const save = (value: number | null) => {
    setData((prev) => {
      const { [WEIGHT_KEY]: _, ...rest } = prev.habits[iso] ?? {}
      return { ...prev, habits: { ...prev.habits, [iso]: value == null ? rest : { ...rest, [WEIGHT_KEY]: value } } }
    })
    setEditing(false)
  }
  const open = () => {
    setText(kg != null ? String(kg) : previous ? String(previous.kg) : '')
    setEditing(true)
  }

  return (
    <div className="card weight-card">
      <h2>Weight</h2>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (typed != null) save(typed)
          }}
        >
          <div className="weight-entry">
            <input
              type="text"
              inputMode="decimal"
              aria-label="Weight in kg"
              value={text}
              autoFocus
              onFocus={(e) => e.target.select()}
              onChange={(e) => setText(e.target.value)}
            />
            <span>kg</span>
          </div>
          <div className="row">
            <button type="button" className="btn secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className="btn" disabled={typed == null}>Save</button>
          </div>
          {kg != null && (
            <button type="button" className="btn danger full" style={{ marginTop: 8 }} onClick={() => save(null)}>Delete</button>
          )}
        </form>
      ) : kg != null ? (
        <div className="weight-saved">
          <button className="entry-text" onClick={open}>
            <span className="weight-value">{showKg(kg)}</span>
            {previous && (
              <span className="subtle">
                {Math.abs(kg - previous.kg) < 0.005
                  ? `Same as ${formatHuman(previous.date)}`
                  : `${kg > previous.kg ? '+' : '−'}${showKg(Math.abs(kg - previous.kg))} since ${formatHuman(previous.date)}`}
              </span>
            )}
          </button>
          <button className="icon-btn edit" aria-label="Edit weight" onClick={open}>✎</button>
        </div>
      ) : (
        <>
          {previous && <div className="subtle">Last weigh-in: {showKg(previous.kg)} on {formatHuman(previous.date)}</div>}
          <button className="btn secondary full" style={{ marginTop: previous ? 8 : 0 }} onClick={open}>+ Log weight</button>
        </>
      )}
    </div>
  )
}
