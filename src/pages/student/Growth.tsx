import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  Crown,
  Flame,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import { apiFetch } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

type TrendPoint = {
  day: string
  count: number
}

type GrowthStats = {
  attemptCount: number
  avgScore: number
  completedLevels: number
  streakDays: number
  weeklyActiveDays: number
  weeklyGoalTarget: number
  last7Trend: TrendPoint[]
}

type TodayActionStatus = 'START' | 'SPRINT' | 'DONE'

type BadgeModel = {
  id: string
  title: string
  desc: string
  current: number
  target: number
  unit: string
  icon: typeof Award
  unlocked: boolean
  progress: number
  remaining: number
}

const emptyTrend: TrendPoint[] = [
  { day: '--', count: 0 },
  { day: '--', count: 0 },
  { day: '--', count: 0 },
  { day: '--', count: 0 },
  { day: '--', count: 0 },
  { day: '--', count: 0 },
  { day: '--', count: 0 },
]

const todayStatusUI: Record<TodayActionStatus, { label: string; className: string }> = {
  START: {
    label: '今日起步',
    className: 'rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700',
  },
  SPRINT: {
    label: '冲刺中',
    className: 'rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700',
  },
  DONE: {
    label: '已达成',
    className: 'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700',
  },
}

function toPct(current: number, target: number) {
  return Math.min(100, Math.round((current / Math.max(1, target)) * 100))
}

