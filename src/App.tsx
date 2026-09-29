import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Today from './pages/Today'
import Workout from './pages/Workout'
import Food from './pages/Food'
import Habits from './pages/Habits'
import Learning from './pages/Learning'
import Sprite from './components/Sprite'
import type { SpriteName } from './components/sprites'

const NAV_ITEMS: { to: string; label: string; sprite: SpriteName; end?: boolean }[] = [
  { to: '/', label: 'Home', sprite: 'house', end: true },
  { to: '/workout', label: 'Workout', sprite: 'dumbbell' },
  { to: '/food', label: 'Nutrition', sprite: 'pot' },
  { to: '/habits', label: 'Habits', sprite: 'bed' },
  { to: '/learning', label: 'Learning', sprite: 'easel' },
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
          <Route path="/learning" element={<Learning />} />
          <Route path="/progress" element={<Navigate to="/learning" replace />} />
        </Routes>
      </div>
      <Nav />
    </HashRouter>
  )
}

export default App
