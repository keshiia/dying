import { useEffect, useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import { apiFetch } from '@/utils/api'
import type { TeacherAssignment, TeacherClass } from '@/types'

export default function Assignments() {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [classId, setClassId] = useState('')
  const [targetType, setTargetType] = useState<'LEVEL' | 'RESOURCE'>('LEVEL')
  const [targetId, setTargetId] = useState('level-campus-1')
  const [dueAt, setDueAt] = useState('')
  const [list, setList] = useState<TeacherAssignment[]>([])

  useEffect(() => {
    ;(async () => {
      const c = await apiFetch<{ success: true; classes: TeacherClass[] }>('/api/teacher/classes')
      setClasses(c.classes)
      const first = c.classes[0]?.id ?? ''
      setClassId(first)
      if (first) await load(first)
    })()
  }, [])

  async function load(id: string) {
    const data = await apiFetch<{ success: true; assignments: TeacherAssignment[] }>(
      `/api/teacher/assignments?classId=${encodeURIComponent(id)}`,
    )
    setList(data.assignments)
  }

  const canCreate = useMemo(() => classId && targetId, [classId, targetId])

  async function create() {
    if (!canCreate) return
    await apiFetch('/api/teacher/assignments', {
      method: 'POST',
      body: JSON.stringify({
        classId,
        targetType,
        targetId,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      }),
    })
    await load(classId)
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">任务布置</div>
        <div className="mt-1 text-sm text-zinc-600">选择班级并布置关卡或资源学习任务。</div>

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-4">
            <div className="text-xs font-semibold text-zinc-700 mb-1">班级</div>
            <select
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                void load(e.target.value)
              }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-3">
            <div className="text-xs font-semibold text-zinc-700 mb-1">目标类型</div>
            <select
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm"
              value={targetType}
              onChange={(e) => {
                const v = e.target.value
                setTargetType(v === 'RESOURCE' ? 'RESOURCE' : 'LEVEL')
              }}
            >
              <option value="LEVEL">关卡</option>
              <option value="RESOURCE">资源</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-3">
            <div className="text-xs font-semibold text-zinc-700 mb-1">目标ID（MVP）</div>
            <Input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="例如：level-campus-1" />
          </div>
          <div className="col-span-12 md:col-span-2">
            <div className="text-xs font-semibold text-zinc-700 mb-1">截止（可选）</div>
            <input
              type="datetime-local"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={create} disabled={!canCreate}>
            发布任务
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-extrabold text-zinc-900">任务列表</div>
        <div className="mt-3 grid gap-2">
          {list.length === 0 ? (
            <div className="text-sm text-zinc-600">暂无任务</div>
          ) : (
            list.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">{a.targetType === 'LEVEL' ? '关卡任务' : '资源任务'}</div>
                  <div className="mt-1 text-xs text-zinc-500">目标：{a.targetId} · 截止：{a.dueAt ? new Date(a.dueAt).toLocaleString() : '未设置'}</div>
                  <div className="mt-2 flex gap-2">
                    <Tag>{a.targetType}</Tag>
                    <Tag>已完成 {a.doneCount}</Tag>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
