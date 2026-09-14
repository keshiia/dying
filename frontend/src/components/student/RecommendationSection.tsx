/**
 * 个性化推荐区域组件
 * 显示智能推荐的学习内容
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Sparkles, ArrowRight, BookOpen, RotateCcw, Gamepad2, BookMarked } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { apiFetch } from '@/utils/api'
import type { Recommendation } from '@/types'

type Props = {
  className?: string
  onStartLevel?: (levelId: string, title: string, xpReward: number) => void
}

const TYPE_META: Record<string, { icon: typeof Sparkles; label: string; color: string }> = {
  LEVEL: { icon: BookOpen, label: '关卡推荐', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  REVIEW: { icon: RotateCcw, label: '需要复习', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  RESOURCE: { icon: BookMarked, label: '资源推荐', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMIC: { icon: BookMarked, label: '漫画推荐', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  GAME: { icon: Gamepad2, label: '游戏推荐', color: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export default function RecommendationSection({ className, onStartLevel }: Props) {
  const navigate = useNavigate()
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const data = await apiFetch<{ success: true; recommendations: Recommendation[] }>('/api/student/recommendations')
      setRecs(data.recommendations)
    } catch {
      // 原来是 `catch { // ignore }` + 下面 `if (recs.length === 0) return null`：
      // 请求失败时整块「智能推荐」直接消失，学生以为功能被砍了。
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className={clsx('grid gap-2 animate-pulse', className)}>
        <div className="h-5 w-36 bg-zinc-100 rounded-full" />
        <div className="h-20 bg-zinc-100 rounded-2xl" />
        <div className="h-20 bg-zinc-100 rounded-2xl" />
      </div>
    )
  }

  if (failed && recs.length === 0) {
    return (
      <div className={clsx('rounded-2xl border border-red-100 bg-red-50 px-4 py-3', className)}>
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm text-red-700">
          <span>智能推荐加载失败</span>
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  if (recs.length === 0) return null

  function handleClick(rec: Recommendation) {
    if (rec.type === 'LEVEL' && rec.targetId && onStartLevel) {
      onStartLevel(rec.targetId, rec.title, rec.xpReward ?? 10)
    } else if (rec.type === 'LEVEL' && !rec.targetId) {
      // "每日一题"等无具体关卡的目标 → 跳转学习页
      navigate('/app/learn')
    } else if (rec.type === 'REVIEW') {
      navigate('/app/tasks')
    } else if (rec.type === 'RESOURCE') {
      navigate('/app/resources')
    } else if (rec.type === 'COMIC') {
      // 直接进具体篇目。原先只跳列表页 —— 推荐说「建议阅读网络诈骗漫画」，
      // 点进去是一个列表要学生自己找，说服力就损失在这一步。
      if (rec.targetId) navigate(`/play/comics/${rec.targetId}`)
      else navigate('/app/comics')
    } else if (rec.type === 'GAME') {
      // 推荐引擎给的是游戏名（'court' | 'detective'），落到对应案件的列表页。
      // 原来两样都硬编码跳 /app/games/court，侦查的推荐会把人送错地方。
      navigate(rec.targetId === 'detective' ? '/app/games/detective' : '/app/games/court')
    }
  }

  return (
    <div className={clsx(className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-sky-500" />
        <span className="text-sm font-extrabold text-zinc-900">智能推荐</span>
        <span className="text-[11px] text-zinc-400">基于你的学习数据</span>
      </div>

      <div className="grid gap-2">
        {recs.map((rec, i) => {
          const meta = TYPE_META[rec.type] ?? TYPE_META.LEVEL
          const Icon = meta.icon
          return (
            <button
              key={`${rec.type}-${rec.targetId}-${i}`}
              type="button"
              onClick={() => handleClick(rec)}
              className="w-full text-left rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm hover:border-sky-200 hover:bg-sky-50/40 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className={clsx(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition-colors',
                  meta.color,
                  'group-hover:scale-105',
                )}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 truncate">{rec.title}</span>
                    <Tag color={
                      rec.urgency === 'high' ? 'red' : rec.urgency === 'medium' ? 'orange' : 'zinc'
                    }>
                      {rec.urgency === 'high' ? '优先' : rec.urgency === 'medium' ? '推荐' : '可选'}
                    </Tag>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{rec.reason}</div>
                  {rec.xpReward && (
                    <div className="mt-1 text-[11px] font-semibold text-sky-600">+{rec.xpReward} XP</div>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300 shrink-0 mt-2 group-hover:text-sky-500 transition-colors" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
