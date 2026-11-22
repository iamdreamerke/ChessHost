import { forwardRef } from 'react'

export type Category = 'first' | 'second' | 'third' | 'participant'

export const CERT: Record<Category, { piece: string; award: string; stars: string; desc: string; label: string }> = {
  first: { label: '1st place', piece: '♛', award: '1ST PLACE CHAMPION', stars: '★ ★ ★', desc: 'Awarded for demonstrating strategic excellence and outstanding sportsmanship throughout this chess competition.' },
  second: { label: '2nd place', piece: '♜', award: '2ND PLACE RUNNER-UP', stars: '★ ★', desc: 'Awarded in recognition of an outstanding performance, determination and sportsmanship throughout this chess competition.' },
  third: { label: '3rd place', piece: '♞', award: '3RD PLACE', stars: '★', desc: 'Awarded for an excellent performance and commendable sportsmanship throughout this chess competition.' },
  participant: { label: 'Participant', piece: '♟', award: 'TOURNAMENT PARTICIPANT', stars: '♟  ♟  ♟', desc: 'Presented in recognition of participation, enthusiasm and sportsmanship in this chess competition.' },
}

export const categoryForRank = (rank: number): Category =>
  rank === 1 ? 'first' : rank === 2 ? 'second' : rank === 3 ? 'third' : 'participant'

interface Props {
  name: string
  category: Category
  event: string
  date: string
  director: string
  code: string
}

const CertificateView = forwardRef<HTMLDivElement, Props>(({ name, category, event, date, director, code }, ref) => {
  const c = CERT[category]
  return (
    <div className="certificate" ref={ref}>
      <div className="cert-top">
        <div className="eyebrow-cert">CHESS TOURNAMENT</div>
        <h2>CERTIFICATE</h2>
        <div className="cert-subtitle">of Achievement</div>
      </div>
      <div className="cert-body">
        <div className="cert-watermark">{c.piece}</div>
        <div className="cert-kicker">THIS CERTIFIES THAT</div>
        <div className="cert-name">{name}</div>
        <div className="cert-award">{c.award}</div>
        <div className="cert-stars">{c.stars}</div>
        <p className="cert-description">{c.desc}</p>
        <div className="cert-divider">✦</div>
        <div className="cert-event">{event}</div>
        <div className="cert-date">{date}</div>
        <div className="cert-signatures">
          <span><b>{director || '\u00a0'}</b>TOURNAMENT DIRECTOR</span>
          <span><b>&nbsp;</b>OFFICIAL SIGNATURE</span>
        </div>
      </div>
      <div className="cert-bottom" />
      <div className="cert-code"><span>♟ ChessHost.app</span><span>{code}</span></div>
    </div>
  )
})
export default CertificateView
