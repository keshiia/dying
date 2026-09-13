import { useCallback, useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { apiFetch, errorMessage } from '@/utils/api'
import type { TeacherClass } from '@/types'

type MemberRow = {
  id: string
  nickname: string
  grade: string | null
  attemptCount: number
  avgScore: number
  completedLevels: number
  openRiskCount: number
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null
}

const RISK_STYLE: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-600 border-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-zinc-50 text-zinc-600 border-zinc-200',
}

const RISK_LABEL: Record<string, string> = {
  HIGH: '高风险',
  MEDIUM: '需关注',
  LOW: '轻微',
}

export default function Classes() {
  const [name, setName] = useState('')
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [open, setOpen] = useState<TeacherClass | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  // 原先三个请求都是裸 await、无 try/catch：失败会变成未处理的 rejection，
  // 创建班级失败时输入框不清空、也没有任何提示，老师会反复点。
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ success: true; classes: TeacherClass[] }>('/api/teacher/classes')
      setClasses(data.classes)
      setError(null)
    } catch (e: unknown) {
      setError(errorMessage(e))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function create() {
    if (!name.trim() || creating) return
    setCreating(true)
    setError(null)
    try {
      await apiFetch('/api/teacher/classes', { method: 'POST', body: JSON.stringify({ name }) })
      setName('')
      await load()
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setCreating(false)
    }
  }

  async function view(c: TeacherClass) {
    setOpen(c)
    setLoadingMembers(true)
    setError(null)
    try {
      const data = await apiFetch<{ success: true; members: MemberRow[] }>(`/api/teacher/classes/${c.id}/members`)
      setMembers(data.members)
    } catch (e: unknown) {
      setMembers([])
      setError(errorMessage(e))
    } finally {
      setLoadingMembers(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">班级管理</div>
        <div className="mt-1 text-sm text-zinc-600">创建班级并把加入码发给学生。</div>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-[260px]">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：高一(1)班" />
          </div>
          <Button onClick={create} disabled={!name.trim() || creating}>
            {creating ? '创建中…' : '创建班级'}
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>操作失败：{error}</span>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              重新加载
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="grid gap-2">
          {classes.length === 0 ? (
            <div className="text-sm text-zinc-600">{error ? '班级列表加载失败' : '暂无班级'}</div>
          ) : (
            classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">{c.name}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Tag>加入码</Tag>
                    <div className="text-sm font-extrabold text-zinc-900 tracking-wider">{c.joinCode}</div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => void view(c)}
                  disabled={loadingMembers && open?.id === c.id}
                >
                  {loadingMembers && open?.id === c.id ? '加载中…' : '查看成员'}
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {open && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-zinc-900">成员：{open.name}</div>
              <div className="mt-1 text-xs text-zinc-500">加入码：{open.joinCode}</div>
            </div>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              收起
            </Button>
          </div>
          {loadingMembers && (
            <div className="mt-4 animate-pulse space-y-2">
              <div className="h-6 rounded-lg bg-zinc-100" />
              <div className="h-6 rounded-lg bg-zinc-100" />
              <div className="h-6 rounded-lg bg-zinc-100" />
            </div>
          )}

          {!loadingMembers && error && members.length === 0 && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              成员加载失败：{error}
            </div>
          )}

          {!loadingMembers && !(error && members.length === 0) && (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2">昵称</th>
                  <th className="py-2">年级</th>
                  <th className="py-2">闯关次数</th>
                  <th className="py-2">平均分</th>
                  <th className="py-2">已完成关卡</th>
                  <th className="py-2">风险提示</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-zinc-100">
                    <td className="py-2 font-semibold text-zinc-900">{m.nickname}</td>
                    <td className="py-2 text-zinc-700">{m.grade ?? '-'}</td>
                    <td className="py-2 text-zinc-700">{m.attemptCount}</td>
                    <td className="py-2 text-zinc-700">{m.avgScore}</td>
                    <td className="py-2 text-zinc-700">{m.completedLevels}</td>
                    <td className="py-2">
                      {m.riskLevel ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK_STYLE[m.riskLevel]}`}
                        >
                          {RISK_LABEL[m.riskLevel]}
                          {m.openRiskCount > 1 && ` ×${m.openRiskCount}`}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      )}
    </div>
  )
}
