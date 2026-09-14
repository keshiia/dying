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
 * 三个刻意的设计：
 *
 * 1. **默认折叠。** 结算是「案件告破！」的庆祝时刻，紧跟一张念检讨的卡片会
 *    毁掉情绪。折成一行 —— 想被诊断的人自己会点开，不想看的人不被打扰。
 * 2. **不打断。** 不用弹窗，不做自动展开的动画。它就在结算内容的下方安静地待着。
 * 3. **两种色调。** 侦查工作台是暗色整页，模拟法庭还是浅色卡片流（P1 才统一），
 *    同一张卡要在两种底色上都成立。
 */

export type InterventionFinding = {
  axis: string
  /**
   * - SINGLE      本局这条轴没达标
   * - PATTERN     不是「这条没找到」，而是「这一类你都没查」
   * - REPEATED    同一条轴最近几局反复不达标（不是偶然）
   * - STRENGTH    全对。只报忧是失败的产品，有强项必须先肯定
   */
  kind: 'SINGLE' | 'PATTERN' | 'REPEATED' | 'STRENGTH'
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
  /** 'RULE' = 模板文案（结论由学习数据直接算出）；'LLM' = 模型改写过的措辞 */
  generatedBy: 'RULE' | 'LLM'
}

/** 按发现类型给颜色。暗色底用半透明填充，浅色底用实心淡色 */
function findingTone(kind: InterventionFinding['kind'], tone: 'light' | 'dark') {
  if (tone === 'dark') {
    if (kind === 'STRENGTH') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
    if (kind === 'SINGLE') return 'border-sky-400/30 bg-sky-500/10 text-sky-100'
    return 'border-amber-400/30 bg-amber-500/10 text-amber-100'
  }
  if (kind === 'STRENGTH') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (kind === 'SINGLE') return 'border-sky-200 bg-sky-50 text-sky-900'
  return 'border-amber-200 bg-amber-50 text-amber-900'
}

export default function InterventionCard({
  data,
  tone = 'light',
}: {
  data: Intervention | null
  tone?: 'light' | 'dark'
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!data || (data.findings.length === 0 && data.recommendations.length === 0)) return null

  const dark = tone === 'dark'

  return (
    <div
      className={clsx(
        // min-h-fit 是防御：overflow-hidden 会让 grid item 的自动最小尺寸
        // （min-height: auto）解析为 0。放进「固定高度的 grid」里时，整行会被压到
        // 只剩两条边框，内容被自己裁掉。结算页的容器已经改成外层滚动（见
        // DetectiveWorkbench 的 ScrollPane），这里再兜一层，免得以后被挪进别的 grid。
        'min-h-fit overflow-hidden rounded-3xl border shadow-sm',
        dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={clsx(
          'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
          dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50',
        )}
      >
        <AgentAvatar size="md" />
        <div className="min-w-0 flex-1">
          <div className={clsx('text-xs font-bold', dark ? 'text-white/40' : 'text-slate-400')}>
            {AGENT_NAME}复盘
          </div>
          <div
            className={clsx(
              'truncate text-sm font-extrabold',
              dark ? 'text-white/90' : 'text-slate-800',
            )}
          >
            {data.headline}
          </div>
        </div>
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 transition-transform',
            dark ? 'text-white/40' : 'text-slate-400',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          className={clsx(
            'grid gap-3 border-t px-4 py-4',
            dark ? 'border-white/10' : 'border-slate-100',
          )}
        >
          <ul className="grid gap-2">
            {data.findings.map((f, i) => (
              <li
                key={`${f.axis}-${i}`}
                className={clsx(
                  'rounded-2xl border px-3.5 py-3 text-sm leading-relaxed',
                  findingTone(f.kind, tone),
                )}
              >
                <div className="flex items-start gap-2">
                  {f.kind === 'STRENGTH' ? (
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
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
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors',
                    dark
                      ? 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={clsx(
                        'text-sm font-extrabold',
                        dark ? 'text-white/90' : 'text-slate-800',
                      )}
                    >
                      {r.label}
                    </div>
                    <div className={clsx('mt-0.5 text-xs', dark ? 'text-white/50' : 'text-slate-500')}>
                      {r.reason}
                    </div>
                  </div>
                  <ChevronRight
                    className={clsx('h-4 w-4 shrink-0', dark ? 'text-white/40' : 'text-slate-400')}
                  />
                </button>
              ))}
            </div>
          )}

          {data.generatedBy === 'RULE' && (
            <div className={clsx('text-[11px]', dark ? 'text-white/35' : 'text-slate-400')}>
              结论由学习数据直接算出，未经模型改写 —— 每个判断都能指回具体是哪条线索。
            </div>
          )}
        </div>
      )}
    </div>
  )
}
