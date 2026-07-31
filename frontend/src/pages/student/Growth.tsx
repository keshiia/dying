import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crown,
  Flame,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import ChallengeModal from '@/components/student/ChallengeModal'
import ErrorAnalysisPanel from '@/components/student/ErrorAnalysisPanel'
import { apiFetch } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import type { LearningUnit, StudentProfile } from '@/types'

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
type BadgeFilter = 'ALL' | 'UNLOCKED' | 'LOCKED' | 'SOON'

type BadgeModel = {
  id: string
  title: string
  desc: string
  current: number
  target: number
  unit: string
  icon: typeof Award
  reward: string
  actionLabel: string
  actionTo: string
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
  const [units, setUnits] = useState<LearningUnit[]>([])
  const [showAllBadges, setShowAllBadges] = useState(false)
  const [showAllUpcomingSummary, setShowAllUpcomingSummary] = useState(false)
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('ALL')
  const [celebratingBadgeId, setCelebratingBadgeId] = useState<string | null>(null)
  const [openLevel, setOpenLevel] = useState<null | {
    id: string
    title: string
    xpReward: number
  }>(null)
  const initializedUnlockedRef = useRef(false)
  const prevUnlockedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    ;(async () => {
      const [summaryData, unitsData] = await Promise.all([
        apiFetch<{ success: true; stats: GrowthStats }>('/api/student/summary'),
        apiFetch<{ success: true; units: LearningUnit[] }>('/api/student/units'),
      ])
      setStats(summaryData.stats)
      setUnits(unitsData.units)
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
        reward: '奖励：+20 XP',
        actionLabel: '去闯关',
        actionTo: '/app/learn',
      },
      {
        id: 'first-level',
        title: '勇闯第一关',
        desc: '完成1个关卡',
        current: completedLevels,
        target: 1,
        unit: '关',
        icon: ShieldCheck,
        reward: '奖励：+20 XP',
        actionLabel: '去闯关',
        actionTo: '/app/learn',
      },
      {
        id: 'streak-3',
        title: '持续进步',
        desc: '连续学习3天',
        current: streakDays,
        target: 3,
        unit: '天',
        icon: Flame,
        reward: '奖励：+30 XP',
        actionLabel: '去打卡',
        actionTo: '/app/tasks',
      },
      {
        id: 'streak-7',
        title: '连学达人',
        desc: '连续学习7天',
        current: streakDays,
        target: 7,
        unit: '天',
        icon: Flame,
        reward: '奖励：+50 XP + 连学称号',
        actionLabel: '去打卡',
        actionTo: '/app/tasks',
      },
      {
        id: 'accuracy',
        title: '稳健高分',
        desc: '平均正确率达到85%',
        current: avgScore,
        target: 85,
        unit: '分',
        icon: Sparkles,
        reward: '奖励：+40 XP',
        actionLabel: '去复盘',
        actionTo: '/app/tasks',
      },
      {
        id: 'ten-levels',
        title: '十关达人',
        desc: '累计完成10关',
        current: completedLevels,
        target: 10,
        unit: '关',
        icon: Crown,
        reward: '奖励：+60 XP',
        actionLabel: '去闯关',
        actionTo: '/app/learn',
      },
      {
        id: 'twenty-attempts',
        title: '练习坚持者',
        desc: '累计完成20次闯关',
        current: attemptCount,
        target: 20,
        unit: '次',
        icon: Target,
        reward: '奖励：+50 XP',
        actionLabel: '去闯关',
        actionTo: '/app/learn',
      },
      {
        id: 'weekly-goal',
        title: '周目标达成',
        desc: `本周活跃达到${weeklyGoalTarget}天`,
        current: weeklyActiveDays,
        target: weeklyGoalTarget,
        unit: '天',
        icon: CalendarCheck2,
        reward: '奖励：+40 XP',
        actionLabel: '去打卡',
        actionTo: '/app/tasks',
      },
      {
        id: 'fifteen-levels',
        title: '进阶法治力',
        desc: '累计完成15关',
        current: completedLevels,
        target: 15,
        unit: '关',
        icon: Crown,
        reward: '奖励：+80 XP + 进阶称号',
        actionLabel: '去闯关',
        actionTo: '/app/learn',
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
  }, [attemptCount, avgScore, completedLevels, streakDays, weeklyActiveDays, weeklyGoalTarget])

  const unlockedBadges = badgeList.filter((item) => item.unlocked)
  const badgeCompletionPct = toPct(unlockedBadges.length, badgeList.length)
  const badgePriorityList = useMemo<BadgeModel[]>(() => {
    return [...badgeList].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      if (!a.unlocked && !b.unlocked && a.remaining !== b.remaining) return a.remaining - b.remaining
      if (a.progress !== b.progress) return b.progress - a.progress
      return a.title.localeCompare(b.title, 'zh-CN')
    })
  }, [badgeList])
  const lockedBadges = badgePriorityList.filter((badge) => !badge.unlocked)
  const nextBadge = lockedBadges[0] ?? null
  const upcomingBadges = lockedBadges.slice(0, 2)
  const summaryUpcomingBadges = showAllUpcomingSummary ? upcomingBadges : upcomingBadges.slice(0, 1)
  const upcomingBadgeIds = useMemo(() => new Set(upcomingBadges.map((item) => item.id)), [upcomingBadges])

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'UNLOCKED') return badgePriorityList.filter((badge) => badge.unlocked)
    if (badgeFilter === 'LOCKED') return badgePriorityList.filter((badge) => !badge.unlocked)
    if (badgeFilter === 'SOON') return upcomingBadges
    return badgePriorityList
  }, [badgeFilter, badgePriorityList, upcomingBadges])

  const defaultBadgeVisibleCount = 5
  const canExpandAll = badgeFilter === 'ALL' && filteredBadges.length > defaultBadgeVisibleCount
  const visibleBadges =
    badgeFilter === 'ALL' && !showAllBadges
      ? filteredBadges.slice(0, defaultBadgeVisibleCount)
      : filteredBadges

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

  useEffect(() => {
    setShowAllBadges(false)
  }, [badgeFilter])

  useEffect(() => {
    setShowAllUpcomingSummary(false)
  }, [lockedBadges.length])

  useEffect(() => {
    const currentUnlockedIds = new Set(badgeList.filter((badge) => badge.unlocked).map((badge) => badge.id))

    if (!initializedUnlockedRef.current) {
      prevUnlockedIdsRef.current = currentUnlockedIds
      initializedUnlockedRef.current = true
      return
    }

    const newlyUnlockedIds = Array.from(currentUnlockedIds).filter((id) => !prevUnlockedIdsRef.current.has(id))
    prevUnlockedIdsRef.current = currentUnlockedIds

    if (newlyUnlockedIds.length === 0) return
    const latestUnlockedId = newlyUnlockedIds[0]
    setCelebratingBadgeId(latestUnlockedId)

    const timer = window.setTimeout(() => {
      setCelebratingBadgeId((prev) => (prev === latestUnlockedId ? null : prev))
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [badgeList])

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">个人成长中心</div>
        <div className="mt-1 text-sm text-zinc-600">你的每一次学习和闯关都会转化为XP与等级。</div>

        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 md:col-span-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900">本周成长总览</div>
                <div className="mt-1 text-3xl font-extrabold text-zinc-900">Lv {user?.level ?? 1}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-900">累计XP</div>
                <div className="mt-1 text-3xl font-extrabold text-zinc-900">{user?.xp ?? 0}</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={pct} />
              <div className="mt-1 text-xs text-zinc-500">
                升级还差 <span className="font-semibold text-sky-700">{100 - pct} XP</span>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700">
                连续学习 <span className="text-zinc-900">{streakDays}</span> 天
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700">
                本周活跃 <span className="text-zinc-900">{weeklyActiveDays}</span>/{weeklyGoalTarget} 次
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={weeklyPct} size="sm" color="blue" />
              <div className="mt-1 text-xs text-zinc-500">
                {weeklyRemaining > 0 ? (
                  <>
                    本周目标还差 <span className="font-semibold text-sky-700">{weeklyRemaining}</span> 次
                  </>
                ) : (
                  '本周目标已达成，继续保持节奏'
                )}
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
              <div className="mt-3 flex items-center gap-3">
                <Button size="sm" onClick={() => navigate(todayAction.primaryTo)}>
                  {todayAction.primaryLabel}
                </Button>
                <button
                  type="button"
                  className="text-xs font-semibold text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
                  onClick={() => navigate(todayAction.secondaryTo)}
                >
                  {todayAction.secondaryLabel}
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 rounded-2xl border border-zinc-100 bg-white p-4 md:col-span-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-900">徽章速览</div>
                <div className="mt-0.5 text-xs text-zinc-500">已解锁 {unlockedBadges.length}/{badgeList.length} 枚</div>
              </div>
              <Tag color="blue">完成度 {badgeCompletionPct}%</Tag>
            </div>

            <div className="mt-3">
              <ProgressBar value={badgeCompletionPct} size="sm" color="blue" />
            </div>

            {nextBadge ? (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-emerald-800">下一枚可得</div>
                    <div className="mt-0.5 text-sm font-semibold text-zinc-900">{nextBadge.title}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-600">
                      还差 <span className="font-semibold text-emerald-800">{nextBadge.remaining}</span>
                      {nextBadge.unit} · {nextBadge.desc}
                    </div>
                  </div>
                  <Tag color="green">进度 {nextBadge.progress}%</Tag>
                </div>
                <div className="mt-2">
                  <ProgressBar value={nextBadge.progress} size="sm" color="green" />
                </div>
                <div className="mt-2">
                  <Button size="sm" variant="secondary" onClick={() => navigate(nextBadge.actionTo)}>
                    {nextBadge.actionLabel}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                全部徽章已解锁，继续保持当前学习节奏。
              </div>
            )}

            {upcomingBadges.length > 0 && (
              <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-orange-800">即将解锁</div>
                  {upcomingBadges.length > 1 && (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-orange-700 hover:text-orange-900"
                      onClick={() => setShowAllUpcomingSummary((prev) => !prev)}
                    >
                      {showAllUpcomingSummary ? '收起' : '查看更多'}
                    </button>
                  )}
                </div>
                <div className="mt-2 grid gap-2">
                  {summaryUpcomingBadges.map((badge) => (
                    <div key={badge.id} className="rounded-xl border border-orange-200 bg-white px-3 py-2">
                      <div className="text-xs font-semibold text-zinc-900">{badge.title}</div>
                      <div className="text-[11px] text-zinc-500">
                        还差 <span className="font-semibold text-orange-700">{badge.remaining}</span>
                        {badge.unit} · {badge.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {nextLevel && (
        <button
          type="button"
          className="min-h-[136px] rounded-3xl border-2 border-[var(--p-primary)] bg-slate-100 px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-200 transition-colors text-left"
          onClick={() =>
            setOpenLevel({
              id: nextLevel.level.id,
              title: nextLevel.level.title,
              xpReward: nextLevel.level.xpReward,
            })
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-[var(--p-primary)] text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-slate-200">
              {getCategoryMeta(nextLevel.unit.category).emoji}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                继续上次 · 下一关
              </div>
              <div className="text-base font-extrabold text-zinc-900 truncate mt-0.5">
                {nextLevel.level.title}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {nextLevel.unit.title} · 奖励 {nextLevel.level.xpReward} XP
              </div>
              <div className="mt-1">
                <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                  难度：{nextLevel.level.difficulty ?? levelDifficulty(nextLevel.level.orderNo)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-slate-700 font-semibold text-sm">
            <Zap className="h-4 w-4" />
            继续挑战
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      )}

      {!nextLevel && (
        <Card className="p-5 border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-base font-extrabold text-zinc-900">
                已完成当前全部关卡，太棒了
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                下一步建议做一次错题复盘，或去资源中心扩展法条知识。
              </div>
            </div>
            <Tag color="blue">全通关</Tag>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/tasks')}>
              错题复盘
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/resources')}>
              资源中心
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-zinc-900">徽章详情</div>
            <div className="mt-0.5 text-xs text-zinc-500">按状态查看全部徽章进度，首屏只保留一个主目标。</div>
          </div>
          {nextBadge && (
            <Button size="sm" onClick={() => navigate(nextBadge.actionTo)}>
              去完成下一枚
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBadgeFilter('ALL')}
            className={
              badgeFilter === 'ALL'
                ? 'rounded-full bg-[var(--p-accent)] px-3 py-1 text-xs font-semibold text-white'
                : 'rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700'
            }
          >
            全部（{badgeList.length}）
          </button>
          <button
            type="button"
            onClick={() => setBadgeFilter('UNLOCKED')}
            className={
              badgeFilter === 'UNLOCKED'
                ? 'rounded-full bg-[var(--p-accent)] px-3 py-1 text-xs font-semibold text-white'
                : 'rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700'
            }
          >
            已解锁（{unlockedBadges.length}）
          </button>
          <button
            type="button"
            onClick={() => setBadgeFilter('LOCKED')}
            className={
              badgeFilter === 'LOCKED'
                ? 'rounded-full bg-[var(--p-accent)] px-3 py-1 text-xs font-semibold text-white'
                : 'rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700'
            }
          >
            待解锁（{lockedBadges.length}）
          </button>
          <button
            type="button"
            onClick={() => setBadgeFilter('SOON')}
            className={
              badgeFilter === 'SOON'
                ? 'rounded-full bg-[var(--p-accent)] px-3 py-1 text-xs font-semibold text-white'
                : 'rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700'
            }
          >
            即将解锁（{upcomingBadges.length}）
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {visibleBadges.length === 0 && (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
              还没有点亮徽章，先完成一次闯关就能获得第一枚。
            </div>
          )}

          {visibleBadges.map((badge) => {
            const Icon = badge.icon
            const isSoon = !badge.unlocked && upcomingBadgeIds.has(badge.id)
            const isCelebrating = celebratingBadgeId === badge.id
            return (
              <div
                key={badge.id}
                className={
                  badge.unlocked
                    ? `rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 px-3 py-2 ${isCelebrating ? 'animate-unlock-highlight ring-2 ring-emerald-200/70 shadow-[0_8px_24px_rgba(16,185,129,0.18)]' : ''}`
                    : isSoon
                      ? 'rounded-2xl border border-orange-200 bg-orange-50/70 px-3 py-2'
                      : 'rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2'
                }
              >
                <div className="flex items-start gap-2">
                  <span
                    className={
                      badge.unlocked
                        ? 'grid h-7 w-7 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-sky-100'
                        : isSoon
                          ? 'grid h-7 w-7 place-items-center rounded-xl bg-white text-orange-600 ring-1 ring-orange-200'
                          : 'grid h-7 w-7 place-items-center rounded-xl bg-white text-zinc-500 ring-1 ring-zinc-200'
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-zinc-900">{badge.title}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">{badge.desc}</div>
                    <div className="mt-1 text-[11px] font-medium text-zinc-600">{badge.reward}</div>
                    <div className="text-[11px] text-zinc-500">
                      已完成 {Math.min(badge.current, badge.target)}/{badge.target}
                      {badge.unit}
                      {!badge.unlocked && (
                        <>
                          ，还差 <span className="font-semibold text-orange-700">{badge.remaining}</span>
                          {badge.unit}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-1.5">
                    {isCelebrating && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <Sparkles className="h-3 w-3" />
                        新解锁
                      </span>
                    )}
                    {badge.unlocked ? (
                      <Tag color="blue">已解锁</Tag>
                    ) : isSoon ? (
                      <Tag color="orange">即将解锁</Tag>
                    ) : (
                      <Tag color="zinc">进行中</Tag>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <ProgressBar value={badge.progress} size="sm" color="blue" />
                </div>
              </div>
            )
          })}
        </div>

        {canExpandAll && (
          <button
            type="button"
            onClick={() => setShowAllBadges((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            {showAllBadges ? '收起徽章' : `查看全部徽章（${badgeList.length}）`}
            {showAllBadges ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 p-5 md:col-span-6">
          <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
            <Sparkles className="h-4 w-4 text-slate-600" />
            下一步建议
          </div>
          <div className="mt-2 text-base font-bold text-zinc-900">{nextStep.title}</div>
          <div className="mt-1 text-sm text-zinc-600">{nextStep.desc}</div>
          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" onClick={() => navigate(nextStep.primaryTo)}>
              {nextStep.primaryLabel}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              className="text-xs font-semibold text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
              onClick={() => navigate(nextStep.secondaryTo)}
            >
              {nextStep.secondaryLabel}
            </button>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <ErrorAnalysisPanel />

        <Card className="p-5">
          <div className="text-sm font-extrabold text-zinc-900">学习数据</div>
          <div className="mt-4 grid grid-cols-12 gap-3">
            <Stat title="闯关次数" value={attemptCount} />
            <Stat title="平均正确率" value={avgScore + '%'} />
            <Stat title="已完成关卡" value={completedLevels} />
          </div>
        </Card>
      </div>

      <ChallengeModal
        openLevel={openLevel}
        onClose={() => setOpenLevel(null)}
        onCompleted={async (data) => {
          if (data.user) {
            const store = useAuthStore.getState()
            if (store.token && store.user) {
              store.setAuth(store.token, { ...store.user, xp: data.user.xp, level: data.user.level })
            }
          }
          const [summaryData, unitsData] = await Promise.all([
            apiFetch<{ success: true; stats: GrowthStats }>('/api/student/summary'),
            apiFetch<{ success: true; units: LearningUnit[] }>('/api/student/units'),
          ])
          setStats(summaryData.stats)
          setUnits(unitsData.units)
        }}
      />
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

function getCategoryMeta(cat: string) {
  const map: Record<string, { emoji: string }> = {
    校园安全: { emoji: '🏫' },
    网络安全: { emoji: '🌐' },
    消费者权益: { emoji: '🛍️' },
    交通安全: { emoji: '🚦' },
    禁毒教育: { emoji: '🚫' },
    家庭权益: { emoji: '🏠' },
  }
  return map[cat] ?? { emoji: '📘' }
}

function levelDifficulty(orderNo: number): string {
  if (orderNo <= 1) return '基础'
  if (orderNo === 2) return '进阶'
  if (orderNo === 3) return '挑战'
  return '实战'
}
