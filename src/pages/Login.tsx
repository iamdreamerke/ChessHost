import Icon from '../components/Icon'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { appUrl, friendlyError } from '../lib/utils'

export default function Login() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && session) return <Navigate to="/tournaments" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(''); setInfo('')
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr(friendlyError(error))
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() }, emailRedirectTo: appUrl() } })
      if (error) setErr(friendlyError(error))
      else if (!data.session) setInfo('Account created! Check your email to confirm, then sign in.')
    }
    setBusy(false)
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand"><span className="brand-mark"><Icon name="pawn" size={14} /></span>ChessHost</div>
        <h1>{mode === 'in' ? 'Welcome back' : 'Create your organiser account'}</h1>
        <p className="sub">{mode === 'in' ? 'Sign in to manage your chess events.' : 'Free to start. No player accounts needed.'}</p>
        {err && <div className="notice">{err}</div>}
        {info && <div className="notice ok">{info}</div>}
        {mode === 'up' && (
          <div className="form-row"><label>Full name</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" /></div>
        )}
        <div className="form-row"><label>Email</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" /></div>
        <div className="form-row"><label>Password</label><input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" /></div>
        <button className="btn btn-primary full-btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
        <div className="auth-switch">
          {mode === 'in' ? <>New here? <button type="button" onClick={() => setMode('up')}>Create an account</button></> : <>Already have an account? <button type="button" onClick={() => setMode('in')}>Sign in</button></>}
        </div>
      </form>
    </div>
  )
}
