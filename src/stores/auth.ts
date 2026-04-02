import { create } from 'zustand'
import type { AuthUser, UserRole } from '@/types'
import { apiGetMe, setToken } from '@/utils/api'

type AuthState = {
  token: string | null
  user: AuthUser | null
  status: 'idle' | 'loading' | 'ready'
  setAuth: (token: string, user: AuthUser) => void
  clear: () => void
  bootstrap: () => Promise<void>
  isRole: (role: UserRole) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('lft_token'),
  user: null,
  status: 'idle',
  setAuth: (token, user) => {
    setToken(token)
    set({ token, user, status: 'ready' })
  },
  clear: () => {
    setToken(null)
    set({ token: null, user: null, status: 'ready' })
  },
  bootstrap: async () => {
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    const token = localStorage.getItem('lft_token')
    if (!token) {
      set({ token: null, user: null, status: 'ready' })
      return
    }
    try {
      const user = await apiGetMe()
      set({ token, user, status: 'ready' })
    } catch {
      setToken(null)
      set({ token: null, user: null, status: 'ready' })
    }
  },
  isRole: (role) => get().user?.role === role,
}))

