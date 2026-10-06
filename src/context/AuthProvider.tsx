import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, login as apiLogin } from '../api/auth'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import { tokenStorage } from '../api/tokenStorage'
import type { Usuario } from '../api/types'
import { AuthContext, type AuthStatus } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'loading' : 'anonymous'))

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    if (!tokenStorage.get()) return
    let cancelled = false
    fetchMe()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!cancelled) logout()
      })
    return () => {
      cancelled = true
    }
  }, [logout])

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const token = await apiLogin(email, password)
    tokenStorage.set(token)
    try {
      const me = await fetchMe()
      setUser(me)
      setStatus('authenticated')
    } catch (error) {
      tokenStorage.clear()
      throw error
    }
  }, [])

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}