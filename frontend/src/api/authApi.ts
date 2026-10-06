import { apiClient } from './client'
import { User } from '@/types'
import { mockCurrentUser } from '@/services/mock/mockData'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      return await apiClient<AuthResponse>('/auth/login', {
        method: 'POST',
        data: credentials,
      })
    } catch {
      // Mock Fallback when FastAPI backend is not running
      return {
        user: { ...mockCurrentUser, email: credentials.email },
        token: 'mock_jwt_aura_token_aiml_2026',
      }
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      return await apiClient<AuthResponse>('/auth/register', {
        method: 'POST',
        data,
      })
    } catch {
      // Mock Fallback when FastAPI backend is not running
      return {
        user: {
          ...mockCurrentUser,
          name: data.fullName,
          email: data.email,
        },
        token: 'mock_jwt_aura_token_aiml_2026',
      }
    }
  },

  getMe: async (): Promise<User> => {
    try {
      return await apiClient<User>('/auth/me', { method: 'GET' })
    } catch {
      return mockCurrentUser
    }
  },
}
