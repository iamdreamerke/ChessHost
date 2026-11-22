import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { initials } from '../lib/utils'
import Icon from './Icon'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function titleFor(p: string, first: string) {
  if (/\/standings$/.test(p)) return 'Standings'
  if (/\/tv$/.test(p)) return 'TV display'
  if (/^\/tournaments\/.+/.test(p)) return 'Control room'
  if (p.startsWith('/players')) return 'Players'
  if (p.startsWith('/billing')) return 'Billing'
  if (p.startsWith('/settings')) return 'Settings'
  return first ? `${greeting()}, ${first}` : greeting()
}

const link = ({ isActive }: { isActive: boolean }) => 'nav' + (isActive ? ' active' : '')

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => { setOpen(false); setMenu(false); window.scrollTo(0, 0) }, [pathname])

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Organiser'
  const first = name.split(' ')[0]
  const pro = profile?.plan === 'pro'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="app">
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand"><span className="brand-mark"><Icon name="pawn" size={14} /></span>ChessHost</div>

        <div className="org">
          <span className="org-av" />
          <div><b>{name}</b><small>{pro ? 'Pro plan' : 'Free plan'}</small></div>
        </div>

        <div className="nav-label">Workspace</div>
        <NavLink to="/tournaments" className={link}><span className="ico"><Icon name="trophy" /></span>Tournaments</NavLink>
        <NavLink to="/players" className={link}><span className="ico"><Icon name="users" /></span>Players</NavLink>
        <div className="nav-label" style={{ marginTop: 14 }}>Account</div>
        <NavLink to="/billing" className={link}><span className="ico"><Icon name="card" /></span>Billing</NavLink>
        <NavLink to="/settings" className={link}><span className="ico"><Icon name="sliders" /></span>Settings</NavLink>

        <div className="side-bottom">
          {!pro && (
            <div className="plan-card">
              <strong>Free plan</strong>
              <p>One event per month, up to 12 players.</p>
              <Link to="/billing" className="btn btn-outline btn-sm" style={{ width: '100%' }}>See Pro</Link>
            </div>
          )}
          {menu && (
            <div className="user-menu">
              <Link to="/settings">Account settings</Link>
              <button onClick={async () => { await signOut(); nav('/login') }}>Sign out</button>
            </div>
          )}
          <button className="user" onClick={() => setMenu((m) => !m)}>
            <div className="avatar">{initials(name)}</div>
            <div><strong>{name}</strong><small>{user?.email}</small></div>
            <span className="chev"><Icon name="chevrons" size={14} /></span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="icon-btn mobile-menu" onClick={() => setOpen((o) => !o)} aria-label="Menu"><Icon name="menu" /></button>
            <span className="crumb">{titleFor(pathname, first)}</span>
          </div>
          <div className="top-actions"><span className="date-pill"><Icon name="calendar" size={13} />{today}</span></div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  )
}
