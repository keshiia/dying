import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Sparkles, TriangleAlert } from 'lucide-react'
import { clsx } from 'clsx'
import AgentAvatar, { AGENT_NAME } from '@/components/student/AgentAvatar'

/**
 * 结算页的智能体复盘卡。
 *
 * 服务端（agentDiagnosis.ts）已经把结论算好了，这里只负责渲染。
 *
 * 两个刻意的设计：
 *
 * 1. **默认折叠。** 结算是「案件告破！」的庆祝时刻，紧跟一张念检讨的卡片会
 *    毁掉情绪。折成一行 —— 想被诊断的人自己会点开，不想看的人不被打扰。
 * 2. **不打断。** 不用弹窗，不做自动展开的动画。它就在结算内容的下方安静地待着。
 */

export type InterventionFinding = {
  axis: string
  kind: 'SINGLE' | 'PATTERN' | 'CROSS_MODULE' | 'STRENGTH'
  text: string
  evidence: string
  crossCase?: string
}

export type InterventionRecommendation = {
  kind: 'COMIC' | 'COURT' | 'DETECTIVE'
  targetId: string
  label: string
  reason: string
  to: string
}

export type Intervention = {
  agent: string
  headline: string
  findings: InterventionFinding[]
  recommendations: InterventionRecommendation[]
  generatedBy: 'RULE' | 'LLM'
}

export default function InterventionCard({ data }: { data: Intervention | null }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!data || (data.findings.length === 0 && data.recommendations.length === 0)) return null

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
      >
        <AgentAvatar size="md" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-400">{AGENT_NAME}复盘</div>
          <div className="truncate text-sm font-extrabold text-slate-800">{data.headline}</div>
        </div>
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="grid gap-3 border-t border-slate-100 px-4 py-4">
          <ul className="grid gap-2">
            {data.findings.map((f, i) => (
              <li
                key={`${f.axis}-${i}`}
                className={clsx(
                  'rounded-2xl border px-3.5 py-3 text-sm leading-relaxed',
                  f.kind === 'STRENGTH'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : f.kind === 'SINGLE'
                      ? 'border-sky-200 bg-sky-50 text-sky-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900',
                )}
              >
                <div className="flex items-start gap-2">
                  {f.kind === 'STRENGTH' ? (
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold">{f.text}</div>
                    {f.evidence && <div className="mt-1 text-xs opacity-80">{f.evidence}</div>}
                    {f.crossCase && (
                      <div className="mt-1 text-xs font-semibold opacity-90">{f.crossCase}</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {data.recommendations.length > 0 && (
            <div className="grid gap-2">
              {data.recommendations.map((r) => (
                <button
                  key={`${r.kind}-${r.targetId}`}
                  type="button"
                  onClick={() => navigate(r.to)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-slate-800">{r.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{r.reason}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {data.generatedBy === 'RULE' && (
            <div className="text-[11px] text-slate-400">
              结论由学习数据直接算出，未经模型改写 —— 每个判断都能指回具体是哪条线索。
            </div>
          )}
        </div>
      )}
    </div>
  )
}
