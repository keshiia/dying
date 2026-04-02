import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock3, RotateCcw } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import ProgressBar from '@/components/ui/ProgressBar'
import ChallengeModal from '@/components/student/ChallengeModal'
import { apiFetch, errorMessage } from '@/utils/api'
import type { LearningUnit, StudentTask } from '@/types'

type DailyGoalState = {
  challengeStarted: boolean
  reviewStarted: boolean
}

function todayKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isToday(iso: string | null | undefined) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function Tasks() {
  const navigate = useNavigate()
  const keyOfToday = `student-daily-goal-${todayKey()}`
  const [tasks, setTasks] = useState<StudentTask[]>([])
  const [units, setUnits] = useState<LearningUnit[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [joinMsg, setJoinMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openLevel, setOpenLevel] = useState<null | { id: string; title: string; xpReward: number }>(null)
  const [dailyGoal, setDailyGoal] = useState<DailyGoalState>({
    challengeStarted: false,
    reviewStarted: false,
  })

  async function load() {
    setError(null)
    try {
      const [taskData, unitData] = await Promise.all([
        apiFetch<{ success: true; tasks: StudentTask[] }>('/api/student/tasks'),
        apiFetch<{ success: true; units: LearningUnit[] }>('/api/student/units'),
      ])
      setTasks(taskData.tasks)
      setUnits(unitData.units)
    } catch (e: unknown) {
      setError(errorMessage(e))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem(keyOfToday)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as DailyGoalState
      setDailyGoal({
        challengeStarted: Boolean(parsed.challengeStarted),
        reviewStarted: Boolean(parsed.reviewStarted),
      })
    } catch {
      setDailyGoal({ challengeStarted: false, reviewStarted: false })
    }
  }, [keyOfToday])

  useEffect(() => {
    localStorage.setItem(keyOfToday, JSON.stringify(dailyGoal))
  }, [dailyGoal, keyOfToday])

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

  const reviewLevels = useMemo(() => {
    return units
      .flatMap((u) =>
        u.levels.map((l) => ({
          unitTitle: u.title,
          level: l,
        })),
      )
      .filter(
        (item) =>
          item.level.progress?.status === 'COMPLETED' &&
          (item.level.progress?.bestScore ?? 100) < 100,
      )
      .sort(
        (a, b) =>
          (a.level.progress?.bestScore ?? 100) -
          (b.level.progress?.bestScore ?? 100),
      )
      .slice(0, 3)
  }, [units])

  const hasTodayChallengeProgress = useMemo(
    () =>
      units.some((u) =>
        u.levels.some((l) => l.progress?.status === 'COMPLETED' && isToday(l.progress?.updatedAt)),
      ),
    [units],
  )

  const hasTodayReviewProgress = useMemo(
    () =>
      units.some((u) =>
        u.levels.some(
          (l) =>
            l.progress?.status === 'COMPLETED' &&
            (l.progress?.bestScore ?? 100) < 100 &&
            isToday(l.progress?.updatedAt),
        ),
      ),
    [units],
  )

  const goalDoneChallenge = dailyGoal.challengeStarted || hasTodayChallengeProgress
  const goalDoneReview = dailyGoal.reviewStarted || hasTodayReviewProgress
  const goalDoneCount = Number(goalDoneChallenge) + Number(goalDoneReview)
  const goalPct = Math.round((goalDoneCount / 2) * 100)

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
        <div className="text-lg font-extrabold text-zinc-900">任务中心</div>
        <div className="mt-1 text-sm text-zinc-600">每日练习、错题复盘和老师任务都集中在这里处理。</div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-extrabold tracking-tight text-zinc-900">今日目标</div>
            <div className="text-xs text-zinc-500 mt-0.5">完成 1 次挑战 + 1 次复盘</div>
          </div>
          <Tag color="blue">{goalDoneCount}/2</Tag>
        </div>

        <div className="mt-3">
          <ProgressBar value={goalPct} color="blue" />
          <div className="mt-2 text-xs text-zinc-500">今日进度 {goalPct}%</div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2">
            <div className="text-sm font-semibold text-zinc-900">今日挑战 1 次</div>
            <div className="text-xs mt-0.5 text-zinc-500">{goalDoneChallenge ? '已完成' : '未完成'}</div>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2">
            <div className="text-sm font-semibold text-zinc-900">错题复盘 1 次</div>
            <div className="text-xs mt-0.5 text-zinc-500">{goalDoneReview ? '已完成' : '未完成'}</div>
          </div>
        </div>
      </Card>

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
                  setDailyGoal((prev) => ({ ...prev, challengeStarted: true }))
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
                setDailyGoal((prev) => ({ ...prev, challengeStarted: true }))
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
                key={item.level.id}
                className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">{item.level.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 truncate">
                    {item.unitTitle} · 最佳 {item.level.progress?.bestScore ?? 0} 分
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setDailyGoal((prev) => ({ ...prev, reviewStarted: true }))
                    setOpenLevel({
                      id: item.level.id,
                      title: item.level.title,
                      xpReward: item.level.xpReward,
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
        <div className="mt-4 flex items-center gap-2 flex-wrap">
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

      {error && <Card className="p-5 text-sm text-red-700 bg-red-50 border-red-100">⚠️ {error}</Card>}

      <ChallengeModal openLevel={openLevel} onClose={() => setOpenLevel(null)} onCompleted={load} />
    </div>
  )
}
