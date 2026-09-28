import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Today from './pages/Today'
import Workout from './pages/Workout'
import Food from './pages/Food'
import Habits from './pages/Habits'
import Progress from './pages/Progress'
import Sprite from './components/Sprite'
import type { SpriteName } from './components/sprites'

const NAV_ITEMS: { to: string; label: string; sprite: SpriteName; end?: boolean }[] = [
  { to: '/', label: 'Home', sprite: 'house', end: true },
  { to: '/workout', label: 'Gym', sprite: 'sword' },
  { to: '/food', label: 'Kitchen', sprite: 'meat' },
  { to: '/habits', label: 'Bathroom', sprite: 'potion' },
  { to: '/progress', label: 'Studio', sprite: 'trophy' },
]

function Nav() {
  return (
    <nav className="nav">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Sprite name={item.sprite} scale={2} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/today" element={<Today />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/workout/:date" element={<Workout />} />
          <Route path="/food" element={<Food />} />
          <Route path="/food/:date" element={<Food />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/habits/:date" element={<Habits />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </div>
      <Nav />
    </HashRouter>
  )
}

export default App
