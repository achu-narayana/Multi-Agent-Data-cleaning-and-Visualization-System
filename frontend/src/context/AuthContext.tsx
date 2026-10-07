import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { User } from '@/types'
import { authApi, LoginRequest, RegisterRequest } from '@/api/authApi'
import { getAuthToken, setAuthToken, UNAUTHORIZED_EVENT } from '@/api/client'
import { AuthContext } from './useAuth'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start logged-out; a stored token only counts once GET /auth/me validates it.
  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState<boolean>(() => !!getAuthToken())
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const clearSession = useCallback(() => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }, [])

  // Validate a persisted token once on startup.
  useEffect(() => {
    const stored = getAuthToken()
    if (!stored) return

    let cancelled = false
    authApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        if (!cancelled) clearSession()
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false)
      })

    return () => {
      cancelled = true
    }
  }, [clearSession])

  // API client dispatches this on any 401 to an authenticated request.
  // Clearing the session makes ProtectedRoute redirect to /login.
  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [clearSession])

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(credentials)
      setAuthToken(res.token)
      setToken(res.token)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true)
    try {
      const res = await authApi.register(data)
      setAuthToken(res.token)
      setToken(res.token)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isInitializing,
      isLoading,
      login,
      register,
      logout: clearSession,
    }),
    [user, token, isInitializing, isLoading, login, register, clearSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
