import Icon from '../components/Icon'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTournament } from '../hooks/useTournament'
import { computeStandings, fmtPoints } from '../lib/standings'


export default function Standings() {
  const { id } = useParams()
  const { tournament: t, players, games, loading, notFound } = useTournament({ id })
  const rows = useMemo(() => computeStandings(players, games), [players, games])

  if (loading) return <div className="spinner">Loading…</div>
  if (notFound || !t) return <div className="notice">Tournament not found. <Link to="/tournaments">Back</Link></div>

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow raw">{t.name}</div>
          <h1>Standings</h1>
          <p className="sub">Live leaderboard · Updated as results come in. Tie-break: Buchholz.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={'status ' + t.status}>{t.status === 'finished' ? 'Final' : t.status === 'draft' ? 'Not started' : `Round ${t.current_round}`}</span>
          <Link className="btn btn-outline btn-sm" to={`/tournaments/${t.id}`}><Icon name="arrow-left" size={14} /> Control room</Link>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Position</th><th>Player</th><th>Played</th><th>Wins</th><th>Draws</th><th>Losses</th><th>Buchholz</th><th>Points</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.player.id}>
                <td className="num">{r.rank}</td>
                <td><b>{r.player.name}</b></td>
                <td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td>
                <td className="num">{fmtPoints(r.buchholz)}</td>
                <td><b>{fmtPoints(r.points)}</b></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)' }}>No players yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
