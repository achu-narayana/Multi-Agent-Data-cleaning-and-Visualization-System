/**
 * Single source of truth for talking to the FastAPI backend.
 *
 * - Attaches `Authorization: Bearer <token>` from localStorage when present.
 * - Dispatches `aura:unauthorized` on 401 responses to authenticated requests
 *   (AuthContext listens for it and logs the user out).
 * - Normalises FastAPI error payloads (`{detail: string}` or 422 `{detail: [{msg}]}`).
 * - Never calls `response.json()` on empty / non-JSON bodies (e.g. 204).
 */

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

export const AUTH_TOKEN_KEY = 'aura_auth_token'
export const UNAUTHORIZED_EVENT = 'aura:unauthorized'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError

export const isNotFound = (error: unknown): boolean => isApiError(error) && error.status === 404

/** Human readable message for any thrown value. */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong.'): string => {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export const setAuthToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
    else localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // Storage unavailable (private mode etc.) - session will not persist.
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON-serialisable payload, or FormData for multipart uploads. */
  data?: unknown
  body?: BodyInit | null
}

const buildUrl = (endpoint: string): string =>
  `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

const extractDetail = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const detail = record.detail

  if (typeof detail === 'string' && detail.trim()) return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg)
        }
        return null
      })
      .filter((msg): msg is string => !!msg)
    if (messages.length > 0) return messages.join('; ')
  }

  if (typeof record.message === 'string' && record.message.trim()) return record.message
  return null
}

const isJsonResponse = (response: Response): boolean =>
  (response.headers.get('content-type') || '').toLowerCase().includes('application/json')

const readErrorMessage = async (response: Response): Promise<string> => {
  const fallback = `Request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`
  try {
    const text = await response.text()
    if (!text) return fallback
    if (isJsonResponse(response)) {
      return extractDetail(JSON.parse(text)) || fallback
    }
    return text.length < 300 ? text : fallback
  } catch {
    return fallback
  }
}

/** Low-level request: returns the raw Response when `ok`, throws ApiError otherwise. */
export async function apiRequest(endpoint: string, options: RequestOptions = {}): Promise<Response> {
  const { data, headers: rawHeaders, body: rawBody, ...rest } = options
  const headers = new Headers(rawHeaders)

  let body: BodyInit | null | undefined = rawBody
  if (data instanceof FormData) {
    body = data
  } else if (data !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(data)
  }

  const token = getAuthToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(endpoint), { ...rest, headers, body })
  } catch {
    throw new ApiError(
      `Cannot reach the AURA API at ${API_BASE_URL}. Make sure the backend server is running.`,
      0
    )
  }

  if (!response.ok) {
    const message = await readErrorMessage(response)
    // Only a 401 on a request that carried a token means the session is invalid.
    // A 401 from POST /auth/login (wrong password) must just surface the message.
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(message, response.status)
  }

  return response
}

/** JSON request helper. Resolves to `undefined` for empty / non-JSON bodies. */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const response = await apiRequest(endpoint, options)

  if (response.status === 204 || !isJsonResponse(response)) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

/** Fetches a binary/text resource (with auth) as a Blob. */
export async function apiDownload(endpoint: string): Promise<Blob> {
  const response = await apiRequest(endpoint, { method: 'GET' })
  return await response.blob()
}
