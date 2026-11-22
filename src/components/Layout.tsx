import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { initials } from '../lib/utils'

function crumbFor(p: string) {
  if (/\/standings$/.test(p)) return 'Standings'
  if (/\/tv$/.test(p)) return 'TV Display'
  if (/^\/tournaments\/.+/.test(p)) return 'Tournament Control Room'
  if (p.startsWith('/players')) return 'My Players'
  if (p.startsWith('/billing')) return 'Billing'
  if (p.startsWith('/settings')) return 'Settings'
  return 'My Tournaments'
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
  const pro = profile?.plan === 'pro'

  return (
    <div className="app">
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand"><span className="brand-mark">♟</span>ChessHost<span style={{ color: 'var(--green)' }}>.</span></div>
        <div className="nav-label">WORKSPACE</div>
        <NavLink to="/tournaments" className={link}><span className="ico">▦</span>My Tournaments</NavLink>
        <NavLink to="/players" className={link}><span className="ico">♙</span>My Players</NavLink>
        <div className="nav-label">ACCOUNT</div>
        <NavLink to="/billing" className={link}><span className="ico">▤</span>Billing</NavLink>
        <NavLink to="/settings" className={link}><span className="ico">⚙</span>Settings</NavLink>

        <div className="side-bottom">
          <div className="plan-card">
            {pro ? (
              <><strong>Pro plan active</strong><p>Unlimited events · Unlimited players</p></>
            ) : (
              <>
                <strong>You're on the Free plan</strong>
                <p>One event per month · Up to 12 players</p>
                <Link to="/billing" className="btn btn-primary btn-sm" style={{ width: '100%' }}>Explore Pro ↗</Link>
              </>
            )}
          </div>
          {menu && (
            <div className="user-menu">
              <Link to="/settings">Account settings</Link>
              <button onClick={async () => { await signOut(); nav('/login') }}>Sign out</button>
            </div>
          )}
          <button className="user" onClick={() => setMenu((m) => !m)}>
            <div className="avatar">{initials(name)}</div>
            <div><strong>{name}</strong><small>{user?.email}</small></div>
            <span className="chev">⌄</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="icon-btn mobile-menu" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>
            <span className="crumb">Workspace&nbsp; / &nbsp;<b>{crumbFor(pathname)}</b></span>
          </div>
          <div className="top-actions"><div className="avatar" style={{ width: 31, height: 31 }}>{initials(name)}</div></div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  )
}
