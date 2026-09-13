/**
 * 本周学习目标卡片
 */
import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { Target, CheckCircle2, Circle, Sparkles } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { apiFetch } from '@/utils/api'
import type { StudentGoal } from '@/types'

type Props = {
  className?: string
}

export default function GoalCard({ className }: Props) {
  const [goals, setGoals] = useState<StudentGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const data = await apiFetch<{ success: true; goals: StudentGoal[] }>('/api/student/goals')
      if (data.goals.length === 0) {
        // 没有目标则生成
        await apiFetch('/api/student/goals/generate', { method: 'POST' })
        const retry = await apiFetch<{ success: true; goals: StudentGoal[] }>('/api/student/goals')
        setGoals(retry.goals)
      } else {
        setGoals(data.goals)
      }
    } catch {
      // 原来是 `catch { // ignore }` + 下面 `if (goals.length === 0) return null`：
      // 请求失败时整张「本周学习目标」卡片直接消失，学生以为功能被砍了。
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
      <Card className={clsx('p-4 animate-pulse', className)}>
        <div className="h-5 w-28 bg-zinc-100 rounded-full" />
        <div className="mt-3 space-y-2">
          <div className="h-16 bg-zinc-100 rounded-2xl" />
          <div className="h-16 bg-zinc-100 rounded-2xl" />
        </div>
      </Card>
    )
  }

  if (failed && goals.length === 0) {
    return (
      <Card className={clsx('p-4 border-red-100 bg-red-50', className)}>
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm text-red-700">
          <span>本周目标加载失败</span>
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            重试
          </Button>
        </div>
      </Card>
    )
  }

  if (goals.length === 0) return null

  return (
    <Card className={clsx('p-4 border-sky-100/80', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white">
          <Target className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-extrabold text-zinc-900">本周学习目标</div>
          <div className="text-[11px] text-zinc-500">个性化推荐 · 每周自动更新</div>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); void load() }}
          className="ml-auto text-xs font-semibold text-sky-600 hover:text-sky-700"
        >
          刷新
        </button>
      </div>

      <div className="grid gap-2">
        {goals.map((goal) => {
          const pct = goal.targetCount > 0
            ? Math.min(100, Math.round((goal.progress / goal.targetCount) * 100))
            : 0
          return (
            <div
              key={goal.id}
              className={clsx(
                'rounded-2xl border px-4 py-3 transition-all',
                goal.completed
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-zinc-200 bg-white',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {goal.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-zinc-300 shrink-0" />
                    )}
                    <span className={clsx(
                      'text-sm font-bold truncate',
                      goal.completed ? 'text-emerald-800' : 'text-zinc-900',
                    )}>
                      {goal.title}
                    </span>
                  </div>
                  {goal.description && (
                    <div className="mt-1 text-xs text-zinc-500 ml-6">{goal.description}</div>
                  )}
                  <div className="mt-2 ml-6">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar
                          value={pct}
                          size="sm"
                          color={goal.completed ? 'green' : 'blue'}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-600 shrink-0">
                        {Math.min(goal.progress, goal.targetCount)}/{goal.targetCount}
                      </span>
                    </div>
                  </div>
                </div>
                {goal.completed && (
                  <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
