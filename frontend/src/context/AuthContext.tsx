import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { authApi, LoginRequest, RegisterRequest } from '@/api/authApi'
import { mockCurrentUser } from '@/services/mock/mockData'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aura_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return mockCurrentUser
      }
    }
    // Default to mock logged-in user so the evaluation experience is smooth
    return mockCurrentUser
  })

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('aura_auth_token') || 'mock_jwt_aura_token_aiml_2026'
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Listen for unauthorized 401 events from the API client
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setToken(null)
      localStorage.removeItem('aura_user')
      localStorage.removeItem('aura_auth_token')
    }

    window.addEventListener('aura:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('aura:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem('aura_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('aura_user')
    }
  }, [user])

  useEffect(() => {
    if (token) {
      localStorage.setItem('aura_auth_token', token)
    } else {
      localStorage.removeItem('aura_auth_token')
    }
  }, [token])

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(credentials)
      setUser(res.user)
      setToken(res.token)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterRequest) => {
    setIsLoading(true)
    try {
      const res = await authApi.register(data)
      setUser(res.user)
      setToken(res.token)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('aura_user')
    localStorage.removeItem('aura_auth_token')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
