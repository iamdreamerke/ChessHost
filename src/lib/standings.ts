import type { Game, Player } from './types'

export interface StandingRow {
  player: Player
  rank: number
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  buchholz: number
}

/** Win = 1, draw = 0.5, bye = 1. Tie-break: Buchholz (sum of opponents' points), then wins, then name. */
export function computeStandings(players: Player[], games: Game[]): StandingRow[] {
  const rows = new Map<string, StandingRow>()
  players.forEach((p) =>
    rows.set(p.id, { player: p, rank: 0, played: 0, wins: 0, draws: 0, losses: 0, points: 0, buchholz: 0 }),
  )
  const opponents = new Map<string, string[]>()

  for (const g of games) {
    if (!g.result) continue
    const w = rows.get(g.white_id)
    if (!w) continue

    if (!g.black_id) {            // bye = automatic point
      w.played++; w.wins++; w.points += 1
      continue
    }
    const b = rows.get(g.black_id)
    if (!b) continue
    w.played++; b.played++
    if (g.result === '1-0') { w.wins++; w.points += 1; b.losses++ }
    else if (g.result === '0-1') { b.wins++; b.points += 1; w.losses++ }
    else { w.draws++; b.draws++; w.points += 0.5; b.points += 0.5 }

    opponents.set(w.player.id, [...(opponents.get(w.player.id) ?? []), b.player.id])
    opponents.set(b.player.id, [...(opponents.get(b.player.id) ?? []), w.player.id])
  }

  rows.forEach((r) => {
    r.buchholz = (opponents.get(r.player.id) ?? []).reduce((s, id) => s + (rows.get(id)?.points ?? 0), 0)
  })

  return [...rows.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.buchholz - a.buchholz ||
        b.wins - a.wins ||
        a.player.name.localeCompare(b.player.name),
    )
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export const fmtPoints = (n: number) => n.toFixed(1)
