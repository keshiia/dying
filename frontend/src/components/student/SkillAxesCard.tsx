import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import Card from '@/components/ui/Card'
import AgentAvatar, { AGENT_NAME } from '@/components/student/AgentAvatar'
import { apiFetch } from '@/utils/api'

/**
 * 六条能力轴的掌握度 —— 闭环的「回访」那一端。
 *
 * 学生在侦查/法庭/漫画里的行为经过诊断引擎汇聚成这六条轴。这个卡片存在的意义
 * 是让回访看得见：结算页点完推荐按钮、做完那件事，回到这里数字要变。
 *
 * 样本不足的轴**不显示分数**。只玩过侦查的学生在「表达论辩」上一条样本都没有
 * （那条轴只有模拟法庭贡献），报「0 分」既错误又打击人 —— 诊断引擎里有同样的
 * 判断（MIN_SAMPLES_FOR_DIAGNOSIS），两边口径必须一致。
 */

type SkillAxisRow = {
  axis: string
  label: string
  correct: number
  total: number
  rate: number
  sampleEnough: boolean
}

export default function SkillAxesCard({ className }: { className?: string }) {
  const [axes, setAxes] = useState<SkillAxisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setFailed(false)
    apiFetch<{ success: true; axes: SkillAxisRow[] }>('/api/student/skill-axes')
      .then((res) => setAxes(res.axes))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const anySample = axes.some((a) => a.sampleEnough)

  return (
    <Card className={clsx('p-5', className)}>
      <div className="mb-4 flex items-center gap-2.5">
        <AgentAvatar size="sm" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-zinc-900">{AGENT_NAME}·能力画像</div>
          <div className="text-xs text-zinc-500">来自侦查、法庭与漫画里的每一次判断</div>
        </div>
      </div>

      {loading && <div className="py-6 text-center text-sm text-zinc-400">加载中…</div>}

      {!loading && failed && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>能力画像加载失败</span>
          <button
            type="button"
            onClick={load}
            className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold hover:bg-amber-200"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !failed && (
        <>
          {!anySample && (
            <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center">
              <div className="text-3xl">🧭</div>
              <div className="mt-2 text-sm font-bold text-zinc-700">还没有足够的数据</div>
              <div className="mt-1 text-xs text-zinc-500">
                去玩一局案件侦查或模拟法庭，这里就会出现你的能力分布
              </div>
            </div>
          )}

          {anySample && (
            <div className="grid gap-3">
              {axes.map((a) => (
                <div key={a.axis} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs font-bold text-zinc-600">{a.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-500',
                        !a.sampleEnough
                          ? 'bg-zinc-200'
                          : a.rate >= 80
                            ? 'bg-emerald-500'
                            : a.rate >= 60
                              ? 'bg-sky-500'
                              : 'bg-amber-500',
                      )}
                      style={{ width: a.sampleEnough ? `${a.rate}%` : '0%' }}
                    />
                  </div>
                  <span
                    className={clsx(
                      'w-16 shrink-0 text-right text-xs font-extrabold',
                      a.sampleEnough ? 'text-zinc-700' : 'text-zinc-300',
                    )}
                  >
                    {a.sampleEnough ? `${a.rate}%` : '样本不足'}
                  </span>
                </div>
              ))}
              <div className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                「样本不足」表示这条能力还没有被考到过 —— 比如「表达论辩」只在模拟法庭里考察，
                没玩过就不会有分数。
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
