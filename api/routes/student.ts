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

  const questions = await prisma.question.findMany({
    where: { levelId },
    orderBy: { orderNo: 'asc' },
    select: { id: true, type: true, prompt: true, optionsJson: true, orderNo: true },
  })

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
  const xpGain = Math.max(1, Math.round(level.xpReward * (score / 100)))

  const [attempt, updatedUser] = await prisma.$transaction(async (tx) => {
    const attemptCreated = await tx.attempt.create({
      data: {
        studentId: req.user!.id,
        levelId,
        score,
        correctCount: correct,
        totalCount: total,
      },
    })

    await tx.userProgress.upsert({
      where: { studentId_levelId: { studentId: req.user!.id, levelId } },
      update: {
        status,
        bestScore: score,
      },
      create: {
        studentId: req.user!.id,
        levelId,
        status,
        bestScore: score,
      },
    })

    const newXp = req.user!.xp + xpGain
    const newLevel = 1 + Math.floor(newXp / 100)
    const user = await tx.user.update({
      where: { id: req.user!.id },
      data: { xp: newXp, level: newLevel },
      select: { id: true, xp: true, level: true },
    })

    return [attemptCreated, user] as const
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

  await prisma.classMember.upsert({
    where: { classId_studentId: { classId: clazz.id, studentId: req.user!.id } },
    update: {},
    create: { classId: clazz.id, studentId: req.user!.id },
  })

  res.json({ success: true, class: { id: clazz.id, name: clazz.name, joinCode: clazz.joinCode } })
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

export default router

