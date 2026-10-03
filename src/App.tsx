import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Today from './pages/Today'
import Workout from './pages/Workout'
import Food from './pages/Food'
import Habits from './pages/Habits'
import Recovery from './pages/Recovery'
import Sprite from './components/Sprite'
import type { SpriteName } from './components/sprites'

const NAV_ITEMS: { to: string; label: string; sprite: SpriteName; end?: boolean }[] = [
  { to: '/', label: 'Home', sprite: 'house', end: true },
  { to: '/workout', label: 'Workout', sprite: 'dumbbell' },
  { to: '/food', label: 'Nutrition', sprite: 'pot' },
  { to: '/recovery', label: 'Recovery', sprite: 'bed' },
  { to: '/habits', label: 'Habits', sprite: 'easel' },
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

function Shell() {
  const { hasProfile } = useStore()
  const { pathname } = useLocation()
  // No profile yet (a new phone): onboarding is the whole app until it's done.
  if (!hasProfile) {
    return (
      <div className="app-shell">
        <Onboarding />
      </div>
    )
  }
  return (
    <>
      <div className="app-shell">
        <Routes>
          <Route path="/welcome" element={<Onboarding />} />
          <Route path="/" element={<Home />} />
          <Route path="/today" element={<Today />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/workout/:date" element={<Workout />} />
          <Route path="/food" element={<Food />} />
          <Route path="/food/:date" element={<Food />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/habits/:date" element={<Habits />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/recovery/:date" element={<Recovery />} />
          {/* Strength progress now lives at the bottom of Workout */}
          <Route path="/learning" element={<Navigate to="/workout" replace />} />
          <Route path="/progress" element={<Navigate to="/workout" replace />} />
        </Routes>
      </div>
      {pathname !== '/welcome' && <Nav />}
    </>
  )
}

function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}

export default App
