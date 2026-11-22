import { useState } from 'react'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'

export default function Billing() {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const pro = profile?.plan === 'pro'

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">PLANS & BILLING</div>
          <h1>Simple pricing. More chess.</h1>
          <p className="sub">Start free, upgrade whenever your community grows.</p>
        </div>
      </div>
      <div className="event-grid">
        <div className="event-card">
          <div className="eyebrow">GET STARTED</div>
          <h2 style={{ fontSize: 25, margin: '8px 0' }}>Free</h2>
          <div style={{ fontSize: 28, fontWeight: 900 }}>$0 <small style={{ fontSize: 11, color: 'var(--muted)' }}>/ month</small></div>
          <p className="sub">Everything you need to run your first event.</p>
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '18px 0' }} />
          <p>✓ 1 event per month</p><p>✓ Up to 12 players</p><p>✓ Saved players, TV display & certificates</p><p>✓ Swiss, Round Robin & Knockout</p>
          <button className="btn btn-outline full-btn" disabled>{pro ? 'Free plan' : 'Current plan'}</button>
        </div>
        <div className="event-card" style={{ border: '1.5px solid var(--green)' }}>
          <span className="tag green">MOST POPULAR</span>
          <h2 style={{ fontSize: 25, margin: '8px 0' }}>Pro</h2>
          <div style={{ fontSize: 28, fontWeight: 900 }}>$7 <small style={{ fontSize: 11, color: 'var(--muted)' }}>/ month</small></div>
          <p className="sub">For clubs and organisers who play often.</p>
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '18px 0' }} />
          <p>✓ Unlimited tournaments</p><p>✓ Unlimited players</p><p>✓ Everything in Free</p><p>✓ ChessHost AI rules assistant</p>
          {pro
            ? <button className="btn btn-outline full-btn" disabled>Current plan</button>
            : <button className="btn btn-primary full-btn" onClick={() => setOpen(true)}>Upgrade to Pro →</button>}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Pro checkout is coming soon" width={440}>
        <p className="sub">Online payments aren't connected yet. Get in touch with the ChessHost team and we'll switch your account to Pro.</p>
        <div className="modal-foot"><button className="btn btn-primary" onClick={() => setOpen(false)}>Got it</button></div>
      </Modal>
    </>
  )
}
