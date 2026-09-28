import type { ReactNode } from 'react'
import { HOUSE_IMG, IMG_H, IMG_W, ROOMS, type RoomId } from './rooms'

/** Page header with a framed crop of the room from the house artwork. */
export default function RoomHeader({
  room,
  title,
  subtitle,
  children,
}: {
  room: RoomId
  title: ReactNode
  subtitle?: ReactNode
  /** Extra controls shown on the wall above the header, such as day navigation. */
  children?: ReactNode
}) {
  const r = ROOMS[room]
  const thumb = {
    backgroundImage: `url(${HOUSE_IMG})`,
    backgroundSize: `${(IMG_W / r.w) * 100}% auto`,
    backgroundPosition: `${(r.x / (IMG_W - r.w)) * 100}% ${(r.y / (IMG_H - r.h)) * 100}%`,
    aspectRatio: `${r.w} / ${r.h}`,
  }
  return (
    <div className="room-wall">
      {children}
      <div className="room-header">
        <div className="room-thumb" style={thumb} aria-hidden="true" />
        <div className="room-header-text">
          <div className="room-header-kicker">{r.name}</div>
          <h1>{title}</h1>
          {subtitle && <div className="subtle">{subtitle}</div>}
        </div>
      </div>
    </div>
  )
}
