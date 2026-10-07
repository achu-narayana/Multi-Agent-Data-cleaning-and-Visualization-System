import { createContext, useContext } from 'react'
import { User } from '@/types'
import { LoginRequest, RegisterRequest } from '@/api/authApi'

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  /** True while a stored token is being validated via GET /auth/me on startup. */
  isInitializing: boolean
  /** True while a login / register request is in flight. */
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
