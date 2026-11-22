import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AddMemberModal, ImportModal } from '../components/modals/MemberModals'
import { fmtDateMed } from '../lib/utils'
import type { Member } from '../lib/types'

const CAPACITY = 1000

export default function Players() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [events, setEvents] = useState(0)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const [m, t] = await Promise.all([
      supabase.from('members').select('*').eq('owner_id', user.id).order('name'),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    ])
    setMembers((m.data ?? []) as Member[])
    setEvents(t.count ?? 0)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? members.filter((m) => m.name.toLowerCase().includes(s) || (m.email ?? '').toLowerCase().includes(s)) : members
  }, [members, q])

  async function remove(m: Member) {
    if (!confirm(`Remove ${m.name} from your saved players?`)) return
    await supabase.from('members').delete().eq('id', m.id)
    load()
  }

  if (loading) return <div className="spinner">Loading…</div>

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">YOUR CHESS COMMUNITY</div><h1>My Players</h1><p className="sub">Your saved members, ready for the next game.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setImportOpen(true)}>⇧ Import a list</button>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>＋ Add member</button>
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat"><div className="stat-top">Saved members <span className="stat-icon">♙</span></div><div className="stat-num">{members.length}</div><div className="stat-note">Your community roster</div></div>
        <div className="stat"><div className="stat-top">Member capacity <span className="stat-icon">◎</span></div><div className="stat-num">{members.length} <small>/ {CAPACITY.toLocaleString()}</small></div><div className="stat-note">Free on every plan</div></div>
        <div className="stat"><div className="stat-top">Events played <span className="stat-icon">♜</span></div><div className="stat-num">{events}</div><div className="stat-note">Tournament history</div></div>
      </div>

      <div className="toolbar">
        <input className="search" placeholder="⌕  Search players..." value={q} onChange={(e) => setQ(e.target.value)} />
        <span>{shown.length} member{shown.length === 1 ? '' : 's'}</span>
      </div>

      {members.length === 0 ? (
        <div className="empty">
          <div className="empty-mark">♙</div>
          <h3>Your player list starts here</h3>
          <p>Save regular players so you can add them to future tournaments in seconds. No player accounts needed.</p>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>＋ Add your first member</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Added</th><th /></tr></thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.name}</b></td>
                  <td>{m.email ?? <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                  <td>{fmtDateMed(m.created_at.slice(0, 10))}</td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-outline btn-sm btn-danger" onClick={() => remove(m)}>Remove</button></td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>No matches.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} existing={members.map((m) => m.name)} onSaved={load} />
    </>
  )
}
