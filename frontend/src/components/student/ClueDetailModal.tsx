import { useEffect } from 'react'
import { Lightbulb } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { DetectiveHotspot } from '@/data/detectiveCases'

type Props = {
  clue: DetectiveHotspot | null
  onClose: () => void
}

/**
 * 案件侦查的线索详情弹窗。
 *
 * 这段 JSX 原先只写在 Detective.tsx 最末尾的兜底 return 里，而四个阶段
 * （briefing / investigation / deduction / result）各有自己的提前 return，
 * 那个兜底分支永远走不到 —— 结果是玩家点开线索后，「线索正文」和
 * 「🔎 推理提示」永远显示不出来，而推理答案就藏在提示里。
 *
 * 抽成独立组件后，在 investigation 分支内渲染即可。
 */
export default function ClueDetailModal({ clue, onClose }: Props) {
  useEffect(() => {
    if (!clue) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clue, onClose])

  if (!clue) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={clue.content.title}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[var(--p-primary)] to-[var(--p-primary-dark)] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{clue.emoji}</span>
              <span className="text-base font-extrabold">{clue.content.title}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="grid gap-3 p-5">
          <div className="text-sm leading-relaxed text-zinc-700">{clue.content.detail}</div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <div>
                <div className="text-xs font-bold text-sky-800">🔎 推理提示</div>
                <div className="mt-1 text-xs text-zinc-700">{clue.content.insight}</div>
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="w-full">
            收起
          </Button>
        </div>
      </div>
    </div>
  )
}
