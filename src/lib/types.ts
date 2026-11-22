export type Format = 'swiss' | 'round_robin' | 'knockout'
export type Speed = 'blitz' | 'rapid' | 'social'
export type Status = 'draft' | 'live' | 'finished'
export type Result = '1-0' | '0-1' | '1/2-1/2'
export type TvTheme = 'casual' | 'esports' | 'kids'

export interface Profile {
  id: string
  full_name: string
  email: string | null
  plan: 'free' | 'pro'
}

export interface Member {
  id: string
  owner_id: string
  name: string
  email: string | null
  created_at: string
}

export interface Tournament {
  id: string
  owner_id: string
  name: string
  format: Format
  speed: Speed
  clock_minutes: number | null
  event_date: string
  status: Status
  current_round: number
  total_rounds: number
  slug: string
  registration_open: boolean
  tv_theme: TvTheme
  created_at: string
}

export interface Player {
  id: string
  tournament_id: string
  member_id: string | null
  name: string
  created_at: string
}

export interface Game {
  id: string
  tournament_id: string
  round: number
  board: number
  white_id: string
  black_id: string | null
  result: Result | null
}
