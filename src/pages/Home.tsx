import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import ProfileSheet from '../components/ProfileSheet'
import { todayISO, formatHuman } from '../lib/date'
import { getDayInfo } from '../lib/session'
import { activePlan } from '../data/templates'
import PlanProgress from '../components/PlanProgress'
import { HOUSE_IMG, IMG_H, IMG_W, ROOMS, type RoomId } from '../components/rooms'

const pct = (v: number, of: number) => `${(v / of) * 100}%`

export default function Home() {
  const navigate = useNavigate()
  const iso = todayISO()
  const { data } = useStore()
  const info = getDayInfo(iso)
  const [profilesOpen, setProfilesOpen] = useState(false)

  return (
    <>
    {profilesOpen && <ProfileSheet onClose={() => setProfilesOpen(false)} />}
    <div className="home">
      <div className="house" style={{ aspectRatio: `${IMG_W} / ${IMG_H}` }}>
        <img className="house-img" src={HOUSE_IMG} alt="" draggable={false} />
        <div className="home-sign">
          <div className="home-title">QUEST</div>
          <div className="home-sub">
            {formatHuman(iso)} · {info.inPlan ? `Day ${info.dayNum} of ${activePlan().lengthDays}` : 'Outside the plan'}
          </div>
          <button className="home-who" aria-haspopup="dialog" onClick={() => setProfilesOpen(true)}>
            {data.profile?.name ?? 'Profile'} ▾
          </button>
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
      <div className="home-more" aria-hidden="true">▼ Plan progress</div>
    </div>
    <PlanProgress />
    </>
  )
}
