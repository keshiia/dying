import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

// error 原先缺失 —— 最需要提示的失败场景在这个体系里没有位置，
// 各处只能自己造内联的红色卡片。
type ToastType = 'success' | 'info' | 'warning' | 'error'

type Toast = {
  id: number
  type: ToastType
  message: string
}

type ToastCtx = {
  toast: (message: string, type?: ToastType) => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function useToast() {
  return useContext(Ctx)
}

const iconMap: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
}

const styleMap: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
}

const iconColorMap: Record<ToastType, string> = {
  success: 'text-emerald-500',
  info: 'text-sky-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
}

let nextId = 0

function ToastItem({ t, onRemove }: { t: Toast; onRemove: (id: number) => void }) {
  const [exiting, setExiting] = useState(false)

  // 错误留久一点：2.5 秒读不完一段失败原因
  const DURATION = t.type === 'error' ? 6000 : 2500

  useEffect(() => {
    let inner: number | undefined
    const timer = window.setTimeout(() => {
      setExiting(true)
      inner = window.setTimeout(() => onRemove(t.id), 300)
    }, DURATION)
    return () => {
      window.clearTimeout(timer)
      if (inner) window.clearTimeout(inner)
    }
  }, [t.id, onRemove, DURATION])

  const Icon = iconMap[t.type]

  return (
    <div
      className={clsx(
        'flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-lg text-sm font-semibold transition-all duration-300 min-w-[200px] max-w-[360px]',
        styleMap[t.type],
        exiting ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100',
      )}
    >
      <Icon className={clsx('h-4 w-4 shrink-0', iconColorMap[t.type])} />
      <span className="flex-1">{t.message}</span>
      <button
        type="button"
        onClick={() => {
          setExiting(true)
          setTimeout(() => onRemove(t.id), 300)
        }}
        className="shrink-0 text-current/40 hover:text-current/70 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId
    setToasts((prev) => [...prev.slice(-4), { id, type, message }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem t={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
