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

// 后端错误码 → 用户可见中文。与 backend/api/routes 中 res.json({ error }) 的取值一一对应，
// 新增错误码时两处都要加，后端没有统一的错误常量表。
const ERROR_MESSAGES: Record<string, string> = {
  BAD_REQUEST: '提交的信息有误，请检查后重试',
  INVALID_CREDENTIALS: '邮箱或密码不正确，请重新输入',
  UNAUTHORIZED: '登录状态已失效，请重新登录',
  FORBIDDEN: '你没有权限进行该操作',
  EMAIL_EXISTS: '该邮箱已被注册，请直接登录或更换邮箱',
  TEACHER_REGISTER_DISABLED: '教师账号暂不开放自主注册，请联系管理员',
  CLASS_NOT_FOUND: '班级不存在，请确认加入码是否正确',
  ALREADY_IN_CLASS: '你已加入了一个班级，请先退出当前班级',
  LEVEL_NOT_FOUND: '关卡不存在',
  TASK_NOT_FOUND: '任务不存在或已被删除',
  NOT_FOUND: '内容不存在或已被删除',
  AI_UPSTREAM_ERROR: 'AI 服务暂时不可用，请稍后重试',
  REQUEST_FAILED: '请求失败，请稍后重试',
  NETWORK_ERROR: '网络连接失败，请检查网络后重试',
  SERVER_ERROR: '服务器开小差了，请稍后重试',
  'Server internal error': '服务器开小差了，请稍后重试',
  'API not found': '接口不存在，请检查版本是否为最新',
}

const FALLBACK_MESSAGE = '操作失败，请稍后重试'

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
    return ERROR_MESSAGES[e.error] ?? FALLBACK_MESSAGE
  }
  if (e instanceof Error) return FALLBACK_MESSAGE
  return FALLBACK_MESSAGE
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

  let r: Response
  try {
    r = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
    })
  } catch {
    // fetch 在网络层失败时抛 TypeError('Failed to fetch')，得转成统一形状
    throw { status: 0, error: 'NETWORK_ERROR' } satisfies ApiError
  }

  const text = await r.text()
  let json: (Partial<ApiError> & Record<string, unknown>) | null = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // 后端挂掉时 nginx 会返回 HTML 错误页，这里不能让它以 SyntaxError 冒到界面
    json = null
  }

  if (!r.ok) {
    throw {
      status: r.status,
      error: json?.error ?? (r.status >= 500 ? 'SERVER_ERROR' : 'REQUEST_FAILED'),
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
