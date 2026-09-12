import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('STUDENT'))

function difficultyByOrder(orderNo: number): '基础' | '进阶' | '挑战' | '实战' {
  if (orderNo <= 1) return '基础'
  if (orderNo === 2) return '进阶'
  if (orderNo === 3) return '挑战'
  return '实战'
}

function lawRefsForLevel(levelId: string): string[] {
  if (levelId.startsWith('level-campus')) {
    return ['未成年人保护法', '民法典·人格权编']
  }
  if (levelId.startsWith('level-network')) {
    return ['网络安全法', '个人信息保护法', '民法典·人格权编']
  }
  if (levelId.startsWith('level-family')) {
    return ['未成年人保护法', '家庭教育促进法', '民法典·人格权编']
  }
  if (levelId.startsWith('level-consumer')) {
    return ['消费者权益保护法', '民法典·合同编']
  }
  if (levelId.startsWith('level-traffic')) {
    return ['道路交通安全法', '民法典·侵权责任编']
  }
  if (levelId.startsWith('level-drug')) {
    return ['禁毒法', '治安管理处罚法']
  }
  return ['青少年普法通识']
}
type ActiveLevelLite = {
  id: string
  unitId: string
  title: string
  xpReward: number
  orderNo: number
}

type LockedLevelLite = {
  id: string
  title: string
  orderNo: number
}

async function resolveUnlockedLevel(studentId: string, levelId: string): Promise<{
  level: ActiveLevelLite | null
  lockedByLevel: LockedLevelLite | null
}> {
  const level = await prisma.level.findFirst({
    where: { id: levelId, isActive: true },
    select: { id: true, unitId: true, title: true, xpReward: true, orderNo: true },
  })
  if (!level) return { level: null, lockedByLevel: null }
  const unitLevels = await prisma.level.findMany({
    where: { unitId: level.unitId, isActive: true },
    orderBy: { orderNo: 'asc' },
    select: { id: true, title: true, orderNo: true },
  })
  const progress = await prisma.userProgress.findMany({
    where: { studentId, levelId: { in: unitLevels.map((l) => l.id) } },
    select: { levelId: true, status: true },
  })
  const progressMap = new Map(progress.map((p) => [p.levelId, p.status]))
  const firstIncomplete = unitLevels.find((l) => progressMap.get(l.id) !== 'COMPLETED')
  if (!firstIncomplete) return { level, lockedByLevel: null }
  const targetStatus = progressMap.get(level.id)
  if (targetStatus === 'COMPLETED') return { level, lockedByLevel: null }
  if (firstIncomplete.id === level.id) return { level, lockedByLevel: null }
  return { level, lockedByLevel: firstIncomplete }
}

function shanghaiDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(date)
}

function shiftDayKey(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day + days))
  return d.toISOString().slice(0, 10)
}

function computeLearningStreakDays(attemptTimes: Date[], now: Date = new Date()): number {
  if (attemptTimes.length === 0) return 0

  const learnedDays = new Set(attemptTimes.map((d) => shanghaiDayKey(d)))
  const todayKey = shanghaiDayKey(now)
  const yesterdayKey = shiftDayKey(todayKey, -1)

  let cursor = todayKey
  if (!learnedDays.has(cursor)) {
    if (!learnedDays.has(yesterdayKey)) return 0
    cursor = yesterdayKey
  }

  let streak = 0
  while (learnedDays.has(cursor)) {
    streak++
    cursor = shiftDayKey(cursor, -1)
  }
  return streak
}

