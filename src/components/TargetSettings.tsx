import { useState } from 'react'
import { useStore } from '../lib/store'
import { defaultTargets, getTargets, type Targets } from '../lib/targets'

export interface TargetRow {
  label: string
  unit: string
  /** Field for the target; shown in the "Target" column. */
  target?: keyof Targets
  /** Field for the minimum; shown in the "Minimum" column. */
  min?: keyof Targets
  step?: number
}

/** A target set per calorie day, shown as Easy, Moderate and Hard columns. */
export interface DayTargetRow {
  label: string
  unit: string
  keys: [keyof Targets, keyof Targets, keyof Targets]
  step?: number
}

/**
 * Collapsible "Targets" card on Nutrition and Recovery. Hitting a target colors the day
 * green on the Home calendar; hitting only the minimum colors it yellow.
 */
export default function TargetSettings({ byDay = [], rows, note }: { byDay?: DayTargetRow[]; rows: TargetRow[]; note: string }) {
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

  const keys = [...byDay.flatMap((r) => r.keys), ...rows.flatMap((r) => [r.target, r.min])].filter((k): k is keyof Targets => k != null)
  const changed = keys.some((k) => data.targets?.[k] != null && data.targets[k] !== defaults[k])
  const reset = () => {
    setResets((n) => n + 1)
    setData((prev) => {
      const next = { ...prev.targets }
      for (const k of keys) delete next[k]
      return { ...prev, targets: next }
    })
  }

  const follows = (key: keyof Targets) => key.endsWith('Moderate') && data.targets?.[key] == null && data.profile?.baseTargets?.[key] == null

  const input = (key: keyof Targets, step = 1, label: string) => (
    <input
      // An unset moderate field follows easy and hard, so it re-mounts to show the new value.
      key={`${key}-${resets}-${follows(key) ? t[key] : ''}`}
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
          {byDay.length > 0 && (
            <div className="targets-grid by-day">
              <span />
              <span className="targets-head">Easy</span>
              <span className="targets-head">Moderate</span>
              <span className="targets-head">Hard</span>
              {byDay.map((r) => (
                <div className="targets-row" key={r.label}>
                  <label>{r.label}{r.unit ? <span className="subtle"> ({r.unit})</span> : null}</label>
                  {r.keys.map((k, i) => (
                    <span className="targets-cell" key={k}>{input(k, r.step, `${r.label}, ${['easy', 'moderate', 'hard'][i]} day`)}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="targets-grid">
            <span />
            <span className="targets-head"><i className="swatch" style={{ background: 'var(--hp-green)' }} /> Target</span>
            <span className="targets-head"><i className="swatch" style={{ background: 'var(--hp-yellow)' }} /> Minimum</span>
            {rows.map((r) => (
              <div className="targets-row" key={r.label}>
                <label>{r.label}{r.unit ? <span className="subtle"> ({r.unit})</span> : null}</label>
                <span className="targets-cell">{r.target ? input(r.target, r.step, `${r.label} target`) : null}</span>
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
