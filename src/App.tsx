import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import Today from './pages/Today'
import Workout from './pages/Workout'
import Food from './pages/Food'
import Habits from './pages/Habits'
import Progress from './pages/Progress'

function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">🏠</span>
        Today
      </NavLink>
      <NavLink to="/workout" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">💪</span>
        Workout
      </NavLink>
      <NavLink to="/food" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">🍽️</span>
        Food
      </NavLink>
      <NavLink to="/habits" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">✅</span>
        Habits
      </NavLink>
      <NavLink to="/progress" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">📈</span>
        Progress
      </NavLink>
    </nav>
  )
}

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Today />} />
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
