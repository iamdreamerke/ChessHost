import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ChessBoard from '../components/ChessBoard'
import InviteModal from '../components/modals/InviteModal'
import PlayersModal from '../components/modals/PlayersModal'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournament'
import { supabase } from '../lib/supabase'
import { advanceRound, startTournament } from '../lib/actions'
import { computeStandings, fmtPoints } from '../lib/standings'
import { FORMAT_LABEL, SPEED_LABEL, boardClock, fmtDateWeekday, friendlyError, initials, liveUrl, resultText } from '../lib/utils'
import type { Result } from '../lib/types'

type Tab = 'pairings' | 'results' | 'standings'
const MEDALS = ['🥇', '🥈', '🥉']
const two = (n: number) => String(n).padStart(2, '0')

export default function Control() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const { tournament: t, players, games, loading, notFound, reload } = useTournament({ id })
  const [tab, setTab] = useState<Tab>('pairings')
  const [sel, setSel] = useState(0)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [playersOpen, setPlayersOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const pname = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players])
  const round = useMemo(
    () => games.filter((g) => g.round === t?.current_round).sort((a, b) => a.board - b.board),
    [games, t?.current_round],
  )
  const rows = useMemo(() => computeStandings(players, games), [players, games])

  if (loading) return <div className="spinner">Loading…</div>
  if (notFound || !t) return <div className="notice">Tournament not found. <Link to="/tournaments">Back to tournaments</Link></div>
  if (t.owner_id !== user?.id) return <div className="notice">This tournament belongs to another organiser.</div>

  const subline = `${FORMAT_LABEL[t.format]} · ${SPEED_LABEL[t.speed]} · ${players.length} players · ${fmtDateWeekday(t.event_date)}`

  /* ---------------- lobby (not started yet) ---------------- */
  if (t.status === 'draft') {
    return (
      <>
        <div className="play-head">
          <div><div className="eyebrow">NOT STARTED</div><h1>{t.name}</h1><p className="sub">{subline}</p></div>
          <div className="play-head-actions"><span className="tag">Draft</span></div>
        </div>
        {msg && <div className="notice">{msg}</div>}
        <div className="empty" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="empty-mark">♟</div>
          <h3>{players.length} player{players.length === 1 ? '' : 's'} registered</h3>
          <p>Add players, share the QR code so people can join themselves, then start when everyone is ready.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setPlayersOpen(true)}>Edit players</button>
            <button className="btn btn-outline" onClick={() => setInviteOpen(true)}>↗ Invite</button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true); setMsg('')
                try { await startTournament(t, players); await reload() } catch (e) { setMsg(friendlyError(e)) }
                setBusy(false)
              }}
            >Start Tournament →</button>
          </div>
        </div>
        <PlayersModal tournament={playersOpen ? t : null} onClose={() => setPlayersOpen(false)} onChanged={reload} />
        <InviteModal tournament={inviteOpen ? t : null} onClose={() => setInviteOpen(false)} onChanged={reload} />
      </>
    )
  }

  /* ---------------- live / finished ---------------- */
  const idx = Math.min(sel, Math.max(0, round.length - 1))
  const g = round[idx]
  const white = g ? pname.get(g.white_id) ?? '—' : '—'
  const black = g ? (g.black_id ? pname.get(g.black_id) ?? '—' : 'Bye') : '—'
  const done = round.filter((x) => x.result).length
  const allDone = round.length > 0 && done === round.length
  const lastRound = t.current_round >= t.total_rounds
  const finished = t.status === 'finished'

  async function record(r: Result | null) {
    if (!g) return
    setBusy(true)
    const { error } = await supabase.from('games').update({ result: r }).eq('id', g.id)
    setBusy(false)
    if (error) return setMsg(friendlyError(error))
    const text = r === '1-0' ? `${white} wins` : r === '0-1' ? `${black} wins` : r ? 'Draw' : ''
    setMsg(r ? `Result recorded: ${text}.` : 'Result cleared.')
    reload()
  }

  async function next() {
    setBusy(true); setMsg('')
    try {
      const { finished: f } = await advanceRound(t!, players, games)
      await reload()
      setSel(0); setTab('pairings')
      if (f) nav(`/tournaments/${t!.id}/standings`)
    } catch (e) { setMsg(friendlyError(e)) }
    setBusy(false)
  }

  async function copyLive() {
    try { await navigator.clipboard.writeText(liveUrl(t!.slug)) } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  const pick = (i: number) => { setSel(i); setMsg('') }
  const go = (d: number) => round.length && pick((idx + d + round.length) % round.length)

  return (
    <div className="control">
      <div className="play-head">
        <div>
          <div className="eyebrow">{finished ? 'FINISHED' : `LIVE TOURNAMENT · ROUND ${t.current_round} OF ${t.total_rounds}`}</div>
          <h1>{t.name}</h1>
          <p className="sub">{subline}</p>
        </div>
        <div className="play-head-actions">
          <span className="tag green">{finished ? '✓ FINISHED' : '● LIVE'}</span>
          <button className="btn btn-outline btn-sm" onClick={copyLive}>{copied ? 'Copied ✓' : '⧉ Spectator link'}</button>
          <Link className="btn btn-outline btn-sm" to={`/tournaments/${t.id}/tv`}>▣ TV Display</Link>
        </div>
      </div>

      <div className="director-layout">
        <div className="board-column">
          <div className="board-player top-player">
            <span className="board-avatar">{initials(black)}</span>
            <div><b>{black}</b><small>Black · Board {two(g?.board ?? 1)}</small></div>
            <strong className="clock">{boardClock(t)}</strong>
          </div>
          <ChessBoard />
          <div className="board-player bottom-player">
            <span className="board-avatar green-avatar">{initials(white)}</span>
            <div><b>{white}</b><small>White · Board {two(g?.board ?? 1)}</small></div>
            <strong className="clock active-clock">{boardClock(t)}</strong>
          </div>
          <div className="board-toolbar">
            <button className="tool-btn" title="Previous board" onClick={() => go(-1)}>‹</button>
            <span>BOARD {two(g?.board ?? 1)} OF {two(round.length)}</span>
            <button className="tool-btn" title="Next board" onClick={() => go(1)}>›</button>
            <Link className="tool-btn" to={`/tournaments/${t.id}/standings`} title="Standings">♜</Link>
          </div>
        </div>

        <aside className="game-panel">
          <div className="panel-tabs">
            {(['pairings', 'results', 'standings'] as Tab[]).map((k) => (
              <button key={k} className={'panel-tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{k[0].toUpperCase() + k.slice(1)}</button>
            ))}
          </div>

          {tab === 'pairings' && (
            <div className="director-tab">
              <div className="panel-title"><b>Round {t.current_round} · Pairings</b><span className="tag green">{done} / {round.length} done</span></div>
              <div className="pairing-list">
                {round.map((x, i) => (
                  <button key={x.id} className={'pairing' + (i === idx ? ' selected' : '')} onClick={() => pick(i)}>
                    <span className="pair-no">{two(x.board)}</span>
                    <span className="pair-names"><b>{pname.get(x.white_id)}</b><small>{x.black_id ? `vs ${pname.get(x.black_id)}` : 'Bye · automatic point'}</small></span>
                    {x.result
                      ? <span className="pair-status done">{x.black_id ? `✓ ${resultText(x.result)}` : '✓ Bye'}</span>
                      : <span className="pair-status live-dot">● Playing</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'results' && (
            <div className="director-tab">
              <div className="panel-title"><b>Enter Board {two(g?.board ?? 1)} result</b><span className="tag amber">Manual</span></div>
              {g && !g.black_id ? (
                <p className="panel-hint">{white} has a bye this round and receives a point automatically.</p>
              ) : (
                <>
                  <p className="panel-hint">Select the result reported by the players or arbiter.</p>
                  <div className="result-options">
                    <button className={'result-option' + (g?.result === '1-0' ? ' picked' : '')} disabled={busy || finished} onClick={() => record('1-0')}><span>1 — 0</span><b>White wins</b><small>{white}</small></button>
                    <button className={'result-option' + (g?.result === '1/2-1/2' ? ' picked' : '')} disabled={busy || finished || t.format === 'knockout'} onClick={() => record('1/2-1/2')}><span>½ — ½</span><b>Draw</b><small>{t.format === 'knockout' ? 'Not allowed in knockout' : 'Both players'}</small></button>
                    <button className={'result-option' + (g?.result === '0-1' ? ' picked' : '')} disabled={busy || finished} onClick={() => record('0-1')}><span>0 — 1</span><b>Black wins</b><small>{black}</small></button>
                  </div>
                  {g?.result && !finished && <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => record(null)}>Clear result</button>}
                </>
              )}
              <div className="result-message">{msg || (g?.result ? `Current result: ${resultText(g.result)}` : 'No result submitted yet.')}</div>
            </div>
          )}

          {tab === 'standings' && (
            <div className="director-tab">
              <div className="panel-title"><b>Top standings</b><span className="tag green">Round {t.current_round}</span></div>
              {rows.slice(0, 5).map((r) => (
                <div className="mini-standing" key={r.player.id}><b>{MEDALS[r.rank - 1] ?? `${r.rank} ·`} {r.player.name}</b><strong>{fmtPoints(r.points)}</strong></div>
              ))}
              <Link className="btn btn-outline btn-sm full-btn" style={{ marginTop: 12 }} to={`/tournaments/${t.id}/standings`}>Full standings →</Link>
            </div>
          )}

          <div className="panel-bottom">
            <div className="round-progress">
              <div><b>Round progress</b><strong>{done} of {round.length} results</strong></div>
              <div className="progress-track"><span style={{ width: `${round.length ? (done / round.length) * 100 : 0}%` }} /></div>
            </div>
            <Link className="btn btn-primary full-btn" to={`/tournaments/${t.id}/tv`}>▣ Open tournament display</Link>
            <div className="panel-actions">
              {finished
                ? <Link className="btn btn-outline btn-sm" to={`/tournaments/${t.id}/standings`}>Final standings</Link>
                : <button className="btn btn-outline btn-sm" disabled={!allDone || busy} title={allDone ? '' : 'Enter all results first'} onClick={next}>{lastRound ? 'Finish tournament' : 'Next round →'}</button>}
              <Link className="btn btn-outline btn-sm" to="/tournaments">Exit</Link>
            </div>
            {!allDone && !finished && <p className="panel-hint" style={{ marginTop: 10 }}>{lastRound ? 'Finish' : 'Next round'} unlocks after all results are entered.</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}
