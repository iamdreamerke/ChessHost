import { useState } from 'react'
import Modal from '../Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { friendlyError } from '../../lib/utils'
import type { Format, Speed, Tournament } from '../../lib/types'

const SPEEDS: { id: Speed; label: string; hint: string; clock: number | null }[] = [
  { id: 'blitz', label: 'Blitz', hint: 'Fast games', clock: 5 },
  { id: 'rapid', label: 'Rapid', hint: 'Balanced pace', clock: 15 },
  { id: 'social', label: 'Social', hint: 'No clock', clock: null },
]

const today = () => new Date().toISOString().slice(0, 10)

export default function CreateTournamentModal({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (t: Tournament) => void
}) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [speed, setSpeed] = useState<Speed>('rapid')
  const [format, setFormat] = useState<Format>('swiss')
  const [clock, setClock] = useState<string>('15')
  const [customClock, setCustomClock] = useState('30')
  const [rounds, setRounds] = useState(3)
  const [date, setDate] = useState(today())
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function pickSpeed(s: (typeof SPEEDS)[number]) {
    setSpeed(s.id)
    setClock(s.clock ? String(s.clock) : '')
  }

  const clockMinutes: number | null =
    clock === 'custom' ? Math.max(1, Math.min(180, Number(customClock) || 0)) || null : clock ? Number(clock) : null

  async function submit() {
    if (!name.trim()) return setErr('Please enter a tournament name.')
    if (clock === 'custom' && !clockMinutes) return setErr('Enter a valid custom clock (1–180 minutes).')
    setBusy(true); setErr('')
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        owner_id: user!.id,
        name: name.trim(),
        format,
        speed,
        clock_minutes: clockMinutes,
        event_date: date,
        total_rounds: rounds,
      })
      .select('*')
      .single()
    setBusy(false)
    if (error) return setErr(friendlyError(error))
    setName('')
    onCreated(data as Tournament)
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="LET'S GET STARTED" title="New tournament">
      {err && <div className="notice">{err}</div>}
      <div className="form-row">
        <label>Tournament name</label>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Friday Chess Night" autoFocus />
      </div>
      <div className="form-row">
        <label>Game speed</label>
        <div className="choice-grid">
          {SPEEDS.map((s) => (
            <button key={s.id} className={'choice' + (speed === s.id ? ' selected' : '')} onClick={() => pickSpeed(s)}>
              <b>{s.label}</b><small>{s.hint}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="two-col">
        <div className="form-row">
          <label>Tournament format</label>
          <select className="field" value={format} onChange={(e) => setFormat(e.target.value as Format)}>
            <option value="swiss">Swiss</option>
            <option value="round_robin">Round Robin</option>
            <option value="knockout">Knockout</option>
          </select>
        </div>
        <div className="form-row">
          <label>Starting clock</label>
          <select className="field" value={clock} onChange={(e) => setClock(e.target.value)}>
            {[1, 3, 5, 10, 15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={String(m)}>{m} minutes</option>)}
            <option value="custom">Custom…</option>
            <option value="">No clock</option>
          </select>
          {clock === 'custom' && (
            <input type="number" min={1} max={180} className="field" style={{ marginTop: 8 }} value={customClock} onChange={(e) => setCustomClock(e.target.value)} placeholder="Minutes per player" />
          )}
        </div>
      </div>
      <div className="two-col">
        <div className="form-row">
          <label>Date</label>
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {format === 'swiss' ? (
          <div className="form-row">
            <label>Rounds</label>
            <input type="number" min={1} max={12} className="field" value={rounds} onChange={(e) => setRounds(Math.max(1, Number(e.target.value) || 1))} />
          </div>
        ) : (
          <div className="form-row">
            <label>Rounds</label>
            <input className="field" disabled value="Set automatically" />
          </div>
        )}
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Creating…' : 'Continue'}</button>
      </div>
    </Modal>
  )
}
