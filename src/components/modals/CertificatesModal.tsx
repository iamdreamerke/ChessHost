import { useMemo, useRef, useState } from 'react'
import Modal from '../Modal'
import CertificateView, { CERT, categoryForRank, type Category } from '../CertificateView'
import { useTournament } from '../../hooks/useTournament'
import { useAuth } from '../../hooks/useAuth'
import { computeStandings, fmtPoints } from '../../lib/standings'
import { fmtDateLong } from '../../lib/utils'
import type { Tournament } from '../../lib/types'

function Body({ id, onClose }: { id: string; onClose: () => void }) {
  const { profile } = useAuth()
  const { tournament: t, players, games, loading } = useTournament({ id })
  const rows = useMemo(() => computeStandings(players, games), [players, games])
  const [pid, setPid] = useState<string>('')
  const [override, setOverride] = useState<Category | null>(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  if (loading || !t) return <div className="spinner">Loading…</div>
  if (!rows.length) return <div className="notice">This tournament has no players yet.</div>

  const row = rows.find((r) => r.player.id === pid) ?? rows[0]
  const category = override ?? categoryForRank(row.rank)
  const code = `CERT-${new Date(t.event_date).getFullYear()}-${t.slug.slice(0, 4).toUpperCase()}-${String(row.rank).padStart(2, '0')}`
  const file = `certificate-${row.player.name.replace(/\W+/g, '-').toLowerCase()}`

  async function png() {
    if (!ref.current) return
    setBusy(true)
    const { toPng } = await import('html-to-image')
    const url = await toPng(ref.current, { pixelRatio: 2, cacheBust: true })
    const a = document.createElement('a'); a.href = url; a.download = file + '.png'; a.click()
    setBusy(false)
  }
  async function pdf() {
    if (!ref.current) return
    setBusy(true)
    const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])
    const url = await toPng(ref.current, { pixelRatio: 2, cacheBust: true })
    const w = ref.current.offsetWidth, h = ref.current.offsetHeight
    const doc = new jsPDF({ unit: 'px', format: [w, h], orientation: w > h ? 'landscape' : 'portrait' })
    doc.addImage(url, 'PNG', 0, 0, w, h)
    doc.save(file + '.pdf')
    setBusy(false)
  }

  return (
    <>
      <div className="form-row">
        <label>Player</label>
        <select className="field" value={row.player.id} onChange={(e) => { setPid(e.target.value); setOverride(null) }}>
          {rows.map((r) => <option key={r.player.id} value={r.player.id}>{r.rank}. {r.player.name} — {fmtPoints(r.points)} pts</option>)}
        </select>
      </div>
      <div className="cert-controls">
        {(Object.keys(CERT) as Category[]).map((c) => (
          <button key={c} className={'btn btn-outline btn-sm' + (category === c ? ' selected' : '')} onClick={() => setOverride(c)}>{CERT[c].label}</button>
        ))}
      </div>
      <CertificateView ref={ref} name={row.player.name} category={category} event={t.name} date={fmtDateLong(t.event_date)} director={profile?.full_name ?? ''} code={code} />
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={onClose}>Close</button>
        <button className="btn btn-outline" onClick={pdf} disabled={busy}>PDF</button>
        <button className="btn btn-primary" onClick={png} disabled={busy}>Download PNG</button>
      </div>
    </>
  )
}

export default function CertificatesModal({ tournament, onClose }: { tournament: Tournament | null; onClose: () => void }) {
  return (
    <Modal open={!!tournament} onClose={onClose} title="Certificates" width={650}>
      {tournament && <><p className="sub" style={{ marginBottom: 14 }}>Preview and download the award for each participant</p><Body id={tournament.id} onClose={onClose} /></>}
    </Modal>
  )
}
