import Icon from '../components/Icon'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTournament } from '../hooks/useTournament'
import { computeStandings, fmtPoints } from '../lib/standings'
import { FORMAT_LABEL, SPEED_LABEL, clockLabel, fmtDateShort, resultText } from '../lib/utils'

const two = (n: number) => String(n).padStart(2, '0')
const read = (k: string) => { try { return localStorage.getItem(k) ?? '' } catch { return '' } }
const write = (k: string, v: string) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k) } catch { /* ignore */ } }

/** Public, read-only spectator page: live fixtures + standings. No login, no write controls. */
export default function Live() {
  const { slug } = useParams()
  const { tournament: t, players, games, loading, notFound } = useTournament({ slug })
  const [tab, setTab] = useState<'fixtures' | 'standings'>('fixtures')
  const [picked, setPicked] = useState<number | null>(null)   // null = follow the current round
  const key = `chesshost:me:${slug}`
  const [me, setMe] = useState(() => read(key))

  const rows = useMemo(() => computeStandings(players, games), [players, games])
  const pname = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players])
  const rounds = useMemo(() => [...new Set(games.map((g) => g.round))].sort((a, b) => a - b), [games])

  if (loading) return <div className="spinner">Loading…</div>
  if (notFound || !t) return <div className="spinner">Tournament not found.</div>

  const viewRound = picked ?? t.current_round
  const boards = games.filter((g) => g.round === viewRound).sort((a, b) => a.board - b.board)
  const done = boards.filter((g) => g.result).length
  const meId = players.some((p) => p.id === me) ? me : ''
  const myRow = rows.find((r) => r.player.id === meId)
  const myGame = games.find((g) => g.round === t.current_round && (g.white_id === meId || g.black_id === meId))

  function myLine() {
    if (!myGame) return t!.status === 'finished' ? 'The tournament has finished.' : 'No game for you this round.'
    const white = myGame.white_id === meId
    const oppId = white ? myGame.black_id : myGame.white_id
    if (!oppId) return `Round ${myGame.round}: you have a bye (1 point).`
    let line = `Round ${myGame.round} · Board ${myGame.board} · You have ${white ? 'White' : 'Black'} vs ${pname.get(oppId)}`
    if (myGame.result) {
      const won = (myGame.result === '1-0' && white) || (myGame.result === '0-1' && !white)
      line += myGame.result === '1/2-1/2' ? ' · Draw' : won ? ' · You won' : ' · You lost'
    }
    return line
  }

  const status = t.status === 'draft' ? 'Not started' : t.status === 'finished' ? 'Finished' : 'Live'

  return (
    <div className="live-page">
    <div className="live-wrap">
      <div className="live-head">
        <div>
          <div className="eyebrow">{FORMAT_LABEL[t.format]} · {SPEED_LABEL[t.speed]} · {clockLabel(t)}</div>
          <h1>{t.name}</h1>
          <p className="sub">{fmtDateShort(t.event_date)}{t.status === 'live' ? ` · Round ${t.current_round} of ${t.total_rounds}` : ''}</p>
        </div>
        <span className={'status ' + t.status}>{status}</span>
      </div>

      {players.length > 0 && !meId && (
        <div className="form-row">
          <label>Who are you? (highlights your game)</label>
          <select className="field" value="" onChange={(e) => { setMe(e.target.value); write(key, e.target.value) }}>
            <option value="">— Select your name —</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {meId && myRow && (
        <div className="me-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>{myRow.player.name}</b>
            <span className="tag green">Rank {myRow.rank} · {fmtPoints(myRow.points)} pts</span>
          </div>
          {t.status !== 'draft' && <p>{myLine()}</p>}
          <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => { setMe(''); write(key, '') }}>Not you?</button>
        </div>
      )}

      {t.status === 'draft' ? (
        <div className="empty">
          <div className="empty-mark"><Icon name="pawn" size={17} /></div>
          <h3>Starting soon</h3>
          <p>{players.length} player{players.length === 1 ? '' : 's'} registered. Fixtures appear here as soon as the host starts the tournament.</p>
          <div className="chip-row" style={{ justifyContent: 'center' }}>
            {players.map((p) => <span className="tag" key={p.id}>{p.name}</span>)}
          </div>
        </div>
      ) : (
        <>
          <div className="live-tabs">
            <button className={tab === 'fixtures' ? 'active' : ''} onClick={() => setTab('fixtures')}>Fixtures</button>
            <button className={tab === 'standings' ? 'active' : ''} onClick={() => setTab('standings')}>Standings</button>
          </div>

          {tab === 'fixtures' && (
            <>
              <div className="round-chips">
                {rounds.map((r) => (
                  <button key={r} className={'btn btn-sm ' + (viewRound === r ? 'btn-soft' : 'btn-outline')} onClick={() => setPicked(r === t.current_round ? null : r)}>
                    R{r}{r === t.current_round && t.status === 'live' && <span className="ldot" />}
                  </button>
                ))}
                <span className="sub" style={{ marginLeft: 'auto', fontSize: 11 }}>{done} of {boards.length} results in</span>
              </div>
              {boards.map((g) => {
                const mine = meId && (g.white_id === meId || g.black_id === meId)
                return (
                  <div key={g.id} className={'live-board' + (mine ? ' mine' : '')}>
                    <span className="no">{two(g.board)}</span>
                    <div className="names">
                      <b>{pname.get(g.white_id)}</b>
                      <small>{g.black_id ? `vs ${pname.get(g.black_id)}` : 'Bye'}</small>
                    </div>
                    {!g.black_id
                      ? <span className="res wait">Bye +1</span>
                      : g.result ? <span className="res">{resultText(g.result)}</span> : <span className="res wait">Playing</span>}
                  </div>
                )
              })}
              {boards.length === 0 && <p className="sub">No fixtures yet.</p>}
            </>
          )}

          {tab === 'standings' && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Player</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.player.id} className={r.player.id === meId ? 'me' : ''}>
                      <td className="num">{r.rank}</td>
                      <td><b>{r.player.name}</b></td>
                      <td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td>
                      <td><b>{fmtPoints(r.points)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <p className="sub" style={{ textAlign: 'center', marginTop: 26, fontSize: 11 }}>Live view · read-only · updates automatically</p>
    </div>
    </div>
  )
}
