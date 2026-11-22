import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTournament } from '../hooks/useTournament'
import { FORMAT_LABEL, SPEED_LABEL, clockLabel, fmtDateShort, friendlyError } from '../lib/utils'

export default function Join() {
  const { slug } = useParams()
  const { tournament: t, players, loading, notFound, reload } = useTournament({ slug })
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [joined, setJoined] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.rpc('join_tournament', { p_slug: slug, p_name: name })
    setBusy(false)
    if (error) return setErr(friendlyError(error))
    setJoined(name.trim()); setName(''); reload()
  }

  const closed = !t || t.status !== 'draft' || !t.registration_open

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><span className="brand-mark">♟</span>ChessHost<span style={{ color: 'var(--green)' }}>.</span></div>
        {loading ? <div className="spinner">Loading…</div> : notFound || !t ? (
          <><h1>Tournament not found</h1><p className="sub">Check the link or QR code and try again.</p></>
        ) : (
          <>
            <div className="eyebrow" style={{ textAlign: 'center' }}>YOU'RE INVITED</div>
            <h1 style={{ marginTop: 6 }}>{t.name}</h1>
            <p className="sub">{FORMAT_LABEL[t.format]} · {SPEED_LABEL[t.speed]} · {clockLabel(t)}<br />{fmtDateShort(t.event_date)}</p>

            {joined ? (
              <div className="notice ok" style={{ textAlign: 'center' }}>✓ You're in, {joined}! See you at the board.</div>
            ) : closed ? (
              <div className="notice" style={{ textAlign: 'center' }}>Registration is closed for this tournament.</div>
            ) : (
              <form onSubmit={submit}>
                {err && <div className="notice">{err}</div>}
                <div className="form-row"><label>Your name</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brian Kimani" maxLength={40} required autoFocus /></div>
                <button className="btn btn-primary full-btn" disabled={busy}>{busy ? 'Joining…' : 'Join tournament →'}</button>
              </form>
            )}

            <p className="sub" style={{ textAlign: 'center', marginTop: 18 }}>{players.length} player{players.length === 1 ? '' : 's'} registered</p>
            <div className="chip-row" style={{ justifyContent: 'center', marginTop: 8 }}>
              {players.slice(0, 24).map((p) => <span className="tag" key={p.id}>{p.name}</span>)}
            </div>
            <p className="auth-switch"><a href={`/tv/${t.slug}`}>Open live display →</a></p>
          </>
        )}
      </div>
    </div>
  )
}
