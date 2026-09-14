import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { clsx } from 'clsx'
import type { ClueType, DetectiveScene } from '@/data/detectiveCases'

/**
 * 证据墙。
 *
 * 这是「不再是简单的小窗形式」这句话的真正落点。
 *
 * 改造前：点热点 → 弹出一个居中模态框 → 看完关掉 → 什么都没有了。线索是一次性的。
 * 改造后：线索**飞进墙上成为一张卡片并永久留在那里**，未发现的位置是一个看得见的
 * 空卡槽。侦查的成就感全在这个累积感上，而原来的实现把它整个丢掉了。
 *
 * 详情就地展开，不再有第二层窗口 —— 模态框是「看一眼就消失」，证据墙是
 * 「我攒下来的东西」。
 *
 * 附带的教学价值在筛选器上：学生能一眼看到「我收集的全是物证，一条电子证据都
 * 没有」。这正是诊断引擎里「类型盲区」规则要说的东西 —— 先让学生自己看见，
 * 再由智能体说出来。
 */

const TYPE_LABEL: Record<ClueType, string> = {
  physical: '物证',
  digital: '电子',
  testimony: '证言',
  observation: '观察',
}

const TYPE_ORDER: ClueType[] = ['physical', 'digital', 'testimony', 'observation']

export default function EvidenceWall({
  scenes,
  foundClues,
  onQuizAxisHint,
}: {
  scenes: DetectiveScene[]
  foundClues: string[]
  /** 墙上凑齐某类证据时的轻度提示，用于引导观察 —— 可选 */
  onQuizAxisHint?: (type: ClueType) => void
}) {
  const [filter, setFilter] = useState<ClueType | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const all = scenes.flatMap((s) => s.hotspots)

  const countOf = (t: ClueType) => ({
    found: all.filter((h) => h.type === t && foundClues.includes(h.id)).length,
    total: all.filter((h) => h.type === t).length,
  })
  const foundTotal = all.filter((h) => foundClues.includes(h.id)).length

  const visible = all.filter((h) => filter === 'all' || h.type === filter)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <div className="text-xs font-extrabold uppercase tracking-wide text-white/40">证据墙</div>
        <div className="text-[11px] font-bold text-white/50">
          {foundTotal}/{all.length}
        </div>
      </div>

      {/* 类型筛选 */}
      <div className="flex flex-wrap gap-1.5 px-1 pb-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          全部
        </FilterChip>
        {TYPE_ORDER.map((t) => {
          const c = countOf(t)
          return (
            <FilterChip
              key={t}
              active={filter === t}
              dim={c.total === 0}
              onClick={() => {
                setFilter(t)
                if (c.found === 0) onQuizAxisHint?.(t)
              }}
            >
              {TYPE_LABEL[t]} {c.found}/{c.total}
            </FilterChip>
          )
        })}
      </div>

      {/* 卡片 */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-1">
        {visible.map((h) => {
          const found = foundClues.includes(h.id)
          const expanded = expandedId === h.id
          if (!found) {
            return (
              <div
                key={h.id}
                className="flex items-center gap-2 rounded-2xl border border-dashed border-white/10 px-3 py-2.5"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-sm text-white/25">
                  ?
                </span>
                <span className="text-xs font-semibold text-white/25">未发现</span>
                <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/25">
                  {TYPE_LABEL[h.type]}
                </span>
              </div>
            )
          }
          return (
            <div
              key={h.id}
              className={clsx(
                'overflow-hidden rounded-2xl border transition-colors',
                expanded ? 'border-sky-400/40 bg-sky-500/10' : 'border-white/10 bg-white/[0.04]',
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : h.id)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03]"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-base">
                  {h.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-bold text-white/90">
                  {h.content.title}
                </span>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/50">
                  {TYPE_LABEL[h.type]}
                </span>
              </button>

              {expanded && (
                <div className="grid gap-2 border-t border-white/10 px-3 py-3">
                  <p className="text-xs leading-relaxed text-white/75">{h.content.detail}</p>
                  {h.content.insight && (
                    <div className="flex items-start gap-2 rounded-xl bg-sky-500/10 px-3 py-2 ring-1 ring-sky-400/25">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
                      <div>
                        <div className="text-[10px] font-bold text-sky-300">🔎 推理提示</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-white/80">
                          {h.content.insight}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  dim,
  onClick,
  children,
}: {
  active: boolean
  dim?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
        active
          ? 'bg-sky-500 text-white'
          : dim
            ? 'bg-white/5 text-white/25'
            : 'bg-white/10 text-white/60 hover:bg-white/15',
      )}
    >
      {children}
    </button>
  )
}
