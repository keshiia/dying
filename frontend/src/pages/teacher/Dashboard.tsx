import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import { apiFetch } from '@/utils/api'
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

  useEffect(() => {
    ;(async () => {
      const c = await apiFetch<{ success: true; classes: TeacherClass[] }>('/api/teacher/classes')
      setClasses(c.classes)
      const first = c.classes[0]?.id ?? ''
      setClassId(first)
      if (first) {
        const d = await apiFetch<{ success: true; kpi: Kpi }>(`/api/teacher/dashboard?classId=${encodeURIComponent(first)}`)
        setKpi(d.kpi)
      }
    })()
  }, [])

  async function change(id: string) {
    setClassId(id)
    const d = await apiFetch<{ success: true; kpi: Kpi }>(`/api/teacher/dashboard?classId=${encodeURIComponent(id)}`)
    setKpi(d.kpi)
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">进度看板</div>
        <div className="mt-1 text-sm text-zinc-600">查看班级整体学习活跃与平均正确率。</div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {classes.length === 0 ? (
            <Tag>请先创建班级</Tag>
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
        <div className="grid grid-cols-12 gap-3">
          <Kpi title="学生人数" value={kpi?.studentCount ?? 0} />
          <Kpi title="近7天活跃" value={kpi?.activeStudents ?? 0} />
          <Kpi title="闯关次数" value={kpi?.attemptCount ?? 0} />
          <Kpi title="平均得分" value={(kpi?.avgScore ?? 0) + '分'} />
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
