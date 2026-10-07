import { apiClient } from './client'
import { User } from '@/types'

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
  login: (credentials: LoginRequest): Promise<AuthResponse> =>
    apiClient<AuthResponse>('/auth/login', { method: 'POST', data: credentials }),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient<AuthResponse>('/auth/register', { method: 'POST', data }),

  getMe: (): Promise<User> => apiClient<User>('/auth/me', { method: 'GET' }),
}
