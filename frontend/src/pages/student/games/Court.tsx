import { useNavigate } from 'react-router-dom'
import { ChevronRight, Gavel } from 'lucide-react'
import Card from '@/components/ui/Card'
import { courtCases } from '@/data/courtCases'

/**
 * 模拟法庭的案件列表。
 *
 * 游戏本体已经搬到 `/play/court/:caseId`（AppShell 之外的独立整页工作台），
 * 与案件侦查的分工一致：这里留在 Shell 内负责「选案件 + 进入」。
 */
export default function Court() {
  const navigate = useNavigate()

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-6 text-white shadow-lg shadow-sky-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⚖️</span>
          <div>
            <div className="text-xl font-black">模拟法庭</div>
            <div className="mt-1 text-sm text-white/80">当一回小法官，用法律知识裁决真实案件</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
          <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">互动判案</span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">学法用法</span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">+XP</span>
        </div>
      </div>

      <div className="text-sm font-extrabold text-zinc-800">选择案件</div>
      <div className="grid gap-4">
        {courtCases.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/play/court/${c.id}`)}
            className="group rounded-3xl border-2 border-zinc-200 bg-white overflow-hidden text-left transition-all hover:border-sky-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-4">
              <span className="text-3xl">{c.emoji}</span>
              <div>
                <div className="text-lg font-extrabold text-zinc-900 transition-colors group-hover:text-sky-700">
                  {c.title}
                </div>
                <div className="text-sm font-semibold text-zinc-500">{c.subtitle}</div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600">
                <Gavel className="h-4 w-4 text-sky-500" />6 个阶段 · {c.result.xpReward} XP
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 transition-transform group-hover:translate-x-1">
                开始审理
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {courtCases.length === 0 && (
        <Card className="p-8 text-center">
          <span className="text-5xl">⚖️</span>
          <div className="mt-3 text-base font-extrabold text-zinc-900">案件正在准备中</div>
          <div className="mt-1 text-sm text-zinc-500">敬请期待模拟法庭上线</div>
        </Card>
      )}
    </div>
  )
}
