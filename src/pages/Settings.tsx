import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { friendlyError } from '../lib/utils'

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { setName(profile?.full_name ?? ''); setEmail(user?.email ?? '') }, [profile, user])

  async function save() {
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user!.id)
    if (error) { setBusy(false); return setMsg({ ok: false, text: friendlyError(error) }) }
    let text = 'Changes saved.'
    if (email.trim() && email.trim() !== user!.email) {
      const { error: e2 } = await supabase.auth.updateUser({ email: email.trim() })
      if (e2) { setBusy(false); return setMsg({ ok: false, text: friendlyError(e2) }) }
      text = 'Saved. Check your inbox to confirm the new email address.'
    }
    await refreshProfile()
    setBusy(false); setMsg({ ok: true, text })
  }

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p className="sub">Manage your organiser profile and preferences.</p></div>
      </div>
      <div className="event-card" style={{ maxWidth: 650 }}>
        <h3 style={{ marginTop: 0 }}>Profile information</h3>
        {msg && <div className={'notice' + (msg.ok ? ' ok' : '')}>{msg.text}</div>}
        <div className="form-row"><label>Full name</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="form-row"><label>Email address</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          <button className="btn btn-outline" onClick={async () => { await signOut(); nav('/login') }}>Sign out</button>
        </div>
        <p className="sub" style={{ marginTop: 14 }}>Your name appears as “Tournament Director” on certificates.</p>
      </div>
    </>
  )
}
