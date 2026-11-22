import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isConfigured, supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthCtx {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isConfigured)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  const refreshProfile = useCallback(async () => {
    if (!userId) return setProfile(null)
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [userId])

  useEffect(() => { refreshProfile() }, [refreshProfile])

  const signOut = async () => { await supabase.auth.signOut() }

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, profile, loading, refreshProfile, signOut }}>
      {children}
    </Ctx.Provider>
  )
}
