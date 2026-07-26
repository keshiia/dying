import type { AuthUser } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export type ApiError = {
  status: number
  error: string
  requiredLevelId?: string
  requiredLevelTitle?: string
  requiredLevelOrderNo?: number
}

export function isApiError(e: unknown): e is ApiError {
  if (typeof e !== 'object' || e === null) return false
  const r = e as Record<string, unknown>
  return typeof r.status === 'number' && typeof r.error === 'string'
}

export function errorMessage(e: unknown) {
  if (isApiError(e)) {
    if (e.error === 'LEVEL_LOCKED') {
      const orderNo =
        typeof e.requiredLevelOrderNo === 'number'
          ? `第${e.requiredLevelOrderNo}关`
          : '上一关'
      const title = e.requiredLevelTitle ? `：${e.requiredLevelTitle}` : ''
      return `该关卡未解锁，请先完成${orderNo}${title}`
    }
    return e.error
  }
  if (e instanceof Error) return e.message
  return 'REQUEST_FAILED'
}

export function getToken() {
  return localStorage.getItem('lft_token')
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem('lft_token')
  else localStorage.setItem('lft_token', token)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  })

  const text = await r.text()
  const json = text ? JSON.parse(text) : null

  if (!r.ok) {
    throw {
      status: r.status,
      error: json?.error ?? 'REQUEST_FAILED',
      requiredLevelId: json?.requiredLevelId,
      requiredLevelTitle: json?.requiredLevelTitle,
      requiredLevelOrderNo: json?.requiredLevelOrderNo,
    } satisfies ApiError
  }

  return json as T
}

export async function apiGetMe(): Promise<AuthUser> {
  const data = await apiFetch<{ success: true; user: AuthUser }>('/api/auth/me')
  return data.user
}
