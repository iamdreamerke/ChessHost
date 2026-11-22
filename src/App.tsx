import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './hooks/useAuth'
import { isConfigured } from './lib/supabase'
import Billing from './pages/Billing'
import Control from './pages/Control'
import Join from './pages/Join'
import Live from './pages/Live'
import Login from './pages/Login'
import Players from './pages/Players'
import PublicTv from './pages/PublicTv'
import Settings from './pages/Settings'
import Standings from './pages/Standings'
import Tournaments from './pages/Tournaments'
import TvPage from './pages/TvPage'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="spinner">Loading…</div>
  return session ? children : <Navigate to="/login" replace />
}

function Setup() {
  return (
    <div className="auth-wrap">
      <div className="auth-card setup">
        <div className="brand"><span className="brand-mark">♟</span>ChessHost<span style={{ color: 'var(--green)' }}>.</span></div>
        <h1>Connect Supabase</h1>
        <p className="sub">Add your project keys, then restart the dev server.</p>
        <ol style={{ lineHeight: 1.9, fontSize: 13 }}>
          <li>Copy <code>.env.example</code> to <code>.env</code></li>
          <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code></li>
          <li>Run <code>supabase/schema.sql</code> in the Supabase SQL editor</li>
          <li>Restart <code>npm run dev</code></li>
        </ol>
      </div>
    </div>
  )
}

export default function App() {
  if (!isConfigured) return <Setup />
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/join/:slug" element={<Join />} />
      <Route path="/tv/:slug" element={<PublicTv />} />
      <Route path="/live/:slug" element={<Live />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Navigate to="/tournaments" replace />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<Control />} />
        <Route path="/tournaments/:id/standings" element={<Standings />} />
        <Route path="/tournaments/:id/tv" element={<TvPage />} />
        <Route path="/players" element={<Players />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
