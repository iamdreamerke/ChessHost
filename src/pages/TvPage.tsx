import Icon from '../components/Icon'
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TvStage from '../components/TvStage'
import { useTournament } from '../hooks/useTournament'
import { supabase } from '../lib/supabase'
import { tvUrl } from '../lib/utils'
import type { TvTheme } from '../lib/types'

const THEMES: { id: TvTheme; label: string; hint: string }[] = [
  { id: 'casual', label: 'Casual', hint: 'Quiet and minimal' },
  { id: 'esports', label: 'Esports', hint: 'Bold, red accent' },
  { id: 'kids', label: 'Kids', hint: 'Bright and playful' },
]

export default function TvPage() {
  const { id } = useParams()
  const { tournament: t, players, games, loading, notFound, reload } = useTournament({ id })
  const stage = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  if (loading) return <div className="spinner">Loading…</div>
  if (notFound || !t) return <div className="notice">Tournament not found. <Link to="/tournaments">Back</Link></div>

  async function setTheme(theme: TvTheme) {
    await supabase.from('tournaments').update({ tv_theme: theme }).eq('id', t!.id)
    reload()
  }
  async function copy() {
    try { await navigator.clipboard.writeText(tvUrl(t!.slug)) } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">PUBLIC EVENT SCREEN</div>
          <h1>TV display</h1>
          <p className="sub">A live view for your TV, projector or big screen. Updates automatically as results come in.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={copy}>{copied ? 'Link copied' : <><Icon name="copy" size={14} /> Copy TV link</>}</button>
          <a className="btn btn-outline" href={tvUrl(t.slug)} target="_blank" rel="noreferrer"><Icon name="external" size={14} /> Open in new tab</a>
          <button className="btn btn-primary" onClick={() => stage.current?.requestFullscreen?.()}><Icon name="maximize" size={14} /> Full screen</button>
        </div>
      </div>

      <TvStage ref={stage} tournament={t} players={players} games={games} />

      <div className="section-head"><h2>Display style</h2><span>Choose the look for your venue</span></div>
      <div className="theme-grid">
        {THEMES.map((th) => (
          <button key={th.id} className={'theme-card' + (t.tv_theme === th.id ? ' selected' : '')} onClick={() => setTheme(th.id)}>
            <span className="theme-thumb" data-t={th.id} />
            <b>{th.label}</b><small>{th.hint}</small>
          </button>
        ))}
      </div>
    </>
  )
}
