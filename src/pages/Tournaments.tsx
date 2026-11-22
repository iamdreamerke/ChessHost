import Icon from '../components/Icon'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { startTournament } from '../lib/actions'
import CreateTournamentModal from '../components/modals/CreateTournamentModal'
import InviteModal from '../components/modals/InviteModal'
import PlayersModal from '../components/modals/PlayersModal'
import CertificatesModal from '../components/modals/CertificatesModal'
import {
  FORMAT_LABEL, avatarStyle, clockLabel, fmtDateMed, fmtDateShort, friendlyError, initials, playTimeLabel, roundsFor,
} from '../lib/utils'
import type { Player, Tournament } from '../lib/types'

export default function Tournaments() {
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const [ts, setTs] = useState<Tournament[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [gamesPlayed, setGamesPlayed] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [playersFor, setPlayersFor] = useState<Tournament | null>(null)
  const [inviteFor, setInviteFor] = useState<Tournament | null>(null)
  const [certFor, setCertFor] = useState<Tournament | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('tournaments').select('*').eq('owner_id', user.id)
      .order('event_date', { ascending: false }).order('created_at', { ascending: false })
    const list = (data ?? []) as Tournament[]
    setTs(list)
    const ids = list.map((t) => t.id)
    if (ids.length) {
      const [p, g] = await Promise.all([
        supabase.from('players').select('*').in('tournament_id', ids).order('created_at').order('name'),
        supabase.from('games').select('tournament_id').in('tournament_id', ids).not('result', 'is', null),
      ])
      setPlayers((p.data ?? []) as Player[])
      const counts: Record<string, number> = {}
      ;(g.data ?? []).forEach((r: { tournament_id: string }) => { counts[r.tournament_id] = (counts[r.tournament_id] ?? 0) + 1 })
      setGamesPlayed(counts)
    } else { setPlayers([]); setGamesPlayed({}) }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const byT = useMemo(() => {
    const m = new Map<string, Player[]>()
    players.forEach((p) => m.set(p.tournament_id, [...(m.get(p.tournament_id) ?? []), p]))
    return m
  }, [players])

  const active = ts.filter((t) => t.status !== 'finished')
  const past = ts.filter((t) => t.status === 'finished')

  const stats = useMemo(() => {
    const hosted = new Set(players.map((p) => p.name.toLowerCase())).size
    const minutes = ts.reduce((s, t) => s + (gamesPlayed[t.id] ?? 0) * (t.clock_minutes ?? 10) * 2, 0)
    const certs = past.reduce((s, t) => s + (byT.get(t.id)?.length ?? 0), 0)
    return { hosted, hours: (minutes / 60).toFixed(1), certs }
  }, [players, ts, gamesPlayed, past, byT])

  const usedThisMonth = useMemo(() => {
    const now = new Date()
    return ts.some((t) => { const d = new Date(t.created_at); return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth() })
  }, [ts])
  const nextUnlock = useMemo(() => {
    const n = new Date()
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 1)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
  }, [])

  async function start(t: Tournament) {
    setMsg('')
    try {
      await startTournament(t, byT.get(t.id) ?? [])
      nav(`/tournaments/${t.id}`)
    } catch (e) { setMsg(friendlyError(e)) }
  }

  async function remove(t: Tournament) {
    if (!confirm(`Delete “${t.name}”? This removes its players and results.`)) return
    await supabase.from('tournaments').delete().eq('id', t.id)
    load()
  }

  if (loading) return <div className="spinner">Loading…</div>

  return (
    <>
      <div className="page-head hero">
        <div><h1>Tournaments</h1><p className="sub">Create, run and look back on your chess events.</p></div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Icon name="plus" /> New tournament</button>
      </div>

      {msg && <div className="notice">{msg}</div>}

      {profile?.plan === 'free' && usedThisMonth && (
        <div className="banner">
          <div className="banner-left">
            <div><strong>Your free event has been used this month</strong><p>Your next free event unlocks {nextUnlock}. Upgrade to host without limits.</p></div>
          </div>
          <Link to="/billing" className="btn btn-outline">Upgrade</Link>
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="stat-top">Total tournaments</div><div className="stat-num">{ts.length}</div><div className="stat-note">Across your community</div></div>
        <div className="stat"><div className="stat-top">Players hosted</div><div className="stat-num">{stats.hosted}</div><div className="stat-note">Unique participants</div></div>
        <div className="stat"><div className="stat-top">Hours of chess</div><div className="stat-num">{stats.hours}</div><div className="stat-note">Estimated from game clocks</div></div>
        <div className="stat"><div className="stat-top">Certificates</div><div className="stat-num">{stats.certs}</div><div className="stat-note">Ready to celebrate</div></div>
      </div>

      <div className="section-head">
        <h2>Active events <span className="count">{active.length}</span></h2>
        <span>Manage your upcoming tournaments</span>
      </div>

      {active.length === 0 ? (
        <div className="empty">
          <div className="empty-mark"><Icon name="trophy" size={17} /></div>
          <h3>No active tournaments</h3>
          <p>Create your first tournament and invite players with a QR code in under a minute.</p>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Icon name="plus" /> New tournament</button>
        </div>
      ) : (
        <div className="event-grid">
          {active.map((t) => {
            const pl = byT.get(t.id) ?? []
            return (
              <article className="event-card" key={t.id}>
                <div className="event-top">
                  <div><div className="event-title">{t.name}</div><div className="event-date">{FORMAT_LABEL[t.format]} · {fmtDateShort(t.event_date)}</div></div>
                  <span className={'status ' + t.status}>{t.status === 'live' ? `Live · Round ${t.current_round}` : 'Draft'}</span>
                </div>
                <div className="event-meta">
                  <div className="meta-item">Players<b>{pl.length}</b></div>
                  <div className="meta-item">Play time<b>{playTimeLabel(t, pl.length)}</b></div>
                  <div className="meta-item">Rounds<b>{t.status === 'draft' ? roundsFor(t, pl.length) : t.total_rounds}</b></div>
                  <div className="meta-item">Clock<b>{clockLabel(t)}</b></div>
                </div>
                <div className="player-chips">
                  {pl.slice(0, 4).map((p, i) => <span className="chip-avatar" key={p.id} style={avatarStyle(i)}>{initials(p.name)}</span>)}
                  {pl.length > 4 && <span className="chip-avatar" style={avatarStyle(0)}>+{pl.length - 4}</span>}
                  <span className="more">{pl.length ? `${pl.length} player${pl.length === 1 ? '' : 's'} signed up` : 'No players yet'}</span>
                </div>
                <div className="event-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setPlayersFor(t)}>{t.status === 'draft' ? 'Edit players' : 'View players'}</button>
                  {t.status === 'draft'
                    ? <button className="btn btn-primary btn-sm" onClick={() => start(t)}>Start tournament</button>
                    : <Link className="btn btn-primary btn-sm" to={`/tournaments/${t.id}`}>Open control room</Link>}
                  <button className="btn btn-outline btn-sm" onClick={() => setInviteFor(t)}><Icon name="link" /> Invite</button>
                  <Link className="btn btn-outline btn-sm" to={`/tournaments/${t.id}/tv`}><Icon name="tv" /> TV display</Link>
                  <button className="btn btn-outline btn-sm btn-danger" onClick={() => remove(t)} aria-label={`Delete ${t.name}`}><Icon name="trash" /></button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="section-head"><h2>Past events</h2><span>All your completed tournaments</span></div>
      {past.length === 0 && <p className="sub">Finished tournaments will show up here.</p>}
      {past.map((t) => (
        <div className="past-row" key={t.id}>
          <div className="past-left">
            <div className="past-icon"><Icon name="trophy" /></div>
            <div><strong>{t.name}</strong><small>{FORMAT_LABEL[t.format]} · {fmtDateMed(t.event_date)} · {byT.get(t.id)?.length ?? 0} players</small></div>
          </div>
          <div className="past-actions">
            <Link className="btn btn-outline btn-sm" to={`/tournaments/${t.id}/standings`}>Standings</Link>
            <button className="btn btn-soft btn-sm" onClick={() => setCertFor(t)}><Icon name="file" /> Certificates</button>
            <button className="btn btn-outline btn-sm btn-danger" onClick={() => remove(t)} aria-label={`Delete ${t.name}`}><Icon name="trash" /></button>
          </div>
        </div>
      ))}

      <CreateTournamentModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(t) => { setCreateOpen(false); load(); setPlayersFor(t) }} />
      <PlayersModal tournament={playersFor} onClose={() => setPlayersFor(null)} onChanged={load} />
      <InviteModal tournament={inviteFor} onClose={() => setInviteFor(null)} onChanged={load} />
      <CertificatesModal tournament={certFor} onClose={() => setCertFor(null)} />
    </>
  )
}