function buildLast7Trend(attemptTimes: Date[], now: Date = new Date()): Array<{ day: string; count: number }> {
  const todayKey = shanghaiDayKey(now)
  const dayKeys = Array.from({ length: 7 }, (_, idx) => shiftDayKey(todayKey, -6 + idx))
  const dayKeySet = new Set(dayKeys)
  const countByDay = new Map<string, number>()

  for (const time of attemptTimes) {
    const key = shanghaiDayKey(time)
    if (!dayKeySet.has(key)) continue
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1)
  }

  return dayKeys.map((key) => ({ day: key.slice(5), count: countByDay.get(key) ?? 0 }))
}
router.get('/units', async (req: Request, res: Response) => {
  const units = await prisma.learningUnit.findMany({
    where: { isActive: true },
    orderBy: { orderNo: 'asc' },
    include: {
      levels: {
        where: { isActive: true },
        orderBy: { orderNo: 'asc' },
        select: { id: true, title: true, orderNo: true, xpReward: true, isActive: true },
      },
    },
  })

  const levelIds = units.flatMap((u) => u.levels.map((l) => l.id))
  const progress = await prisma.userProgress.findMany({
    where: { studentId: req.user!.id, levelId: { in: levelIds } },
    select: { levelId: true, status: true, bestScore: true, updatedAt: true },
  })

  const progressMap = new Map(progress.map((p) => [p.levelId, p]))

  res.json({
    success: true,
    units: units.map((u) => ({
      id: u.id,
      title: u.title,
      category: u.category,
      gradeRange: u.gradeRange,
      orderNo: u.orderNo,
      levels: u.levels.map((l) => {
        const p = progressMap.get(l.id)
        return {
          id: l.id,
          title: l.title,
          orderNo: l.orderNo,
          difficulty: difficultyByOrder(l.orderNo),
          xpReward: l.xpReward,
          progress: p ? { status: p.status, bestScore: p.bestScore, updatedAt: p.updatedAt } : null,
        }
      }),
    })),
  })
})

router.get('/levels/:levelId/questions', async (req: Request, res: Response) => {
  const levelId = req.params.levelId

  const resolved = await resolveUnlockedLevel(req.user!.id, levelId)
  const level = resolved.level

  if (!level) {
    res.status(404).json({ success: false, error: 'LEVEL_NOT_FOUND' })
    return
  }
  if (resolved.lockedByLevel) {
    res.status(403).json({
      success: false,
      error: 'LEVEL_LOCKED',
      requiredLevelId: resolved.lockedByLevel.id,
      requiredLevelTitle: resolved.lockedByLevel.title,
      requiredLevelOrderNo: resolved.lockedByLevel.orderNo,
    })
    return
  }

  let questions = await prisma.question.findMany({
    where: { levelId },
    orderBy: { orderNo: 'asc' },
    select: { id: true, type: true, prompt: true, optionsJson: true, orderNo: true, difficulty: true },
  })

  // ── 自适应排序（方向6） ──
  const ADAPTIVE_ENABLED = true
  if (ADAPTIVE_ENABLED && questions.length > 0) {
    // 获取该学生的历史答题表现
    const pastAttempts = await prisma.attempt.findMany({
      where: { studentId: req.user!.id },
      include: {
        level: { include: { unit: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // 按题型计算历史正确率
    const typeAccuracy = new Map<string, { correct: number; total: number }>()
    for (const a of pastAttempts) {
      const lvlQuestions = a.levelId === levelId ? questions : []
      if (lvlQuestions.length === 0) continue
      const typesInLevel = [...new Set(lvlQuestions.map((q) => q.type))].filter(Boolean)
      for (const t of typesInLevel) {
        const stats = typeAccuracy.get(t) ?? { correct: 0, total: 0 }
        stats.total += a.totalCount
        stats.correct += a.correctCount
        typeAccuracy.set(t, stats)
      }
    }

    // 根据题型难度排序：TRUE_FALSE < SINGLE < SCENARIO
    const typeOrder = ['TRUE_FALSE', 'SINGLE', 'SCENARIO']
    const typeRank = (t: string) => typeOrder.indexOf(t) >= 0 ? typeOrder.indexOf(t) : 2

    // 对每个题目计算自适应优先级
    const scored = questions.map((q) => {
      const stats = typeAccuracy.get(q.type)
      const historyAccuracy = stats && stats.total > 0 ? stats.correct / stats.total : 0.5
      // 优先级：历史正确率高的优先（建立信心），同正确率按题型简单优先
      const priority = historyAccuracy * 100 - typeRank(q.type) * 10
      return { q, priority }
    })
    scored.sort((a, b) => b.priority - a.priority)
    questions = scored.map((s) => s.q)
  }

  res.json({
    success: true,
    level: {
      ...level,
      difficulty: difficultyByOrder(level.orderNo),
      lawRefs: lawRefsForLevel(level.id),
    },
    questions,
  })
})

const SubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string().min(1),
    }),
  ),
})

