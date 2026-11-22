import type { Result, Tournament } from './types'
import { totalRoundsFor } from './pairing'

export const FORMAT_LABEL = { swiss: 'Swiss', round_robin: 'Round Robin', knockout: 'Knockout' } as const
export const SPEED_LABEL = { blitz: 'Blitz', rapid: 'Rapid', social: 'Social' } as const

export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('') || '?'

const PALETTE = [
  ['#E2F3E8', '#277A4B'],
  ['#FCEED7', '#956C1B'],
  ['#E8EAFB', '#5C63A5'],
  ['#FBE7E7', '#A74D4D'],
]
export const avatarStyle = (i: number) => ({ background: PALETTE[i % 4][0], color: PALETTE[i % 4][1] })

const d = (s: string) => new Date(s + 'T00:00:00')
export const fmtDateShort = (s: string) =>
  d(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
export const fmtDateMed = (s: string) => d(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtDateLong = (s: string) => d(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
export const fmtDateWeekday = (s: string) => d(s).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

export const clockLabel = (t: Pick<Tournament, 'clock_minutes'>) => (t.clock_minutes ? `${t.clock_minutes} min` : 'No clock')
export const boardClock = (t: Pick<Tournament, 'clock_minutes'>) =>
  t.clock_minutes ? `${String(t.clock_minutes).padStart(2, '0')}:00` : '--:--'

export const roundsFor = (t: Tournament, nPlayers: number) => totalRoundsFor(t.format, nPlayers, t.total_rounds)

export function playTimeLabel(t: Tournament, nPlayers: number) {
  const mins = roundsFor(t, nPlayers) * ((t.clock_minutes ?? 10) * 2 + 5)
  return mins >= 60 ? `~${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}` : `~${mins}m`
}

export const resultText = (r: Result | null) => (r === '1-0' ? '1 — 0' : r === '0-1' ? '0 — 1' : r ? '½ — ½' : '')

export function friendlyError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e)
  if (m.includes('FREE_LIMIT_EVENTS')) return 'The Free plan includes 1 event per month. Upgrade to Pro to host without limits.'
  if (m.includes('FREE_LIMIT_PLAYERS')) return 'The Free plan allows up to 12 players per event. Upgrade to Pro for unlimited players.'
  if (m.includes('Invalid login credentials')) return 'Wrong email or password.'
  return m
}

export const appUrl = () => window.location.origin + import.meta.env.BASE_URL
export const joinUrl = (slug: string) => `${appUrl()}join/${slug}`
export const tvUrl = (slug: string) => `${appUrl()}tv/${slug}`
export const liveUrl = (slug: string) => `${appUrl()}live/${slug}`
