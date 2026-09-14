import { useNavigate } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { detectiveCases } from '@/data/detectiveCases'

/**
 * 案件侦查的案件列表。
 *
 * 游戏本体已经搬到 `/play/detective/:caseId`（AppShell 之外的独立整页工作台）。
 * 这里留在 Shell 内，负责「选案件 + 进入」。和漫画学法的分工一样。
 */
export default function Detective() {
  const navigate = useNavigate()

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-6 text-white shadow-lg shadow-sky-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🕵️</span>
          <div>
            <div className="text-xl font-black">案件侦查</div>
            <div className="mt-1 text-sm text-white/80">搜集线索、推理真相，做一名少年侦探！</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
          <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">自由搜证</span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">询问证人</span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">+XP</span>
        </div>
      </div>

      <div className="text-sm font-extrabold text-zinc-800">选择案件</div>
      <div className="grid gap-4">
        {detectiveCases.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/play/detective/${c.id}`)}
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
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
                <Search className="h-4 w-4 text-sky-500" />
                <span>
                  {c.scenes.length} 个场景 · {c.difficulty}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 transition-transform group-hover:translate-x-1">
                开始侦查
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
