import { useState } from 'react'
import { useStore } from '../lib/store'
import { defaultTargets, getTargets, type Targets } from '../lib/targets'

export interface TargetRow {
  label: string
  unit: string
  /** Field for the target; shown in the "Target" column. */
  target: keyof Targets
  /** Field for the minimum; shown in the "Minimum" column. */
  min?: keyof Targets
  step?: number
}

/**
 * Collapsible "Targets" card on Nutrition and Recovery. Hitting a target colors the day
 * green on the Home calendar; hitting only the minimum colors it yellow.
 */
export default function TargetSettings({ rows, note }: { rows: TargetRow[]; note: string }) {
  const { data, setData } = useStore()
  const [open, setOpen] = useState(false)
  // Bumped on reset so the fields re-mount showing the defaults.
  const [resets, setResets] = useState(0)
  const t = getTargets(data)
  const defaults = defaultTargets(data)

  const set = (key: keyof Targets, raw: string) => {
    if (raw === '') return
    const v = Number(raw)
    if (!Number.isFinite(v) || v < 0) return
    setData((prev) => ({ ...prev, targets: { ...prev.targets, [key]: v } }))
  }

  const keys = rows.flatMap((r) => (r.min ? [r.target, r.min] : [r.target]))
  const changed = keys.some((k) => data.targets?.[k] != null && data.targets[k] !== defaults[k])
  const reset = () => {
    setResets((n) => n + 1)
    setData((prev) => {
      const next = { ...prev.targets }
      for (const k of keys) delete next[k]
      return { ...prev, targets: next }
    })
  }

  const input = (key: keyof Targets, step = 1, label: string) => (
    <input
      key={`${key}-${resets}`}
      type="number"
      inputMode="decimal"
      step={step}
      min={0}
      aria-label={label}
      defaultValue={t[key]}
      onChange={(e) => set(key, e.target.value)}
    />
  )

  return (
    <>
      <button
        className={`btn secondary full progress-toggle${open ? ' open' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>Targets</span>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="card targets">
          <div className="targets-grid">
            <span />
            <span className="targets-head"><i className="swatch" style={{ background: 'var(--hp-green)' }} /> Target</span>
            <span className="targets-head"><i className="swatch" style={{ background: 'var(--hp-yellow)' }} /> Minimum</span>
            {rows.map((r) => (
              <div className="targets-row" key={r.target}>
                <label>{r.label}{r.unit ? <span className="subtle"> ({r.unit})</span> : null}</label>
                <span className="targets-cell">{input(r.target, r.step, `${r.label} target`)}</span>
                <span className="targets-cell">{r.min ? input(r.min, r.step, `${r.label} minimum`) : null}</span>
              </div>
            ))}
          </div>
          <p className="subtle targets-note">{note}</p>
          {changed && (
            <button className="btn secondary full" onClick={reset}>Reset to defaults</button>
          )}
        </div>
      )}
    </>
  )
}
