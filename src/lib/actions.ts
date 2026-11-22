import { supabase } from './supabase'
import { pairRound, totalRoundsFor, type Pairing } from './pairing'
import type { Game, Player, Tournament } from './types'

async function insertRound(tournamentId: string, round: number, pairs: Pairing[]) {
  const rows = pairs.map((p, i) => ({
    tournament_id: tournamentId,
    round,
    board: i + 1,
    white_id: p.white,
    black_id: p.black,
    result: p.black ? null : '1-0',      // byes score automatically
  }))
  const { error } = await supabase.from('games').insert(rows)
  if (error) throw error
}

export async function startTournament(t: Tournament, players: Player[]) {
  if (players.length < 2) throw new Error('Add at least 2 players before starting.')
  const total = totalRoundsFor(t.format, players.length, t.total_rounds)
  const pairs = pairRound({ ...t, total_rounds: total }, players, [], 1)
  await supabase.from('games').delete().eq('tournament_id', t.id)
  await insertRound(t.id, 1, pairs)
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'live', current_round: 1, total_rounds: total, registration_open: false })
    .eq('id', t.id)
  if (error) {
    await supabase.from('games').delete().eq('tournament_id', t.id)
    throw error
  }
}

/** Moves to the next round, or finishes the tournament after the last one. */
export async function advanceRound(t: Tournament, players: Player[], games: Game[]): Promise<{ finished: boolean }> {
  const current = games.filter((g) => g.round === t.current_round)
  if (current.some((g) => !g.result)) throw new Error('Enter every result before moving on.')

  if (t.current_round >= t.total_rounds) {
    const { error } = await supabase.from('tournaments').update({ status: 'finished' }).eq('id', t.id)
    if (error) throw error
    return { finished: true }
  }

  const next = t.current_round + 1
  const pairs = pairRound(t, players, games, next)
  await insertRound(t.id, next, pairs)
  const { error } = await supabase.from('tournaments').update({ current_round: next }).eq('id', t.id)
  if (error) throw error
  return { finished: false }
}