router.post('/levels/:levelId/submit', async (req: Request, res: Response) => {
  const levelId = req.params.levelId
  const parsed = SubmitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const resolved = await resolveUnlockedLevel(req.user!.id, levelId)
  const level = resolved.level
  if (!level) {
    res.status(404).json({ success: false, error: 'LEVEL_NOT_FOUND' })
    return
  }
  if (resolved.lockedByLevel) {
    res.status(403).json({
      success: false,
      error: 'LEVEL_LOCKED',
      requiredLevelId: resolved.lockedByLevel.id,
      requiredLevelTitle: resolved.lockedByLevel.title,
      requiredLevelOrderNo: resolved.lockedByLevel.orderNo,
    })
    return
  }

  const questions = await prisma.question.findMany({
    where: { levelId },
    orderBy: { orderNo: 'asc' },
    select: { id: true, answerKey: true, explanation: true },
  })

  const answerMap = new Map(parsed.data.answers.map((a) => [a.questionId, a.answer.trim()]))
  let correct = 0

  const details = questions.map((q) => {
    const given = (answerMap.get(q.id) ?? '').toUpperCase()
    const expected = q.answerKey.toUpperCase()
    const ok = given === expected
    if (ok) correct++
    return {
      questionId: q.id,
      given,
      expected,
      correct: ok,
      explanation: q.explanation ?? '',
    }
  })

  const total = questions.length
  const score = total === 0 ? 0 : Math.round((correct / total) * 100)
  const status = score >= 60 ? 'COMPLETED' : 'IN_PROGRESS'

  const [attempt, updatedUser, xpGain] = await prisma.$transaction(async (tx) => {
    const attemptCreated = await tx.attempt.create({
      data: {
        studentId: req.user!.id,
        levelId,
        score,
        correctCount: correct,
        totalCount: total,
      },
    })

    const existing = await tx.userProgress.findUnique({
      where: { studentId_levelId: { studentId: req.user!.id, levelId } },
    })
    const wasCompleted = existing?.status === 'COMPLETED'
    const bestScore = existing ? Math.max(existing.bestScore, score) : score

    await tx.userProgress.upsert({
      where: { studentId_levelId: { studentId: req.user!.id, levelId } },
      update: {
        status,
        bestScore,
      },
      create: {
        studentId: req.user!.id,
        levelId,
        status,
        bestScore: score,
      },
    })

    // XP 按「最佳成绩」结算，且只补发差额。
    //
    // 原先的条件是「只要还没通关就发 XP」，但分数 <60 时状态会一直停在 IN_PROGRESS，
    // wasCompleted 永远为 false，于是同一关卡反复提交低分就能每次拿到 XP，
    // 没有次数上限——等级系统因此形同虚设。
    //
    // 改成差额结算后：未通关的重复提交不再发 XP；首次通关按本次成绩发放；
    // 之后重刷提高最佳成绩只补差额，既堵住了漏洞，也不会让认真重刷的学生吃亏。
    const xpAwardedFor = (best: number, completed: boolean) =>
      completed ? Math.max(1, Math.round(level.xpReward * (best / 100))) : 0
    const prevAwarded = xpAwardedFor(existing?.bestScore ?? 0, wasCompleted)
    const nextAwarded = xpAwardedFor(bestScore, status === 'COMPLETED')
    const xpGain = Math.max(0, nextAwarded - prevAwarded)

    let user = await tx.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, xp: true, level: true },
    })

    if (xpGain > 0 && user) {
      // 用事务内读到的 xp，而不是 req.user.xp，避免并发提交基于过期值计算
      const newXp = user.xp + xpGain
      const newLevel = 1 + Math.floor(newXp / 100)
      user = await tx.user.update({
        where: { id: req.user!.id },
        data: { xp: newXp, level: newLevel },
        select: { id: true, xp: true, level: true },
      })
    }

    return [attemptCreated, user!, xpGain] as const
  })

  res.json({
    success: true,
    result: {
      attemptId: attempt.id,
      score,
      correctCount: correct,
      totalCount: total,
      xpGain,
      status,
    },
    levelMeta: {
      difficulty: difficultyByOrder(level.orderNo),
      lawRefs: lawRefsForLevel(level.id),
    },
    details,
    user: updatedUser,
  })
})

