import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

/** Who is using Quest: switch person, add one, and back up or restore a profile as a file. */
export default function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { index, data, switchProfile, removeProfile, exportProfile, importProfile } = useStore()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pick = (id: string) => {
    switchProfile(id)
    onClose()
  }

  const remove = (id: string, name: string) => {
    if (window.confirm(`Remove ${name} and all of their logs from this phone? Export first if you want a copy.`)) removeProfile(id)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      importProfile(await file.text())
      onClose()
    } catch {
      setError("That file isn't a Quest profile.")
    }
  }

  return (
    <div className="move-backdrop" onClick={onClose}>
      <div className="card move-sheet profile-sheet" role="dialog" aria-modal="true" aria-label="Profiles" onClick={(e) => e.stopPropagation()}>
        <h2>Who's training?</h2>
        <div className="profile-list">
          {index.profiles.map((p) => {
            const on = p.id === index.active
            return (
              <div key={p.id} className={`profile-row${on ? ' on' : ''}`}>
                <button className="profile-pick" aria-pressed={on} onClick={() => pick(p.id)}>
                  {on ? '▶ ' : ''}
                  {p.name}
                </button>
                {!on && (
                  <button className="profile-remove" aria-label={`Remove ${p.name}`} onClick={() => remove(p.id, p.name)}>
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button
          className="btn full"
          onClick={() => {
            onClose()
            navigate('/welcome')
          }}
        >
          + Add person
        </button>
        <div className="profile-backup">
          <button className="btn secondary small" onClick={exportProfile}>
            Export {data.profile?.name ?? 'profile'}
          </button>
          <button className="btn secondary small" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        {error && <p className="subtle" role="alert">{error}</p>}
        <p className="subtle">Everything stays on this phone. Export saves a backup file you can import on another phone.</p>
      </div>
    </div>
  )
}
