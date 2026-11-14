/** Small fetch wrapper: JSON in/out, bearer token, typed errors. */
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'https://church-backend-fv0c.onrender.com/api/v1'
const TOKEN_KEY = 'church.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: { field: string; message: string }[]
  constructor(status: number, message: string, code?: string, details?: ApiError['details']) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export interface Page<T> { items: T[]; meta: { page: number; limit: number; total: number; pages: number; sum?: number; [k: string]: unknown } }

type Query = Record<string, string | number | boolean | undefined | null>
const qs = (q?: Query) => {
  if (!q) return ''
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<{ data: T; meta?: Page<unknown>['meta'] }> {
  const token = tokenStore.get()
  let res: Response
  try {
    res = await fetch(`${BASE}${path}${qs(query)}`, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your internet connection and try again.")
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(res.status, json.message || `Request failed (${res.status})`, json.code, json.details)
  }
  return { data: json.data as T, meta: json.meta }
}

export const api = {
  get: async <T>(path: string, query?: Query) => (await request<T>('GET', path, undefined, query)).data,
  page: async <T>(path: string, query?: Query): Promise<Page<T>> => {
    const r = await request<T[]>('GET', path, undefined, query)
    return { items: r.data, meta: r.meta ?? { page: 1, limit: r.data.length, total: r.data.length, pages: 1 } }
  },
  post: async <T>(path: string, body?: unknown) => (await request<T>('POST', path, body ?? {})).data,
  put: async <T>(path: string, body?: unknown) => (await request<T>('PUT', path, body ?? {})).data,
  patch: async <T>(path: string, body?: unknown) => (await request<T>('PATCH', path, body ?? {})).data,
  del: async <T>(path: string) => (await request<T>('DELETE', path)).data,
  /** Download a file (e.g. CSV export) with the auth header. */
  download: async (path: string, filename: string, query?: Query) => {
    const res = await fetch(`${BASE}${path}${qs(query)}`, { headers: { Authorization: `Bearer ${tokenStore.get() ?? ''}` } })
    if (!res.ok) throw new ApiError(res.status, 'Download failed')
    const url = URL.createObjectURL(await res.blob())
    const a = Object.assign(document.createElement('a'), { href: url, download: filename })
    a.click()
    URL.revokeObjectURL(url)
  },
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')
export const fieldErrors = (e: unknown): Record<string, string> =>
  e instanceof ApiError && e.details ? Object.fromEntries(e.details.map((d) => [d.field, d.message])) : {}