router.get('/summary', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { xp: true, level: true, nickname: true, grade: true },
  })

  const [attemptCount, avgScoreAgg, completedCount, recentAttempts] = await Promise.all([
    prisma.attempt.count({ where: { studentId: req.user!.id } }),
    prisma.attempt.aggregate({ where: { studentId: req.user!.id }, _avg: { score: true } }),
    prisma.userProgress.count({ where: { studentId: req.user!.id, status: 'COMPLETED' } }),
    prisma.attempt.findMany({
      where: { studentId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 180,
      select: { createdAt: true },
    }),
  ])
  const attemptTimes = recentAttempts.map((a) => a.createdAt)
  const streakDays = computeLearningStreakDays(attemptTimes)
  const last7Trend = buildLast7Trend(attemptTimes)
  const weeklyActiveDays = last7Trend.filter((item) => item.count > 0).length
  const weeklyGoalTarget = 5

  res.json({
    success: true,
    profile: user,
    stats: {
      attemptCount,
      avgScore: Math.round(avgScoreAgg._avg.score ?? 0),
      completedLevels: completedCount,
      streakDays,
      weeklyActiveDays,
      weeklyGoalTarget,
      last7Trend,
    },
  })
})

router.get('/review-levels', async (req: Request, res: Response) => {
  const recentAttempts = await prisma.attempt.findMany({
    where: { studentId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 240,
    select: {
      levelId: true,
      score: true,
      createdAt: true,
      level: {
        select: {
          id: true,
          title: true,
          xpReward: true,
          isActive: true,
          unit: {
            select: {
              title: true,
              isActive: true,
            },
          },
        },
      },
    },
  })

  const latestByLevel = new Map<string, (typeof recentAttempts)[number]>()
  for (const attempt of recentAttempts) {
    if (latestByLevel.has(attempt.levelId)) continue
    if (!attempt.level.isActive || !attempt.level.unit.isActive) continue
    latestByLevel.set(attempt.levelId, attempt)
  }

  const reviewLevels = Array.from(latestByLevel.values())
    .filter((attempt) => attempt.score < 100)
    .sort((a, b) => {
      if (a.score === b.score) return b.createdAt.getTime() - a.createdAt.getTime()
      return a.score - b.score
    })
    .slice(0, 3)
    .map((attempt) => ({
      levelId: attempt.level.id,
      title: attempt.level.title,
      unitTitle: attempt.level.unit.title,
      xpReward: attempt.level.xpReward,
      latestScore: attempt.score,
      attemptedAt: attempt.createdAt,
    }))

  res.json({ success: true, reviewLevels })
})

const JoinClassSchema = z.object({ joinCode: z.string().min(4) })

const ComicReadSchema = z.object({ storyId: z.string().min(1) })

router.post('/comic-read', async (req: Request, res: Response) => {
  const parsed = ComicReadSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const { storyId } = parsed.data

  const existing = await prisma.comicRead.findUnique({
    where: { studentId_storyId: { studentId: req.user!.id, storyId } },
  })

  if (existing) {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, xp: true, level: true },
    })
    res.json({ success: true, xpGain: 0, user })
    return
  }

  const xpGain = 10
  const [, user] = await prisma.$transaction([
    prisma.comicRead.create({
      data: { studentId: req.user!.id, storyId },
    }),
    prisma.user.update({
      where: { id: req.user!.id },
      data: {
        xp: { increment: xpGain },
        level: 1 + Math.floor((req.user!.xp + xpGain) / 100),
      },
      select: { id: true, xp: true, level: true },
    }),
  ])

  res.json({ success: true, xpGain, user })
})

const CourtResultSchema = z.object({
  caseId: z.string().min(1),
  score: z.number().min(0),
  maxScore: z.number().min(1),
})

router.post('/court-result', async (req: Request, res: Response) => {
  const parsed = CourtResultSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const pct = parsed.data.score / Math.max(1, parsed.data.maxScore)
  // Award 10–30 XP based on performance
  const xpGain = Math.max(1, Math.round(30 * pct))

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      xp: { increment: xpGain },
      level: 1 + Math.floor((req.user!.xp + xpGain) / 100),
    },
    select: { id: true, xp: true, level: true },
  })

  res.json({ success: true, xpGain, user })
})

router.post('/detective-result', async (req: Request, res: Response) => {
  const parsed = CourtResultSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const pct = parsed.data.score / Math.max(1, parsed.data.maxScore)
  const xpGain = Math.max(1, Math.round(35 * pct))

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      xp: { increment: xpGain },
      level: 1 + Math.floor((req.user!.xp + xpGain) / 100),
    },
    select: { id: true, xp: true, level: true },
  })

  res.json({ success: true, xpGain, user })
})

