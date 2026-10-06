const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface RequestOptions extends RequestInit {
  data?: any
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  let body: BodyInit | null | undefined = options.body

  if (options.data instanceof FormData) {
    body = options.data
  } else if (options.data !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.data)
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      throw new Error(
        errorData.detail ||
        errorData.message ||
        `API Error: ${response.status} ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error: any) {
    console.error(
      `[AURA API] Request failed: ${endpoint}`,
      error.message
    )

    throw error
  }
}