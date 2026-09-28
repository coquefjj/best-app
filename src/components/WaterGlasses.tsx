import { useStore } from '../lib/store'

export const GLASS_ML = 200
export const WATER_GOAL_GLASSES = 10

/** Stored as litres in habits.water so older typed-in values still show. */
export function glassesFromLitres(litres: unknown): number {
  return typeof litres === 'number' ? Math.round((litres * 1000) / GLASS_ML) : 0
}

function Glass({ full }: { full: boolean }) {
  // 12x16 pixel glass drawn on a grid so it stays crisp at any size.
  return (
    <svg viewBox="0 0 12 16" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M1 1h10v1h-1v13H2V2H1z" fill="#3a2418" />
      <rect x="3" y="2" width="6" height="12" fill={full ? '#4a9ee0' : '#fbf3e0'} />
      {full && <rect x="3" y="2" width="6" height="2" fill="#8cc8f0" />}
      {full && <rect x="4" y="5" width="1" height="6" fill="#bfe2f8" />}
      {!full && <rect x="4" y="3" width="1" height="4" fill="#e8d4ac" />}
    </svg>
  )
}

export default function WaterGlasses({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const count = glassesFromLitres(data.habits[iso]?.water)
  const shown = Math.max(WATER_GOAL_GLASSES, count + (count >= WATER_GOAL_GLASSES ? 1 : 0))

  const setCount = (n: number) => {
    const next = Math.max(0, n)
    setData((prev) => ({
      ...prev,
      habits: { ...prev.habits, [iso]: { ...prev.habits[iso], water: +((next * GLASS_ML) / 1000).toFixed(1) } },
    }))
  }

  // Tapping an empty glass fills up to it; tapping the last full one empties it.
  const tap = (i: number) => setCount(i + 1 === count ? i : i + 1)

  const litres = ((count * GLASS_ML) / 1000).toFixed(1)
  const reached = count >= WATER_GOAL_GLASSES

  return (
    <div className="water">
      <div className="bar-label">
        <span className="tag">Water</span>
        <span className="subtle">{litres} / 2.0 L{reached ? ' ✓' : ''}</span>
      </div>
      <div className="water-glasses">
        {Array.from({ length: shown }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`water-glass${i < count ? ' full' : ''}`}
            aria-label={`Glass ${i + 1}${i < count ? ', drunk' : ''}`}
            aria-pressed={i < count}
            onClick={() => tap(i)}
          >
            <Glass full={i < count} />
          </button>
        ))}
      </div>
      <div className="subtle">
        {reached ? 'Goal reached for today' : `${WATER_GOAL_GLASSES - count} glass${WATER_GOAL_GLASSES - count === 1 ? '' : 'es'} (200 ml) to go`}
      </div>
    </div>
  )
}
