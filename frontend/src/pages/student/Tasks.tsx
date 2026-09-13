import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock3, RotateCcw } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import ChallengeModal from '@/components/student/ChallengeModal'
import { apiFetch, errorMessage } from '@/utils/api'
import type { LearningUnit, ReviewLevel, StudentTask } from '@/types'

export default function Tasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<StudentTask[]>([])
  const [units, setUnits] = useState<LearningUnit[]>([])
  const [reviewLevels, setReviewLevels] = useState<ReviewLevel[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [joinMsg, setJoinMsg] = useState<string | null>(null)
  const [myClass, setMyClass] = useState<{ id: string; name: string; joinCode: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [openLevel, setOpenLevel] = useState<null | { id: string; title: string; xpReward: number }>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [taskData, unitData, reviewData, classData] = await Promise.all([
        apiFetch<{ success: true; tasks: StudentTask[] }>('/api/student/tasks'),
        apiFetch<{ success: true; units: LearningUnit[] }>('/api/student/units'),
        apiFetch<{ success: true; reviewLevels: ReviewLevel[] }>('/api/student/review-levels'),
        apiFetch<{ success: true; class: { id: string; name: string; joinCode: string } | null }>('/api/student/my-class'),
      ])
      setTasks(taskData.tasks)
      setUnits(unitData.units)
      setReviewLevels(reviewData.reviewLevels)
      setMyClass(classData.class)
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const todo = useMemo(() => tasks.filter((t) => t.status === 'todo'), [tasks])
  const done = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks])

  const nextLevel = useMemo(() => {
    for (const u of units) {
      for (const l of u.levels) {
        if (l.progress?.status !== 'COMPLETED') {
          return { unit: u, level: l }
        }
      }
    }
    return null
  }, [units])

  const todayQuestion = useMemo(() => {
    if (nextLevel) return nextLevel
    const firstUnit = units[0]
    const firstLevel = firstUnit?.levels[0]
    if (!firstUnit || !firstLevel) return null
    return { unit: firstUnit, level: firstLevel }
  }, [nextLevel, units])

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

  async function leave() {
    if (!window.confirm('确定要退出当前班级吗？学习进度和错题都会保留，重新加入即可继续。')) return
    setJoinMsg(null)
    try {
      await apiFetch('/api/student/leave-class', { method: 'POST', body: JSON.stringify({}) })
      setJoinMsg('已退出班级')
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
        <div className="text-lg font-extrabold text-zinc-900">任务中心</div>
        <div className="mt-1 text-sm text-zinc-600">每日练习、错题复盘和老师任务都集中在这里处理。</div>
      </Card>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-32 bg-zinc-100 rounded-full" />
                <div className="h-16 bg-zinc-100 rounded-2xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        // 原先错误卡片渲染在整页最底部：首屏加载失败时，学生先看到的是满屏
        // 「暂无任务」「暂无错题」，要滚到页面底部才发现一行红字。
        // 加载失败时只渲染错误本身，不给会误导人的空列表。
        <Card className="p-5 border-red-100 bg-red-50">
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm text-red-700">
            <span>任务加载失败：{error}</span>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              重试
            </Button>
          </div>
        </Card>
      ) : (
        <>
      <Card className="p-5 min-h-[136px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-base font-extrabold tracking-tight text-zinc-900">
              <Clock3 className="h-4 w-4 text-slate-500" />
              今日1题（30秒）
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">每天一题，维持法律判断手感</div>
            {todayQuestion ? (
              <div className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                <div className="text-sm font-bold text-zinc-900 truncate">{todayQuestion.level.title}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {todayQuestion.unit.title} · 预计 30-60 秒
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-zinc-500">暂无可练习题目，先去闯关页看看。</div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {todayQuestion && (
              <Button
                size="sm"
                onClick={() => {
                  setOpenLevel({
                    id: todayQuestion.level.id,
                    title: todayQuestion.level.title,
                    xpReward: todayQuestion.level.xpReward,
                  })
                }}
              >
                {todayQuestion.level.progress?.status === 'COMPLETED' ? '再次练习' : '开始挑战'}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigate('/app/learn')
              }}
            >
              继续挑战
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 min-h-[136px]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-base font-extrabold tracking-tight text-zinc-900">
              <RotateCcw className="h-4 w-4 text-slate-500" />
              错题复盘快捷入口
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">优先复盘得分偏低关卡，提升更快</div>
          </div>
          <Tag color="zinc">最多 3 条</Tag>
        </div>

        <div className="mt-3 grid gap-2">
          {reviewLevels.length === 0 ? (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
              暂无错题记录，继续闯关保持状态。
            </div>
          ) : (
            reviewLevels.map((item) => (
              <div
                key={item.levelId}
                className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">{item.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 truncate">
                    {item.unitTitle} · 最近 {item.latestScore} 分
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setOpenLevel({
                      id: item.levelId,
                      title: item.title,
                      xpReward: item.xpReward,
                    })
                  }}
                >
                  再次练习
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">教师任务</div>
        <div className="mt-1 text-sm text-zinc-600">输入班级加入码后，你会在这里看到老师布置的学习任务。</div>
        {myClass ? (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2.5">
              <div className="text-sm font-semibold text-zinc-900">{myClass.name}</div>
              <div className="mt-0.5 text-xs text-zinc-500">加入码 {myClass.joinCode}</div>
            </div>
            <Button variant="secondary" onClick={leave}>
              退出班级
            </Button>
            {joinMsg && <div className="text-sm text-zinc-700">{joinMsg}</div>}
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <div className="w-[240px]">
                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="班级加入码" />
              </div>
              <Button variant="secondary" onClick={join}>
                加入班级
              </Button>
              {joinMsg && <div className="text-sm text-zinc-700">{joinMsg}</div>}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              一名学生同时只能加入一个班级，换班时请先退出当前班级。
            </div>
          </>
        )}
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
                    <Tag>{t.targetType === 'LEVEL' ? '闯关' : '阅读资源'}</Tag>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (t.targetType === 'LEVEL') {
                        const level = units.flatMap((u) => u.levels).find((l) => l.id === t.targetId)
                        if (level) {
                          setOpenLevel({ id: level.id, title: level.title, xpReward: level.xpReward })
                          return
                        }
                        navigate('/app/learn')
                      } else {
                        navigate(`/app/resources?id=${t.targetId}`)
                      }
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
                <Tag className="bg-[color:var(--p-primary)]/10 text-zinc-900">已完成</Tag>
              </div>
            ))
          )}
        </div>
      </Card>

      <ChallengeModal openLevel={openLevel} onClose={() => setOpenLevel(null)} onCompleted={load} />
        </>
      )}
    </div>
  )
}