router.get('/comic-reads', async (req: Request, res: Response) => {
  const reads = await prisma.comicRead.findMany({
    where: { studentId: req.user!.id },
    select: { storyId: true },
  })
  res.json({ success: true, storyIds: reads.map((r) => r.storyId) })
})

router.post('/join-class', async (req: Request, res: Response) => {
  const parsed = JoinClassSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const clazz = await prisma.class.findUnique({ where: { joinCode: parsed.data.joinCode } })
  if (!clazz) {
    res.status(404).json({ success: false, error: 'CLASS_NOT_FOUND' })
    return
  }

  // 一名学生同时只属于一个班级。风险预警要推给唯一的班主任，
  // 也避免同一个学生挂在多位教师的名单里，导致同一条预警重复打扰多人。
  const current = await prisma.classMember.findFirst({
    where: { studentId: req.user!.id },
    select: { classId: true },
  })
  if (current) {
    // 重复提交同一个邀请码视为成功，不要让用户看到报错
    if (current.classId === clazz.id) {
      res.json({ success: true, class: { id: clazz.id, name: clazz.name, joinCode: clazz.joinCode } })
      return
    }
    res.status(409).json({ success: false, error: 'ALREADY_IN_CLASS' })
    return
  }

  await prisma.classMember.create({
    data: { classId: clazz.id, studentId: req.user!.id },
  })

  res.json({ success: true, class: { id: clazz.id, name: clazz.name, joinCode: clazz.joinCode } })
})

/**
 * 退出当前班级。只删除归属关系，学习数据（XP、关卡进度、错题、画像）全部保留，
 * 重新加入任何班级都能接着用。
 */
router.post('/leave-class', async (req: Request, res: Response) => {
  const removed = await prisma.classMember.deleteMany({ where: { studentId: req.user!.id } })
  res.json({ success: true, removed: removed.count })
})

/** 当前所属班级，供学生端展示；未加入任何班级时 class 为 null */
router.get('/my-class', async (req: Request, res: Response) => {
  const membership = await prisma.classMember.findFirst({
    where: { studentId: req.user!.id },
    select: { class: { select: { id: true, name: true, joinCode: true } } },
  })
  res.json({ success: true, class: membership?.class ?? null })
})

router.get('/tasks', async (req: Request, res: Response) => {
  const memberships = await prisma.classMember.findMany({
    where: { studentId: req.user!.id },
    select: { classId: true },
  })
  const classIds = memberships.map((m) => m.classId)
  if (classIds.length === 0) {
    res.json({ success: true, tasks: [] })
    return
  }

  const assignments = await prisma.assignment.findMany({
    where: { classId: { in: classIds } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const subs = await prisma.assignmentSubmission.findMany({
    where: { studentId: req.user!.id, assignmentId: { in: assignments.map((a) => a.id) } },
    select: { assignmentId: true, submittedAt: true },
  })

  const subMap = new Map(subs.map((s) => [s.assignmentId, s]))

  res.json({
    success: true,
    tasks: assignments.map((a) => {
      const s = subMap.get(a.id)
      return {
        id: a.id,
        classId: a.classId,
        targetType: a.targetType,
        targetId: a.targetId,
        dueAt: a.dueAt,
        createdAt: a.createdAt,
        status: s ? 'done' : 'todo',
        submittedAt: s?.submittedAt ?? null,
      }
    }),
  })
})

router.post('/tasks/:assignmentId/submit', async (req: Request, res: Response) => {
  const assignmentId = req.params.assignmentId
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })
  if (!assignment) {
    res.status(404).json({ success: false, error: 'TASK_NOT_FOUND' })
    return
  }

  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: req.user!.id } },
    update: { submittedAt: new Date() },
    create: { assignmentId, studentId: req.user!.id },
  })

  res.json({ success: true })
})

// ── 方向1: 学生画像 ──
router.get('/profile', async (req: Request, res: Response) => {
  const { getStudentProfile } = await import('../lib/studentProfile.js')
  const profile = await getStudentProfile(req.user!.id, req.user!.id)
  res.json({ success: true, profile })
})

