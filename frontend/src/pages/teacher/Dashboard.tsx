import { useCallback, useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import { apiFetch, errorMessage } from '@/utils/api'
import type { TeacherClass } from '@/types'

type Kpi = {
  studentCount: number
  activeStudents: number
  attemptCount: number
  avgScore: number
}

export default function Dashboard() {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [classId, setClassId] = useState<string>('')
  const [kpi, setKpi] = useState<Kpi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadKpi = useCallback(async (id: string) => {
    if (!id) {
      setKpi(null)
      return
    }
    const d = await apiFetch<{ success: true; kpi: Kpi }>(
      `/api/teacher/dashboard?classId=${encodeURIComponent(id)}`,
    )
    setKpi(d.kpi)
  }, [])

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const c = await apiFetch<{ success: true; classes: TeacherClass[] }>('/api/teacher/classes')
      setClasses(c.classes)
      const first = c.classes[0]?.id ?? ''
      setClassId(first)
      await loadKpi(first)
    } catch (e: unknown) {
      // 原先这里没有任何 try/catch：请求失败会变成未处理的 rejection，
      // 而 KPI 用 `?? 0` 兜底 —— 老师看到的是「学生人数 0、平均得分 0 分」，
      // 会误判成「班里没人学习」，而不是「数据没加载出来」。
      setError(errorMessage(e))
      setKpi(null)
    } finally {
      setLoading(false)
    }
  }, [loadKpi])

  useEffect(() => {
    void load()
  }, [load])

  async function change(id: string) {
    setClassId(id)
    setError(null)
    try {
      await loadKpi(id)
    } catch (e: unknown) {
      setError(errorMessage(e))
      setKpi(null)
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">进度看板</div>
        <div className="mt-1 text-sm text-zinc-600">查看班级整体学习活跃与平均正确率。</div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {classes.length === 0 ? (
            <Tag>{error ? '班级加载失败' : '请先创建班级'}</Tag>
          ) : (
            classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void change(c.id)}
                className={
                  c.id === classId
                    ? 'rounded-full bg-[var(--p-primary)] text-white px-4 py-2 text-xs font-semibold'
                    : 'rounded-full bg-zinc-100 text-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-zinc-200'
                }
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="p-5">
        {error && (
          <div
            role="alert"
            className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>看板数据加载失败：{error}</span>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              重试
            </Button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-3">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="col-span-12 h-[92px] animate-pulse rounded-2xl bg-zinc-100 sm:col-span-6 lg:col-span-3" />
            ))
          ) : (
            <>
              {/* 数据没到手时显示「—」，而不是 0 —— 0 会被读成「没有人学习」 */}
              <Kpi title="学生人数" value={kpi ? kpi.studentCount : '—'} />
              <Kpi title="近7天活跃" value={kpi ? kpi.activeStudents : '—'} />
              <Kpi title="闯关次数" value={kpi ? kpi.attemptCount : '—'} />
              <Kpi title="平均得分" value={kpi ? `${kpi.avgScore}分` : '—'} />
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-2xl border border-zinc-100 bg-white p-4">
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-zinc-900">{value}</div>
    </div>
  )
}
