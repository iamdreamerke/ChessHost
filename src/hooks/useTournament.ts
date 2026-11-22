import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Game, Player, Tournament } from '../lib/types'

interface Key { id?: string; slug?: string }

/** Loads a tournament + players + games and keeps them live via Supabase Realtime (with a slow polling fallback). */
export function useTournament(key: Key) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const tid = useRef<string | null>(null)

  const load = useCallback(async () => {
    let q = supabase.from('tournaments').select('*')
    q = key.id ? q.eq('id', key.id) : q.eq('slug', key.slug ?? '')
    const { data: t } = await q.maybeSingle()
    if (!t) { setNotFound(true); setLoading(false); return }
    const [p, g] = await Promise.all([
      supabase.from('players').select('*').eq('tournament_id', t.id).order('created_at').order('name'),
      supabase.from('games').select('*').eq('tournament_id', t.id).order('round').order('board'),
    ])
    tid.current = t.id
    setTournament(t as Tournament)
    setPlayers((p.data ?? []) as Player[])
    setGames((g.data ?? []) as Game[])
    setNotFound(false)
    setLoading(false)
  }, [key.id, key.slug])

  useEffect(() => { load() }, [load])

  const id = tournament?.id
  useEffect(() => {
    if (!id) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => { clearTimeout(timer); timer = setTimeout(load, 150) }
    const ch = supabase
      .channel(`tournament-${id}-${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `tournament_id=eq.${id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `tournament_id=eq.${id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, refresh)
      .subscribe()
    const poll = setInterval(load, 20000)
    return () => { clearTimeout(timer); clearInterval(poll); supabase.removeChannel(ch) }
  }, [id, load])

  return { tournament, players, games, loading, notFound, reload: load }
}
