import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { apiFetch, errorMessage } from '@/utils/api'
import type { ResourceListItem, TeacherAssignment, TeacherClass } from '@/types'

type TeacherUnit = {
  id: string
  title: string
  category: string
  levels: Array<{ id: string; title: string; orderNo: number }>
}

export default function Assignments() {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [classId, setClassId] = useState('')
  const [targetType, setTargetType] = useState<'LEVEL' | 'RESOURCE'>('LEVEL')
  const [targetId, setTargetId] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [list, setList] = useState<TeacherAssignment[]>([])
  const [units, setUnits] = useState<TeacherUnit[]>([])
  const [resources, setResources] = useState<ResourceListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // 内部 id → 可读标题。原先任务列表直接显示 `level-campus-1` 这类内部 ID，
  // 老师看不出这是什么任务。
  const titleById = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of units) for (const l of u.levels) m.set(l.id, `${u.title} · ${l.title}`)
    for (const r of resources) m.set(r.id, r.title)
    return m
  }, [units, resources])

  const load = useCallback(async (id: string) => {
    if (!id) {
      setList([])
      return
    }
    const data = await apiFetch<{ success: true; assignments: TeacherAssignment[] }>(
      `/api/teacher/assignments?classId=${encodeURIComponent(id)}`,
    )
    setList(data.assignments)
  }, [])

  const bootstrap = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [c, u, r] = await Promise.all([
        apiFetch<{ success: true; classes: TeacherClass[] }>('/api/teacher/classes'),
        apiFetch<{ success: true; units: TeacherUnit[] }>('/api/teacher/levels'),
        apiFetch<{ success: true; resources: ResourceListItem[] }>('/api/resources'),
      ])
      setClasses(c.classes)
      setUnits(u.units)
      setResources(r.resources)
      const first = c.classes[0]?.id ?? ''
      setClassId(first)
      await load(first)
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const canCreate = useMemo(() => !!classId && !!targetId, [classId, targetId])

  async function create() {
    if (!canCreate || creating) return
    setCreating(true)
    setError(null)
    try {
      await apiFetch('/api/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify({
          classId,
          targetType,
          targetId,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        }),
      })
      setTargetId('')
      setDueAt('')
      await load(classId)
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">任务布置</div>
        <div className="mt-1 text-sm text-zinc-600">选择班级并布置关卡或资源学习任务。</div>

        {error && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>操作失败：{error}</span>
            <Button size="sm" variant="secondary" onClick={() => void bootstrap()}>
              重新加载
            </Button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-3">
            <div className="mb-1 text-xs font-semibold text-zinc-700">班级</div>
            <select
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setError(null)
                void load(e.target.value).catch((err: unknown) => setError(errorMessage(err)))
              }}
            >
              {classes.length === 0 && <option value="">暂无班级</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-12 md:col-span-3">
            <div className="mb-1 text-xs font-semibold text-zinc-700">任务类型</div>
            <select
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm"
              value={targetType}
              onChange={(e) => {
                const v = e.target.value
                setTargetType(v === 'RESOURCE' ? 'RESOURCE' : 'LEVEL')
                setTargetId('')
              }}
            >
              <option value="LEVEL">关卡</option>
              <option value="RESOURCE">资源</option>
            </select>
          </div>

          {/* 原先是让老师手打 `level-campus-1`，标签还写着「目标ID（MVP）」——
              内部术语露在教师界面上，而且没人记得住关卡 ID。改成选择。 */}
          <div className="col-span-12 md:col-span-4">
            <div className="mb-1 text-xs font-semibold text-zinc-700">
              {targetType === 'LEVEL' ? '选择关卡' : '选择资源'}
            </div>
            <select
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">请选择…</option>
              {targetType === 'LEVEL'
                ? units.map((u) => (
                    <optgroup key={u.id} label={u.title}>
                      {u.levels.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
            </select>
          </div>

          <div className="col-span-12 md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-zinc-700">截止（可选）</div>
            <input
              type="datetime-local"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={create} disabled={!canCreate || creating}>
            {creating ? '发布中…' : '发布任务'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-extrabold text-zinc-900">任务列表</div>
        <div className="mt-3 grid gap-2">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-16 rounded-2xl bg-zinc-100" />
              <div className="h-16 rounded-2xl bg-zinc-100" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-sm text-zinc-600">还没有布置任务，选中班级与内容后点「发布任务」。</div>
          ) : (
            list.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900">
                    {a.targetType === 'LEVEL' ? '关卡任务' : '资源任务'}
                  </div>
                  <div className="mt-1 truncate text-xs text-zinc-500">
                    内容：{titleById.get(a.targetId) ?? a.targetId} · 截止：
                    {a.dueAt ? new Date(a.dueAt).toLocaleString() : '未设置'}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Tag>{a.targetType === 'LEVEL' ? '关卡' : '资源'}</Tag>
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
