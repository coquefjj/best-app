import { useNavigate } from 'react-router-dom'
import HouseArt, { HOUSE_H, HOUSE_W, ROOMS } from '../components/HouseArt'
import { todayISO, formatHuman } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { PLAN_LENGTH_DAYS } from '../data/plan'

type RoomId = keyof typeof ROOMS

const DOORS: { id: RoomId; name: string; what: string; to: string }[] = [
  { id: 'gym', name: 'Gym', what: 'Workouts', to: '/workout' },
  { id: 'kitchen', name: 'Kitchen', what: 'Food', to: '/food' },
  { id: 'bedroom', name: 'Bedroom', what: 'Sleep, weight & habits', to: '/habits' },
  { id: 'studio', name: 'Studio', what: 'Progress', to: '/progress' },
  { id: 'entrance', name: 'Entrance', what: "Today's plan", to: '/today' },
]

const pct = (v: number, of: number) => `${(v / of) * 100}%`

export default function Home() {
  const navigate = useNavigate()
  const iso = todayISO()
  const info = getDayInfo(iso)

  return (
    <div className="page home">
      <div className="home-sign">
        <div className="home-title">BEST HOUSE</div>
        <div className="subtle">
          {formatHuman(iso)} · {info.inPlan ? `Day ${info.dayNum} of ${PLAN_LENGTH_DAYS}` : 'Outside the plan'}
        </div>
      </div>

      <div className="house" style={{ aspectRatio: `${HOUSE_W} / ${HOUSE_H}` }}>
        <HouseArt />
        {DOORS.map((d) => {
          const r = ROOMS[d.id]
          return (
            <button
              key={d.id}
              className={`room-hit room-${d.id}`}
              style={{ left: pct(r.x, HOUSE_W), top: pct(r.y, HOUSE_H), width: pct(r.w, HOUSE_W), height: pct(r.h, HOUSE_H) }}
              onClick={() => navigate(d.to)}
              aria-label={`${d.name}: ${d.what}`}
            >
              <span className="room-plate">{d.name}</span>
            </button>
          )
        })}
      </div>

      <div className="card room-list">
        {DOORS.map((d) => (
          <button key={d.id} className="room-row" onClick={() => navigate(d.to)}>
            <span className="room-row-name">{d.name}</span>
            <span className="subtle">{d.what}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
