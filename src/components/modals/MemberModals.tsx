import { useState } from 'react'
import Modal from '../Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { friendlyError } from '../../lib/utils'

export function AddMemberModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) return setErr('Enter a player name.')
    setBusy(true); setErr('')
    const { error } = await supabase.from('members').insert({ owner_id: user!.id, name: name.trim(), email: email.trim() || null })
    setBusy(false)
    if (error) return setErr(friendlyError(error))
    setName(''); setEmail(''); onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add member">
      {err && <div className="notice">{err}</div>}
      <div className="form-row"><label>Player name</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus /></div>
      <div className="form-row"><label>Email (optional)</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@example.com" /></div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save member'}</button>
      </div>
    </Modal>
  )
}

/** Accepts "Name" or "Name,email" per line (CSV/TXT file or pasted). */
export function parseList(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines[0] && /^name\b/i.test(lines[0])) lines.shift()
  const seen = new Set<string>()
  const out: { name: string; email: string | null }[] = []
  for (const l of lines) {
    const [n, e] = l.split(/[,;\t]/).map((s) => s.trim().replace(/^"|"$/g, ''))
    if (!n || n.length > 40 || seen.has(n.toLowerCase())) continue
    seen.add(n.toLowerCase())
    out.push({ name: n, email: e && e.includes('@') ? e : null })
  }
  return out
}

export function ImportModal({ open, onClose, existing, onSaved }: { open: boolean; onClose: () => void; existing: string[]; onSaved: () => void }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const known = new Set(existing.map((n) => n.toLowerCase()))
  const rows = parseList(text).filter((r) => !known.has(r.name.toLowerCase()))

  async function onFile(f?: File) {
    if (f) setText(await f.text())
  }
  async function save() {
    if (!rows.length) return setErr('Nothing new to import.')
    setBusy(true); setErr('')
    const { error } = await supabase.from('members').insert(rows.map((r) => ({ ...r, owner_id: user!.id })))
    setBusy(false)
    if (error) return setErr(friendlyError(error))
    setText(''); onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Import a player list">
      {err && <div className="notice">{err}</div>}
      <div className="form-row">
        <label>Upload a CSV or TXT file</label>
        <input type="file" accept=".csv,.txt" className="field" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <div className="form-row">
        <label>…or paste a list</label>
        <textarea className="field" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={'One player per line\nEmmanuel\nBrian, brian@example.com'} />
        <small>{rows.length} new member{rows.length === 1 ? '' : 's'} ready to import</small>
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy || !rows.length}>{busy ? 'Importing…' : `Import ${rows.length || ''}`}</button>
      </div>
    </Modal>
  )
}
