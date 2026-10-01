import { useStore } from '../lib/store'
import { getTargets } from '../lib/targets'

export const GLASS_ML = 200

/** Stored as litres in habits.water so older typed-in values still show. */
export function glassesFromLitres(litres: unknown): number {
  return typeof litres === 'number' ? Math.round((litres * 1000) / GLASS_ML) : 0
}

export default function WaterGlasses({ iso }: { iso: string }) {
  const { data, setData } = useStore()
  const goalL = getTargets(data).waterL
  // One glass per 200 ml of the water target (10 glasses for 2 L).
  const goalGlasses = Math.max(1, Math.round((goalL * 1000) / GLASS_ML))
  const count = glassesFromLitres(data.habits[iso]?.water)

  const setCount = (n: number) => {
    const next = Math.min(goalGlasses, Math.max(0, n))
    setData((prev) => ({
      ...prev,
      habits: { ...prev.habits, [iso]: { ...prev.habits[iso], water: +((next * GLASS_ML) / 1000).toFixed(1) } },
    }))
  }

  // Tapping an empty glass fills up to it; tapping the last full one empties it.
  const tap = (i: number) => setCount(i + 1 === count ? i : i + 1)

  const litres = ((count * GLASS_ML) / 1000).toFixed(1)
  const reached = count >= goalGlasses

  return (
    <div className="water">
      <div className="bar-label">
        <span className="tag">Water</span>
        <span className="subtle">{litres} / {goalL.toFixed(1)} L{reached ? ' ✓' : ''}</span>
      </div>
      <div className="water-glasses">
        {Array.from({ length: goalGlasses }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`water-glass${i < count ? ' full' : ''}`}
            aria-label={`Glass ${i + 1}${i < count ? ', drunk' : ''}`}
            aria-pressed={i < count}
            onClick={() => tap(i)}
          >
            <img src={`${import.meta.env.BASE_URL}img/water-glass.png`} alt="" draggable={false} />
          </button>
        ))}
      </div>
      <div className="subtle">
        {reached ? 'Goal reached for today' : `${goalGlasses - count} glass${goalGlasses - count === 1 ? '' : 'es'} (200 ml) to go`}
      </div>
    </div>
  )
}
