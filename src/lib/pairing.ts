import type { Format, Game, Player, Tournament } from './types'
import { computeStandings } from './standings'

export interface Pairing {
  white: string
  black: string | null // null = bye
}

const byCreated = (a: Player, b: Player) =>
  a.created_at.localeCompare(b.created_at) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)

export function totalRoundsFor(format: Format, n: number, requested: number): number {
  if (n < 2) return Math.max(1, requested || 3)
  if (format === 'round_robin') return n % 2 === 0 ? n - 1 : n
  if (format === 'knockout') return Math.ceil(Math.log2(n))
  return Math.max(1, Math.min(requested || 3, n - 1))
}

export function pairRound(t: Tournament, players: Player[], games: Game[], round: number): Pairing[] {
  if (t.format === 'round_robin') return roundRobin(players, round)
  if (t.format === 'knockout') return knockout(players, games, round)
  return swiss(players, games, round)
}

/* ---------------- Round robin (circle method) ---------------- */
function roundRobin(players: Player[], round: number): Pairing[] {
  const ids: (string | null)[] = [...players].sort(byCreated).map((p) => p.id)
  if (ids.length % 2) ids.push(null)
  const n = ids.length
  const fixed = ids[0]
  const rest = ids.slice(1)
  const k = (round - 1) % (n - 1)
  const rotated = [...rest.slice(rest.length - k), ...rest.slice(0, rest.length - k)]
  const arr = [fixed, ...rotated]

  const out: Pairing[] = []
  for (let i = 0; i < n / 2; i++) {
    const a = arr[i]
    const b = arr[n - 1 - i]
    if (a === null || b === null) {
      out.push({ white: (a ?? b) as string, black: null })
      continue
    }
    out.push((i + round) % 2 === 0 ? { white: a, black: b } : { white: b, black: a })
  }
  return out.sort((x, y) => Number(x.black === null) - Number(y.black === null))
}

/* ---------------- Swiss ---------------- */
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

function matchPool(pool: Player[], played: Set<string>): [Player, Player][] | null {
  if (!pool.length) return []
  const [first, ...rest] = pool
  for (let i = 0; i < rest.length; i++) {
    const opp = rest[i]
    if (played.has(pairKey(first.id, opp.id))) continue
    const sub = matchPool([...rest.slice(0, i), ...rest.slice(i + 1)], played)
    if (sub) return [[first, opp], ...sub]
  }
  return null
}

function swiss(players: Player[], games: Game[], round: number): Pairing[] {
  let ordered = [...players].sort(byCreated)
  if (round > 1) {
    const rank = computeStandings(players, games).map((r) => r.player.id)
    ordered = rank.map((id) => players.find((p) => p.id === id)!).filter(Boolean)
  }

  let pool = [...ordered]
  let bye: Player | undefined
  if (pool.length % 2) {
    const hadBye = new Set(games.filter((g) => !g.black_id).map((g) => g.white_id))
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!hadBye.has(pool[i].id)) { bye = pool[i]; break }
    }
    bye ??= pool[pool.length - 1]
    pool = pool.filter((p) => p !== bye)
  }

  let pairs: [Player, Player][]
  if (round === 1) {
    const half = pool.length / 2
    pairs = pool.slice(0, half).map((p, i) => [p, pool[i + half]])
  } else {
    const played = new Set(games.filter((g) => g.black_id).map((g) => pairKey(g.white_id, g.black_id!)))
    pairs = matchPool(pool, played) ?? matchPool(pool, new Set()) ?? []   // fall back to rematches if unavoidable
  }

  const balance = (id: string) =>
    games.reduce((s, g) => (!g.black_id ? s : g.white_id === id ? s + 1 : g.black_id === id ? s - 1 : s), 0)

  const out: Pairing[] = pairs.map(([a, b], i) => {
    const ba = balance(a.id)
    const bb = balance(b.id)
    const aWhite = ba !== bb ? ba < bb : i % 2 === 0
    return aWhite ? { white: a.id, black: b.id } : { white: b.id, black: a.id }
  })
  if (bye) out.push({ white: bye.id, black: null })
  return out
}

/* ---------------- Knockout ---------------- */
function knockout(players: Player[], games: Game[], round: number): Pairing[] {
  if (round === 1) {
    const seeds = [...players].sort(byCreated)
    const size = 2 ** Math.ceil(Math.log2(seeds.length))
    const byes = size - seeds.length
    const byeSeeds = seeds.slice(0, byes)       // top seeds get the byes
    const rest = seeds.slice(byes)
    const out: Pairing[] = []
    for (let i = 0; i < rest.length / 2; i++) out.push({ white: rest[i].id, black: rest[rest.length - 1 - i].id })
    byeSeeds.forEach((p) => out.push({ white: p.id, black: null }))
    return out
  }
  const prev = games.filter((g) => g.round === round - 1).sort((a, b) => a.board - b.board)
  const winners = prev.map((g) => (!g.black_id ? g.white_id : g.result === '0-1' ? g.black_id : g.white_id))
  const out: Pairing[] = []
  for (let i = 0; i < winners.length; i += 2) {
    out.push(winners[i + 1] ? { white: winners[i], black: winners[i + 1] } : { white: winners[i], black: null })
  }
  return out
}
