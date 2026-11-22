import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Modal from '../Modal'
import { supabase } from '../../lib/supabase'
import { joinUrl } from '../../lib/utils'
import type { Tournament } from '../../lib/types'

export default function InviteModal({ tournament, onClose, onChanged }: {
  tournament: Tournament | null
  onClose: () => void
  onChanged: () => void
}) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  useEffect(() => { setOpen(tournament?.registration_open ?? true); setCopied(false) }, [tournament?.id, tournament?.registration_open])

  if (!tournament) return <Modal open={false} onClose={onClose}>{null}</Modal>
  const url = joinUrl(tournament.slug)

  async function toggle(v: boolean) {
    setOpen(v)
    await supabase.from('tournaments').update({ registration_open: v }).eq('id', tournament!.id)
    onChanged()
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url) } catch { /* clipboard unavailable */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const locked = tournament.status !== 'draft'
  return (
    <Modal open onClose={onClose} title="Invite Players" width={420}>
      <div style={{ textAlign: 'center' }}>
        <div className="eyebrow">SCAN TO JOIN</div>
        <div style={{ fontWeight: 900, fontSize: 17, marginTop: 4 }}>{tournament.name}</div>
        <div className="qr-box"><QRCodeSVG value={url} size={160} fgColor="#1f2a24" bgColor="#ffffff" /></div>
        <div className="invite-link">
          <span>{url.replace(/^https?:\/\//, '')}</span>
          <button className="btn btn-soft btn-sm" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 11, margin: '16px 0 5px' }}>
          {locked ? 'Registration closes when a tournament starts' : open ? 'Registration is currently open' : 'Registration is currently closed'}
        </p>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 12, fontWeight: 800 }}>
          <input type="checkbox" checked={open && !locked} disabled={locked} onChange={(e) => toggle(e.target.checked)} /> Accept new registrations
        </label>
      </div>
      <div className="modal-foot"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
    </Modal>
  )
}
