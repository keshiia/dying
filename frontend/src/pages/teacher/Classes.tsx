import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { apiFetch } from '@/utils/api'
import type { TeacherClass } from '@/types'

type MemberRow = {
  id: string
  nickname: string
  grade: string | null
  attemptCount: number
  avgScore: number
  completedLevels: number
}

export default function Classes() {
  const [name, setName] = useState('')
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [open, setOpen] = useState<TeacherClass | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])

  async function load() {
    const data = await apiFetch<{ success: true; classes: TeacherClass[] }>('/api/teacher/classes')
    setClasses(data.classes)
  }

  useEffect(() => {
    void load()
  }, [])

  async function create() {
    if (!name.trim()) return
    await apiFetch('/api/teacher/classes', { method: 'POST', body: JSON.stringify({ name }) })
    setName('')
    await load()
  }

  async function view(c: TeacherClass) {
    setOpen(c)
    const data = await apiFetch<{ success: true; members: MemberRow[] }>(`/api/teacher/classes/${c.id}/members`)
    setMembers(data.members)
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
          <Button onClick={create}>创建班级</Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid gap-2">
          {classes.length === 0 ? (
            <div className="text-sm text-zinc-600">暂无班级</div>
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
                <Button variant="secondary" onClick={() => view(c)}>
                  查看成员
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
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2">昵称</th>
                  <th className="py-2">年级</th>
                  <th className="py-2">闯关次数</th>
                  <th className="py-2">平均分</th>
                  <th className="py-2">已完成关卡</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
