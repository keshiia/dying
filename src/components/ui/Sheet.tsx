import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import Button from './Button'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  side?: 'left' | 'right'
  className?: string
}

export default function Sheet({ open, title, onClose, children, side = 'left', className }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={clsx('absolute inset-y-0 w-[88vw] max-w-sm bg-white shadow-xl border border-zinc-100', side === 'left' ? 'left-0' : 'right-0', className)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="text-sm font-semibold text-zinc-900">{title ?? ''}</div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="关闭">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[calc(100vh-64px)] overflow-auto p-5">{children}</div>
      </div>
    </div>
  )
}

