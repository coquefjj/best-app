import { useNavigate } from 'react-router-dom'
import { todayISO, formatHuman } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { PLAN_LENGTH_DAYS } from '../data/plan'
import { HOUSE_IMG, IMG_H, IMG_W, ROOMS, type RoomId } from '../components/rooms'

const pct = (v: number, of: number) => `${(v / of) * 100}%`

export default function Home() {
  const navigate = useNavigate()
  const iso = todayISO()
  const info = getDayInfo(iso)

  return (
    <div className="home">
      <div className="house" style={{ aspectRatio: `${IMG_W} / ${IMG_H}` }}>
        <img className="house-img" src={HOUSE_IMG} alt="" draggable={false} />
        <div className="home-sign">
          <div className="home-title">QUEST</div>
          <div className="home-sub">
            {formatHuman(iso)} · {info.inPlan ? `Day ${info.dayNum} of ${PLAN_LENGTH_DAYS}` : 'Outside the plan'}
          </div>
        </div>
        {(Object.keys(ROOMS) as RoomId[]).map((id) => {
          const r = ROOMS[id]
          return (
          <button
            key={id}
            className={`room-hit room-${id}`}
            style={{ left: pct(r.x, IMG_W), top: pct(r.y, IMG_H), width: pct(r.w, IMG_W), height: pct(r.h, IMG_H) }}
            onClick={() => navigate(r.to)}
            aria-label={`${r.name}: ${r.what}`}
          >
            <span className="room-plate">{r.name}</span>
          </button>
          )
        })}
      </div>
    </div>
  )
}