export default function Growth() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<GrowthStats | null>(null)
  const [showAllBadges, setShowAllBadges] = useState(false)

  useEffect(() => {
    ;(async () => {
      const data = await apiFetch<{ success: true; stats: GrowthStats }>('/api/student/summary')
      setStats(data.stats)
    })()
  }, [])

  const pct = user ? user.xp % 100 : 0
  const attemptCount = stats?.attemptCount ?? 0
  const avgScore = stats?.avgScore ?? 0
  const completedLevels = stats?.completedLevels ?? 0
  const streakDays = stats?.streakDays ?? 0
  const weeklyGoalTarget = stats?.weeklyGoalTarget ?? 5
  const weeklyActiveDays = stats?.weeklyActiveDays ?? 0
  const weeklyPct = toPct(weeklyActiveDays, weeklyGoalTarget)
  const weeklyRemaining = Math.max(0, weeklyGoalTarget - weeklyActiveDays)
  const trend = stats?.last7Trend?.length ? stats.last7Trend : emptyTrend
  const maxTrend = Math.max(1, ...trend.map((item) => item.count))

  const badgeList = useMemo<BadgeModel[]>(() => {
    const raw = [
      {
        id: 'starter',
        title: '学习新手',
        desc: '完成1次闯关',
        current: attemptCount,
        target: 1,
        unit: '次',
        icon: Award,
      },
      {
        id: 'first-level',
        title: '勇闯第一关',
        desc: '完成1个关卡',
        current: completedLevels,
        target: 1,
        unit: '关',
        icon: ShieldCheck,
      },
      {
        id: 'streak',
        title: '持续进步',
        desc: '连续学习3天',
        current: streakDays,
        target: 3,
        unit: '天',
        icon: Flame,
      },
      {
        id: 'accuracy',
        title: '稳健高分',
        desc: '平均正确率达到85%',
        current: avgScore,
        target: 85,
        unit: '分',
        icon: Sparkles,
      },
      {
        id: 'ten-levels',
        title: '十关达人',
        desc: '累计完成10关',
        current: completedLevels,
        target: 10,
        unit: '关',
        icon: Crown,
      },
    ]

    return raw.map((item) => {
      const progress = toPct(item.current, item.target)
      const unlocked = item.current >= item.target
      const remaining = Math.max(0, item.target - item.current)
      return {
        ...item,
        progress,
        unlocked,
        remaining,
      }
    })
  }, [attemptCount, avgScore, completedLevels, streakDays])

  const unlockedBadges = badgeList.filter((item) => item.unlocked)
  const badgeCompletionPct = toPct(unlockedBadges.length, badgeList.length)
  const badgePriorityList = useMemo(() => {
    return [...badgeList].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      if (a.progress !== b.progress) return b.progress - a.progress
      return a.remaining - b.remaining
    })
  }, [badgeList])
  const featuredBadges = badgePriorityList.slice(0, 3)
  const restBadges = badgePriorityList.slice(3)
  const visibleBadges = showAllBadges ? badgePriorityList : featuredBadges

  const nextStep = useMemo(() => {
    if (!stats) {
      return {
        title: '先完成一次学习打卡',
        desc: '做完今日1题或闯过一关后，这里会给你更个性化建议。',
        primaryLabel: '去今日任务',
        primaryTo: '/app/tasks',
        secondaryLabel: '去学习闯关',
        secondaryTo: '/app/learn',
      }
    }

    if (streakDays === 0) {
      return {
        title: '今天先完成一次学习打卡',
        desc: '完成今日1题或任意一关，即可重新点亮连续学习。',
        primaryLabel: '去今日任务',
        primaryTo: '/app/tasks',
        secondaryLabel: '去学习闯关',
        secondaryTo: '/app/learn',
      }
    }

    if (avgScore < 80) {
      return {
        title: '先做一次错题复盘，提升会更快',
        desc: '你已经有稳定学习习惯，再补一轮错题，正确率会更稳。',
        primaryLabel: '去老师任务',
        primaryTo: '/app/tasks',
        secondaryLabel: '继续闯关',
        secondaryTo: '/app/learn',
      }
    }

    if (completedLevels < 10) {
      return {
        title: '继续闯关，尽快完成首轮10关',
        desc: '你状态不错，趁热完成更多关卡可以快速拉开成长差距。',
        primaryLabel: '继续闯关',
        primaryTo: '/app/learn',
        secondaryLabel: '去资源中心',
        secondaryTo: '/app/resources',
      }
    }

    return {
      title: '进入法条速查，扩展法律知识面',
      desc: '基础闯关已不错，可以通过资源中心补充高频法条与案例。',
      primaryLabel: '去资源中心',
      primaryTo: '/app/resources',
      secondaryLabel: '继续闯关',
      secondaryTo: '/app/learn',
    }
  }, [stats, streakDays, avgScore, completedLevels])

  const todayAction = useMemo(() => {
    if (!stats || attemptCount === 0) {
      return {
        status: 'START' as TodayActionStatus,
        title: '先完成今天第一次学习',
        desc: '已完成 0 次，先闯过 1 关建立节奏。',
        primaryLabel: '一键继续',
        primaryTo: '/app/learn',
        secondaryLabel: '去今日任务',
        secondaryTo: '/app/tasks',
      }
    }

    if (weeklyRemaining > 0) {
      return {
        status: 'SPRINT' as TodayActionStatus,
        title: '优先冲刺本周目标',
        desc: `已完成 ${weeklyActiveDays}/${weeklyGoalTarget} 次，还差 ${weeklyRemaining} 次。`,
        primaryLabel: '一键继续',
        primaryTo: '/app/learn',
        secondaryLabel: '去今日任务',
        secondaryTo: '/app/tasks',
      }
    }

    return {
      status: 'DONE' as TodayActionStatus,
      title: '本周目标已完成，继续巩固高分',
      desc: `已完成 ${weeklyGoalTarget}/${weeklyGoalTarget} 次，建议再做 1 关稳定手感。`,
      primaryLabel: '一键继续',
      primaryTo: '/app/learn',
      secondaryLabel: '错题复盘',
      secondaryTo: '/app/tasks',
    }
  }, [stats, attemptCount, weeklyRemaining, weeklyActiveDays, weeklyGoalTarget])

  const todayStatus = todayStatusUI[todayAction.status]

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">个人成长中心</div>
        <div className="mt-1 text-sm text-zinc-600">你的每一次学习和闯关都会转化为XP与等级。</div>

        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 md:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-900">等级</div>
                <div className="mt-1 text-3xl font-extrabold text-zinc-900">Lv {user?.level ?? 1}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-900">累计XP</div>
                <div className="mt-1 text-3xl font-extrabold text-zinc-900">{user?.xp ?? 0}</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={pct} />
              <div className="mt-2 text-xs text-zinc-500">再获得 {100 - pct} XP 升级</div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Tag color="blue">连续学习 {streakDays} 天</Tag>
              <Tag color="zinc">已完成 {weeklyActiveDays}/{weeklyGoalTarget} 次</Tag>
            </div>

            <div className="mt-2">
              <ProgressBar value={weeklyPct} size="sm" color="blue" />
              <div className="mt-1 text-xs text-zinc-500">
                {weeklyRemaining > 0 ? `还差 ${weeklyRemaining} 次，达成本周目标` : '已完成本周目标，继续保持'}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-zinc-900">今日优先任务</div>
                <span
                  key={todayAction.status}
                  className={`${todayStatus.className} animate-chip-fade-up motion-reduce:animate-none`}
                >
                  {todayStatus.label}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">{todayAction.title}</div>
              <div className="mt-1 text-xs text-zinc-500">{todayAction.desc}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate(todayAction.primaryTo)}>
                  {todayAction.primaryLabel}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate(todayAction.secondaryTo)}>
                  {todayAction.secondaryLabel}
                </Button>
              </div>
            </div>
          </div>

          <div className="col-span-12 rounded-2xl border border-zinc-100 bg-white p-4 md:col-span-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-900">徽章墙</div>
                <div className="mt-0.5 text-xs text-zinc-500">已完成 {unlockedBadges.length}/{badgeList.length} 枚</div>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                完成度 {badgeCompletionPct}%
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={badgeCompletionPct} size="sm" color="blue" />
            </div>

            <div className="mt-3 grid gap-2">
              {visibleBadges.length === 0 && (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                  还没有点亮徽章，先完成一次闯关就能获得第一枚。
                </div>
              )}

              {visibleBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div
                    key={badge.id}
                    className={
                      badge.unlocked
                        ? 'rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 px-3 py-2'
                        : 'rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2'
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          badge.unlocked
                            ? 'grid h-7 w-7 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-sky-100'
                            : 'grid h-7 w-7 place-items-center rounded-xl bg-white text-zinc-500 ring-1 ring-zinc-200'
                        }
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-zinc-900">{badge.title}</div>
                        <div className="text-[11px] text-zinc-500">
                          已完成 {Math.min(badge.current, badge.target)}/{badge.target}
                          {badge.unit}
                          {!badge.unlocked && `，还差 ${badge.remaining}${badge.unit}`}
                        </div>
                      </div>
                      {badge.unlocked ? (
                        <Tag className="ml-auto" color="blue">
                          已解锁
                        </Tag>
                      ) : (
                        <Tag className="ml-auto" color="zinc">
                          进行中
                        </Tag>
                      )}
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={badge.progress} size="sm" color="blue" />
                    </div>
                  </div>
                )
              })}
            </div>

            {restBadges.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllBadges((prev) => !prev)}
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                {showAllBadges ? '收起徽章' : `查看全部徽章（${badgeList.length}）`}
                {showAllBadges ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 p-5 md:col-span-6">
          <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
            <Sparkles className="h-4 w-4 text-slate-600" />
            下一步建议
          </div>
          <div className="mt-2 text-base font-bold text-zinc-900">{nextStep.title}</div>
          <div className="mt-1 text-sm text-zinc-600">{nextStep.desc}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => navigate(nextStep.primaryTo)}>
              {nextStep.primaryLabel}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(nextStep.secondaryTo)}>
              {nextStep.secondaryLabel}
            </Button>
          </div>
        </Card>

        <Card className="col-span-12 p-5 md:col-span-6">
          <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
            <TrendingUp className="h-4 w-4 text-slate-600" />
            最近7天学习趋势
          </div>
          <div className="mt-1 text-xs text-zinc-500">按闯关次数统计，观察学习节奏变化</div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {trend.map((item) => {
              const height = Math.max(6, Math.round((item.count / maxTrend) * 56))
              return (
                <div key={`${item.day}-${item.count}`} className="text-center">
                  <div className="mx-auto flex h-16 w-6 items-end justify-center rounded-xl bg-zinc-100/80">
                    <div
                      className="w-4 rounded-lg bg-[var(--p-primary)]"
                      style={{ height: `${height}px` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-zinc-700">{item.count}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">{item.day}</div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            已完成 {weeklyActiveDays}/{weeklyGoalTarget} 次
            {weeklyRemaining > 0 ? `，还差 ${weeklyRemaining} 次` : '，目标达成'}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="text-sm font-extrabold text-zinc-900">学习数据</div>
        <div className="mt-4 grid grid-cols-12 gap-3">
          <Stat title="闯关次数" value={attemptCount} />
          <Stat title="平均正确率" value={avgScore + '%'} />
          <Stat title="已完成关卡" value={completedLevels} />
        </div>
      </Card>
    </div>
  )
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="col-span-12 rounded-2xl border border-zinc-100 bg-white p-4 sm:col-span-4">
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-zinc-900">{value}</div>
    </div>
  )
}
