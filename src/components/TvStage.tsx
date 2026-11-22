import Icon from './Icon'
import { forwardRef, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Game, Player, Tournament } from '../lib/types'
import { computeStandings, fmtPoints } from '../lib/standings'
import { SPEED_LABEL, joinUrl } from '../lib/utils'
import { resultText } from '../lib/utils'

interface Props { tournament: Tournament; players: Player[]; games: Game[] }

const MAX_BOARDS = 8

const TvStage = forwardRef<HTMLDivElement, Props>(({ tournament: t, players, games }, ref) => {
  const rows = useMemo(() => computeStandings(players, games), [players, games])
  const pname = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players])
  const boards = games.filter((g) => g.round === t.current_round).sort((a, b) => a.board - b.board)
  const showJoin = t.status === 'draft' && t.registration_open

  const subline =
    t.status === 'draft'
      ? `REGISTRATION ${t.registration_open ? 'OPEN' : 'CLOSED'} · ${players.length} PLAYERS`
      : t.status === 'finished'
        ? `FINAL RESULTS · ${SPEED_LABEL[t.speed].toUpperCase()} · ${players.length} PLAYERS`
        : `ROUND ${String(t.current_round).padStart(2, '0')} OF ${String(t.total_rounds).padStart(2, '0')} · ${SPEED_LABEL[t.speed].toUpperCase()} · ${players.length} PLAYERS`

  return (
    <div className="tv-stage" data-theme={t.tv_theme} ref={ref}>
      <div className="tv-head">
        <div>
          <div className="tv-kicker">CHESSHOST PRESENTS</div>
          <h1>{t.name.toUpperCase()}</h1>
          <div className="tv-subline">{subline}</div>
        </div>
        <div className="tv-piece"><Icon name="pawn" size="1em" /></div>
      </div>

      <div className="tv-grid">
        <div>
          {t.status === 'draft' ? (
            <>
              <h3>REGISTERED PLAYERS</h3>
              {players.length === 0 && <div className="tv-board">Waiting for players to join…</div>}
              <div className="tv-names">
                {players.slice(0, 16).map((p) => <div key={p.id}>{p.name}</div>)}
              </div>
              {players.length > 16 && <div className="tv-more">+ {players.length - 16} more</div>}
            </>
          ) : t.status === 'finished' ? (
            <>
              <h3>FINAL STANDINGS</h3>
              {rows.slice(0, MAX_BOARDS).map((r) => (
                <div className="tv-rank" key={r.player.id}>
                  <span>{r.rank}. {r.player.name}</span>
                  <b>{fmtPoints(r.points)}</b>
                </div>
              ))}
            </>
          ) : (
            <>
              <h3>LIVE PAIRINGS</h3>
              {boards.slice(0, MAX_BOARDS).map((g) => (
                <div className="tv-board" key={g.id}>
                  <span className="no">BOARD {String(g.board).padStart(2, '0')}</span>
                  <span className="w">{pname.get(g.white_id)}</span>
                  <b>{g.black_id ? `VS　${pname.get(g.black_id)}` : 'BYE'}</b>
                  {g.result && g.black_id && <span className="res">{resultText(g.result)}</span>}
                </div>
              ))}
              {boards.length > MAX_BOARDS && <div className="tv-more">+ {boards.length - MAX_BOARDS} more boards</div>}
            </>
          )}
        </div>

        <div>
          <h3>{t.status === 'finished' ? 'PODIUM' : 'TOP PLAYERS'}</h3>
          {rows.slice(0, 5).map((r) => (
            <div className="tv-rank" key={r.player.id}>
              <span>{r.rank}. {r.player.name}</span>
              <b>{fmtPoints(r.points)}</b>
            </div>
          ))}
          {rows.length === 0 && <div className="tv-rank"><span>—</span></div>}
          {showJoin && (
            <div className="tv-join">
              <div className="tv-qr"><QRCodeSVG value={joinUrl(t.slug)} size={104} fgColor="#1f2a24" bgColor="#ffffff" /></div>
              <span>JOIN THE TOURNAMENT<br />SCAN THE QR CODE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
export default TvStage
