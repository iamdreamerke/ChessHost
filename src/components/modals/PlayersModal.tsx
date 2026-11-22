import { useCallback, useEffect, useState } from 'react'
import Modal from '../Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { friendlyError } from '../../lib/utils'
import type { Member, Player, Tournament } from '../../lib/types'

export default function PlayersModal({ tournament, onClose, onChanged }: {
  tournament: Tournament | null
  onClose: () => void
  onChanged: () => void
}) {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [text, setText] = useState('')
  const [save, setSave] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const tid = tournament?.id

  const load = useCallback(async () => {
    if (!tid || !user) return
    const [p, m] = await Promise.all([
      supabase.from('players').select('*').eq('tournament_id', tid).order('created_at').order('name'),
      supabase.from('members').select('*').eq('owner_id', user.id).order('name'),
    ])
    setPlayers((p.data ?? []) as Player[])
    setMembers((m.data ?? []) as Member[])
  }, [tid, user])

  useEffect(() => { setText(''); setErr(''); load() }, [load])

  if (!tournament) return <Modal open={false} onClose={onClose}>{null}</Modal>
  const locked = tournament.status !== 'draft'
  const have = new Set(players.map((p) => p.name.toLowerCase()))
  const available = members.filter((m) => !have.has(m.name.toLowerCase()))

  async function addNames() {
    const names = [...new Set(text.split(/\n|,/).map((s) => s.trim()).filter(Boolean))]
      .filter((n) => n.length <= 40 && !have.has(n.toLowerCase()))
    if (!names.length) return setErr('Enter at least one new player name.')
    setBusy(true); setErr('')
    const { error } = await supabase.from('players').insert(names.map((name) => ({ tournament_id: tournament!.id, name })))
    if (error) { setBusy(false); return setErr(friendlyError(error)) }
    if (save && user) {
      const known = new Set(members.map((m) => m.name.toLowerCase()))
      const fresh = names.filter((n) => !known.has(n.toLowerCase()))
      if (fresh.length) await supabase.from('members').insert(fresh.map((name) => ({ owner_id: user.id, name })))
    }
    setBusy(false); setText('')
    await load(); onChanged()
  }

  async function addMember(m: Member) {
    setErr('')
    const { error } = await supabase.from('players').insert({ tournament_id: tournament!.id, member_id: m.id, name: m.name })
    if (error) return setErr(friendlyError(error))
    await load(); onChanged()
  }

  async function remove(id: string) {
    await supabase.from('players').delete().eq('id', id)
    await load(); onChanged()
  }

  return (
    <Modal open onClose={onClose} title={`Players · ${tournament.name}`}>
      {err && <div className="notice">{err}</div>}
      {locked ? (
        <div className="notice">Players are locked once a tournament has started.</div>
      ) : (
        <>
          <div className="form-row">
            <label>Add player names</label>
            <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Enter one name per line\nEmmanuel\nBrian\nFaith'} />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontWeight: 700 }}>
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Also save to My Players
            </label>
          </div>
          {available.length > 0 && (
            <div className="form-row">
              <label>Quick add from My Players</label>
              <div className="chip-row">
                {available.slice(0, 30).map((m) => <button key={m.id} className="chip-btn" onClick={() => addMember(m)}>＋ {m.name}</button>)}
              </div>
            </div>
          )}
        </>
      )}
      <div className="form-row">
        <label>In this tournament ({players.length})</label>
        <div className="player-list">
          {players.length === 0 && <small>No players yet.</small>}
          {players.map((p) => (
            <div className="player-row" key={p.id}>
              <span>{p.name}</span>
              {!locked && <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>×</button>}
            </div>
          ))}
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={onClose}>Close</button>
        {!locked && <button className="btn btn-primary" onClick={addNames} disabled={busy}>{busy ? 'Adding…' : 'Add players'}</button>}
      </div>
    </Modal>
  )
}
