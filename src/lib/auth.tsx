import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, setUnauthorizedHandler, tokenStore } from './api'
import type { Me, Role } from './types'

interface AuthState {
  user: Me | null
  loading: boolean
  signIn: (identifier: string, password: string) => Promise<Me>
  acceptSession: (token: string, user: Me) => void
  signOut: () => void
  refresh: () => Promise<void>
  can: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(Boolean(tokenStore.get()))

  const signOut = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    qc.clear()
  }, [qc])

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setLoading(false); return }
    try {
      setUser(await api.get<Me>('/auth/me'))
    } catch {
      signOut()
    } finally {
      setLoading(false)
    }
  }, [signOut])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    refresh()
  }, [refresh, signOut])

  const acceptSession = useCallback((token: string, me: Me) => {
    tokenStore.set(token)
    setUser(me)
  }, [])

  const signIn = useCallback(async (identifier: string, password: string) => {
    const r = await api.post<{ token: string; user: Me }>('/auth/login', { identifier, password })
    acceptSession(r.token, r.user)
    return r.user
  }, [acceptSession])

  const value = useMemo<AuthState>(() => ({
    user, loading, signIn, acceptSession, signOut, refresh,
    can: (...roles) => Boolean(user && roles.includes(user.role)),
  }), [user, loading, signIn, acceptSession, signOut, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