// ── 方向4: 智能错题复盘 ──
router.get('/error-analysis', async (req: Request, res: Response) => {
  // 获取最近 240 次答题记录
  const recentAttempts = await prisma.attempt.findMany({
    where: { studentId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 240,
    include: {
      level: {
        include: { unit: true },
      },
    },
  })

  if (recentAttempts.length === 0) {
    res.json({ success: true, analysis: { totalErrors: 0, byTopic: [], byType: [], patterns: [], suggestions: [] } })
    return
  }

  // 按主题聚合错题
  const topicMap = new Map<string, { total: number; correct: number; recentScore: number[] }>()
  const typeMap = new Map<string, { total: number; correct: number }>()
  const levelErrors = new Map<string, number>()
  let totalQ = 0
  let totalC = 0

  for (const a of recentAttempts) {
    const category = a.level.unit.category
    const stats = topicMap.get(category) ?? { total: 0, correct: 0, recentScore: [] }
    stats.total += a.totalCount
    stats.correct += a.correctCount
    stats.recentScore.push(a.score)
    topicMap.set(category, stats)
    totalQ += a.totalCount
    totalC += a.correctCount

    const errors = a.totalCount - a.correctCount
    if (errors > 0) {
      levelErrors.set(a.levelId, (levelErrors.get(a.levelId) ?? 0) + errors)
    }
  }

  // 按题型聚合（从 questions 表反查）
  const levelIds = [...new Set(recentAttempts.map((a) => a.levelId))]
  const questions = await prisma.question.findMany({
    where: { levelId: { in: levelIds } },
    select: { levelId: true, type: true },
  })
  const questionsByLevel = new Map<string, string[]>()
  for (const q of questions) {
    const list = questionsByLevel.get(q.levelId) ?? []
    list.push(q.type)
    questionsByLevel.set(q.levelId, list)
  }

  for (const a of recentAttempts) {
    const types = questionsByLevel.get(a.levelId) ?? []
    const errors = a.totalCount - a.correctCount
    if (errors > 0 && types.length > 0) {
      const errorsPerType = Math.round(errors / types.length)
      for (const t of types) {
        const ts = typeMap.get(t) ?? { total: 0, correct: 0 }
        ts.total += 1
        if (errorsPerType < 1) ts.correct += 1
        typeMap.set(t, ts)
      }
    }
  }

  const byTopic = [...topicMap.entries()]
    .filter(([, s]) => s.total > 0)
    .map(([topic, s]) => ({
      topic,
      total: s.total,
      errors: s.total - s.correct,
      accuracy: Math.round((s.correct / s.total) * 100),
      avgScore: Math.round(s.recentScore.reduce((a, b) => a + b, 0) / s.recentScore.length),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)

  const byType = [...typeMap.entries()]
    .filter(([, s]) => s.total > 0)
    .map(([type, s]) => ({
      type,
      total: s.total,
      errors: s.total - s.correct,
      accuracy: Math.round((s.correct / s.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)

  // 识别错误模式
  const patterns: string[] = []
  const worstTopic = byTopic[0]
  if (worstTopic && worstTopic.accuracy < 70) {
    patterns.push(`你在「${worstTopic.topic}」主题上错误率较高（正确率 ${worstTopic.accuracy}%），建议重点复习该主题的基础概念`)
  }

  const worstType = byType[0]
  if (worstType && worstType.accuracy < 70) {
    const typeLabel = worstType.type === 'SCENARIO' ? '情境分析题' : worstType.type === 'TRUE_FALSE' ? '判断题' : '选择题'
    patterns.push(`你在${typeLabel}上表现较弱（正确率 ${worstType.accuracy}%），需要加强场景判断能力`)
  }

  const totalErrors = totalQ - totalC
  if (totalErrors > 0 && totalQ > 0) {
    const overallAccuracy = Math.round((totalC / totalQ) * 100)
    if (overallAccuracy < 60) {
      patterns.push('整体正确率偏低，建议从基础关卡重新梳理知识体系')
    }
  }

  // 生成改进建议
  const suggestions: string[] = []
  const SUGGESTION_TOPIC: Record<string, string> = {
    '校园法律': '建议重看校园欺凌漫画，复习「拒绝欺凌」主题关卡',
    '网络法律': '建议复习「反诈骗与信息保护」关卡和反诈微动画',
    '家庭法律': '建议复习「监护与隐私」主题的家庭法律相关关卡',
    '消费法律': '建议复习「网游充值与维权」关卡中的消费维权部分',
    '交通安全': '建议复习「交通规则与出行安全」相关关卡',
    '禁毒法律': '建议复习「毒品识别与拒绝技巧」关卡',
  }
  for (const t of byTopic) {
    if (t.accuracy < 65) {
      const suggestion = SUGGESTION_TOPIC[t.topic]
      if (suggestion) suggestions.push(suggestion)
    }
  }
  if (suggestions.length === 0 && totalErrors > 0) {
    suggestions.push('建议每次闯关后仔细阅读错题解析，巩固法律知识点')
  }

  res.json({
    success: true,
    analysis: {
      totalErrors,
      totalQuestions: totalQ,
      overallAccuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
      byTopic,
      byType,
      patterns: patterns.slice(0, 3),
      suggestions: suggestions.slice(0, 3),
    },
  })
})

// ── 方向2: 个性化推荐 ──
router.get('/recommendations', async (req: Request, res: Response) => {
  const { getStudentProfile } = await import('../lib/studentProfile.js')
  const { generateRecommendations } = await import('../lib/recommendationEngine.js')

  const profile = await getStudentProfile(req.user!.id, req.user!.id)
  const recs = await generateRecommendations(req.user!.id, profile)

  res.json({ success: true, recommendations: recs })
})

// ── 方向7: 学习目标 ──
function getShanghaiWeekStart(): Date {
  const now = new Date()
  const shanghai = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
  const day = shanghai.getDay()
  const diff = shanghai.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(shanghai)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

router.get('/goals', async (req: Request, res: Response) => {
  const weekStart = getShanghaiWeekStart()
  const goals = await prisma.studentGoal.findMany({
    where: { studentId: req.user!.id, weekStart },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ success: true, goals })
})

router.post('/goals/generate', async (req: Request, res: Response) => {
  const { getStudentProfile } = await import('../lib/studentProfile.js')
  const profile = await getStudentProfile(req.user!.id, req.user!.id)
  const weekStart = getShanghaiWeekStart()

  // 删除本周旧目标
  await prisma.studentGoal.deleteMany({
    where: { studentId: req.user!.id, weekStart },
  })

  const goals: Array<{ title: string; description: string; targetType: string; targetCount: number }> = []

  // 基于画像生成目标
  const completedLevels = profile.topicMasteries.filter((t) => t.mastery >= 60).length
  const nonZeroTopics = profile.topicMasteries.filter((t) => t.mastery > 0).length

  if (completedLevels < 3) {
    goals.push({
      title: '完成基础闯关',
      description: '本周完成 2 关基础闯关，建立学习节奏',
      targetType: 'COMPLETE_LEVELS',
      targetCount: 2,
    })
  }

  if (profile.overallAccuracy < 70 && profile.totalAttempts > 0) {
    goals.push({
      title: '错题复盘提升',
      description: '本周做 3 次错题复盘，目标是正确率提升到 70% 以上',
      targetType: 'REVIEW_LEVELS',
      targetCount: 3,
    })
  }

  const weakTopics = profile.weakAreas.filter((w) => w.failCount >= 2)
  if (weakTopics.length > 0) {
    goals.push({
      title: '攻克薄弱主题',
      description: `本周重点攻克「${weakTopics[0].topic}」薄弱点，完成相关关卡`,
      targetType: 'COMPLETE_LEVELS',
      targetCount: 1,
    })
  }

  // 默认至少生成一个目标
  if (goals.length === 0) {
    goals.push({
      title: '保持学习节奏',
      description: '本周完成 2 次学习打卡，持续积累',
      targetType: 'DAILY_ACTIVE',
      targetCount: 2,
    })
  }

  // 写入数据库
  const created = await Promise.all(
    goals.map((g) =>
      prisma.studentGoal.create({
        data: {
          studentId: req.user!.id,
          weekStart,
          title: g.title,
          description: g.description,
          targetType: g.targetType,
          targetCount: g.targetCount,
        },
      }),
    ),
  )

  res.json({ success: true, goals: created })
})

// ── 方向6: 关卡难度自适应（修改 question 排序） ──
// 在 GET /levels/:levelId/questions 中已集成自适应排序逻辑

export default router

