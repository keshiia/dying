import { useEffect, useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { apiFetch, errorMessage } from '@/utils/api'
import type { StudentTask } from '@/types'
import { useNavigate } from 'react-router-dom'

export default function Tasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<StudentTask[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [joinMsg, setJoinMsg] = useState<string | null>(null)

  async function load() {
    const data = await apiFetch<{ success: true; tasks: StudentTask[] }>('/api/student/tasks')
    setTasks(data.tasks)
  }

  useEffect(() => {
    void load()
  }, [])

  const todo = useMemo(() => tasks.filter((t) => t.status === 'todo'), [tasks])
  const done = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks])

  async function join() {
    setJoinMsg(null)
    try {
      const data = await apiFetch<{ success: true; class: { id: string; name: string; joinCode: string } }>(
        '/api/student/join-class',
        { method: 'POST', body: JSON.stringify({ joinCode }) },
      )
      setJoinMsg(`已加入：${data.class.name}`)
      setJoinCode('')
      await load()
    } catch (e: unknown) {
      setJoinMsg(errorMessage(e))
    }
  }

  async function markDone(id: string) {
    await apiFetch('/api/student/tasks/' + id + '/submit', { method: 'POST', body: JSON.stringify({}) })
    await load()
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">教师任务</div>
        <div className="mt-1 text-sm text-zinc-600">输入加入码加入班级后，你会在这里看到老师布置的学习任务。</div>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-[240px]">
            <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="班级加入码" />
          </div>
          <Button variant="secondary" onClick={join}>
            加入班级
          </Button>
          {joinMsg && <div className="text-sm text-zinc-700">{joinMsg}</div>}
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-extrabold text-zinc-900">待完成（{todo.length}）</div>
        <div className="mt-3 grid gap-2">
          {todo.length === 0 ? (
            <div className="text-sm text-zinc-600">暂无任务</div>
          ) : (
            todo.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">任务：{t.targetType === 'LEVEL' ? '闯关' : '阅读资源'}</div>
                  <div className="mt-1 text-xs text-zinc-500">截止：{t.dueAt ? new Date(t.dueAt).toLocaleString() : '未设置'}</div>
                  <div className="mt-2 flex gap-2">
                    <Tag>{t.targetType}</Tag>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (t.targetType === 'LEVEL') navigate('/app/learn')
                      else navigate('/app/resources')
                    }}
                  >
                    去完成
                  </Button>
                  <Button variant="primary" onClick={() => markDone(t.id)}>
                    标记完成
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-extrabold text-zinc-900">已完成（{done.length}）</div>
        <div className="mt-3 grid gap-2">
          {done.length === 0 ? (
            <div className="text-sm text-zinc-600">还没有完成的任务</div>
          ) : (
            done.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">任务：{t.targetType === 'LEVEL' ? '闯关' : '阅读资源'}</div>
                  <div className="mt-1 text-xs text-zinc-500">完成时间：{t.submittedAt ? new Date(t.submittedAt).toLocaleString() : ''}</div>
                </div>
                <Tag className="bg-[color:var(--p-primary)]/10 text-zinc-900">DONE</Tag>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
