import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { ABILITY_AXES, COMIC_INDEX, type AbilityAxis } from '../lib/contentIndex.js'
import {
  diagnoseAfterGame,
  recomputeSkillAxes,
  type GameDetail,
  type MissedKind,
} from '../lib/agentDiagnosis.js'

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

const CheckAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(200),
})

/**
 * 单题判题。
 *
 * 取题接口刻意不下发 answerKey，所以「答完立刻判对错」必须在服务端做：
 * 学生选中后点「提交」，这里比对并返回对错与正确答案（解析仍留到交卷后统一看）。
 *
 * 顺带把这次作答落库 —— 原先只有每关的总分，错题复盘里的题型正确率只能靠
 * 把错题数按题目数量平均分摊来估算，与题型无关。
 *
 * 关卡解锁校验与取题接口一致：题目必须属于该关卡，避免拿别的关卡的题目 id 探测答案。
 */
router.post('/levels/:levelId/check', async (req: Request, res: Response) => {
  const parsed = CheckAnswerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const resolved = await resolveUnlockedLevel(req.user!.id, req.params.levelId)
  if (!resolved.level) {
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

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
    select: { id: true, levelId: true, answerKey: true },
  })
  if (!question || question.levelId !== req.params.levelId) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }

  const given = parsed.data.answer.trim().toUpperCase()
  const expected = question.answerKey.trim().toUpperCase()
  const correct = given === expected

  try {
    await prisma.questionAnswer.create({
      data: {
        studentId: req.user!.id,
        levelId: question.levelId,
        questionId: question.id,
        answer: given.slice(0, 100),
        correct,
      },
    })
  } catch {
    // 记录失败不应影响判题本身
  }

  res.json({ success: true, correct, expected })
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

// 模拟法庭与案件侦查的判分逻辑和案件数据都在前端，服务端无从复算成绩，
// 只能对客户端上报的数字做钳制，并像关卡一样按最好成绩结算 XP。
const MAX_GAME_SCORE = 200

/**
 * 单局明细。它由前端上报、服务端无法复算，所以形状和大小都必须卡死 ——
 * 否则这就是一个可以塞任意 JSON 的口子。
 *
 * `.strict()` 挡多余键；数组长度与标签长度都设了上限，单条 JSON 约 8 KB 封顶。
 * 注意它**只用于诊断**，绝不参与 XP 结算（XP 仍只由 score/maxScore 驱动）。
 */
const MissedKindSchema = z.enum([
  'clue-physical',
  'clue-digital',
  'clue-testimony',
  'clue-observation',
  'evidence',
  'debate',
  'law',
  'verdict',
])

// 断言输出类型。原因是后端 tsconfig 里 `"strict": false`（strictNullChecks 关闭）——
// zod 判断属性是否可选用的 `undefined extends T[k]` 在关闭 strictNullChecks 后恒为真，
// 于是 `z.output` 把对象的每个属性都算成可选，直接传给需要必填字段的函数会报错。
// 运行时校验完全不受影响（.strict() 与各 max 上限照常生效），受影响的只是类型。
//
// 这里不改 tsconfig：打开 strict 会让整个后端（既有 schema、既有路由）一起爆错，
// 远超本次改动范围。等哪天要整体收紧类型时，这一处可以直接删掉断言。
const DetailSchema = z
  .object({
    v: z.literal(1),
    axes: z
      .array(
        z.object({
          // ABILITY_AXES 是 as const 的只读元组，z.enum 的签名要可变元组
          axis: z.enum(ABILITY_AXES as unknown as [AbilityAxis, ...AbilityAxis[]]),
          correct: z.number().int().min(0).max(200),
          total: z.number().int().min(0).max(200),
        }),
      )
      .max(ABILITY_AXES.length),
    missed: z
      .array(
        z.object({
          label: z.string().min(1).max(40),
          kind: MissedKindSchema,
        }),
      )
      .max(40),
    durationMs: z.number().int().min(0).max(6 * 60 * 60 * 1000),
  })
  .strict() as unknown as z.ZodType<GameDetail, z.ZodTypeDef, unknown>

const GameResultSchema = z.object({
  caseId: z.string().min(1).max(120),
  score: z.number().min(0).max(MAX_GAME_SCORE),
  maxScore: z.number().min(1).max(MAX_GAME_SCORE),
  detail: DetailSchema.optional(),
})

/** 完成度百分比 → XP。0 分保底不发，否则空提交可以反复薅 */
const gameXpFor = (pctInt: number, cap: number) =>
  pctInt <= 0 ? 0 : Math.max(1, Math.round((cap * pctInt) / 100))

/**
 * 结算一局游戏成绩。
 *
 * 两处防护：
 * - clamp 完成度到 [0,1]，挡住 `{score: 1e9, maxScore: 1}` 一次请求把等级刷满
 * - 按同一案件的历史最好成绩「只补差额」，否则反复提交同一个 caseId 就能反复拿 XP
 */
async function settleGameResult(
  studentId: string,
  gameType: 'COURT' | 'DETECTIVE',
  input: { caseId: string; score: number; maxScore: number; detail?: GameDetail },
  cap: number,
) {
  const pct = Math.min(1, Math.max(0, input.score / Math.max(1, input.maxScore)))
  const pctInt = Math.round(pct * 100)
  const key = { studentId, gameType, caseId: input.caseId }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.gameResult.findUnique({
      where: { studentId_gameType_caseId: key },
    })

    const prevAwarded = gameXpFor(existing?.bestPct ?? 0, cap)
    const bestPct = Math.max(existing?.bestPct ?? 0, pctInt)
    const xpGain = Math.max(0, gameXpFor(bestPct, cap) - prevAwarded)
    // detail 描述的是**最好那一局**，只在刷新记录时覆盖。
    // 否则重玩一局打得更差会把能力轴拉低 —— 练习反而让画像变糟，说不通。
    const improves = pctInt > (existing?.bestPct ?? 0) || !existing
    const detail = input.detail as unknown as object | undefined

    await tx.gameResult.upsert({
      where: { studentId_gameType_caseId: key },
      update: improves && detail ? { bestPct, detail } : { bestPct },
      create: { ...key, bestPct, detail },
    })

    const current = await tx.user.findUnique({
      where: { id: studentId },
      select: { id: true, xp: true, level: true },
    })
    if (!current || xpGain <= 0) return { xpGain: 0, user: current }

    const newXp = current.xp + xpGain
    const user = await tx.user.update({
      where: { id: studentId },
      data: { xp: newXp, level: 1 + Math.floor(newXp / 100) },
      select: { id: true, xp: true, level: true },
    })
    return { xpGain, user }
  })
}

/**
 * 结算一局并顺带产出智能体诊断。
 *
 * 诊断搭在结算响应里返回，不另开接口 —— 学生点完"揭晓真相"本来就要等这一次
 * 请求，多一次往返只会让复盘卡片迟到。诊断失败也绝不能让结算失败（XP 已经
 * 发了），所以整段包在 try 里，失败就只回 xpGain。
 */
async function settleAndDiagnose(
  req: Request,
  res: Response,
  gameType: 'COURT' | 'DETECTIVE',
  cap: number,
) {
  const parsed = GameResultSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const { caseId, score, maxScore, detail } = parsed.data
  const { xpGain, user } = await settleGameResult(req.user!.id, gameType, { caseId, score, maxScore, detail }, cap)

  let intervention = null
  if (detail) {
    try {
      intervention = await diagnoseAfterGame(req.user!.id, gameType, caseId, detail as GameDetail)
    } catch {
      // 诊断是锦上添花，不能把已经发出去的 XP 一起吞掉
    }
  }

  res.json({ success: true, xpGain, user, intervention })
}

router.post('/court-result', (req: Request, res: Response) =>
  settleAndDiagnose(req, res, 'COURT', 30),
)

router.post('/detective-result', (req: Request, res: Response) =>
  settleAndDiagnose(req, res, 'DETECTIVE', 35),
)

router.get('/comic-reads', async (req: Request, res: Response) => {
  const reads = await prisma.comicRead.findMany({
    where: { studentId: req.user!.id },
    select: { storyId: true, quizOptionId: true, quizCorrect: true },
  })

  // quizResults 让阅读器能把答过的题显示成答过的 —— 否则每次打开
  // 都像没做过，学生会反复作答（并且以为自己没答过）
  const quizResults: Record<string, { optionId: string; correct: boolean }> = {}
  for (const r of reads) {
    if (r.quizOptionId) {
      quizResults[r.storyId] = { optionId: r.quizOptionId, correct: r.quizCorrect ?? false }
    }
  }

  res.json({ success: true, storyIds: reads.map((r) => r.storyId), quizResults })
})

const ComicQuizSchema = z.object({
  storyId: z.string().min(1).max(120),
  optionId: z.string().min(1).max(8),
})

/**
 * 漫画读完后那道总结题的作答。
 *
 * 与「读完 +10 XP」分开成两个接口，是因为它们是两件事：读完就该给 XP
 * （低门槛入口的定位不能动），答对是额外的 +5。合在一起会让「不答题就拿不到
 * 阅读 XP」，把入口变成一道关卡。
 *
 * 对错在服务端判 —— 这是一次直接发放的 XP，不像游戏成绩那样受"最好成绩差额"
 * 保护，交给客户端自报等于白送。
 */
router.post('/comic-quiz', async (req: Request, res: Response) => {
  const parsed = ComicQuizSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const { storyId, optionId } = parsed.data
  const comic = COMIC_INDEX[storyId]
  if (!comic) {
    res.status(404).json({ success: false, error: 'COMIC_NOT_FOUND' })
    return
  }

  const read = await prisma.comicRead.findUnique({
    where: { studentId_storyId: { studentId: req.user!.id, storyId } },
  })
  // 没读过就不给答 —— 否则可以绕开阅读直接刷满所有漫画的 +5
  if (!read) {
    res.status(409).json({ success: false, error: 'NOT_READ_YET' })
    return
  }

  // 只认第一次作答，重复提交返回既有结果而不重复发 XP
  if (read.quizOptionId) {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, xp: true, level: true },
    })
    res.json({ success: true, correct: read.quizCorrect ?? false, xpGain: 0, user })
    return
  }

  const correct = optionId === comic.quizCorrectId
  const xpGain = correct ? 5 : 0

  const [, user] = await prisma.$transaction([
    prisma.comicRead.update({
      where: { studentId_storyId: { studentId: req.user!.id, storyId } },
      data: { quizOptionId: optionId, quizCorrect: correct },
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

  // 漫画总结题计入「证据审查」轴。这里立刻重算，否则学生答完题回 Learn 页
  // 看到的还是旧数据 —— 闭环的最后一环要当场合上，不能等下一次游戏结算。
  try {
    await recomputeSkillAxes(req.user!.id)
  } catch {
    // 画像刷新失败不该让作答失败，XP 已经发出去了
  }

  res.json({ success: true, correct, xpGain, user })
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

  // 按题型聚合 —— 用真正的逐题作答记录。
  //
  // 此前这里是把每关的错题数按题目数量平均分摊来估算：某关 5 题错 1~2 题则
  // 所有题型都算 100%，错 3 题以上则全部算 0%，阈值卡在 50%，与题型毫无关系。
  // 那种「情境分析题正确率低」的结论其实是编出来的，现在改为真实统计。
  const answerRecords = await prisma.questionAnswer.findMany({
    where: { studentId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 800,
    select: { questionId: true, correct: true, question: { select: { type: true } } },
  })
  // 同一题多次作答只取最近一次
  const seenQuestions = new Set<string>()
  for (const rec of answerRecords) {
    if (seenQuestions.has(rec.questionId)) continue
    seenQuestions.add(rec.questionId)
    const ts = typeMap.get(rec.question.type) ?? { total: 0, correct: 0 }
    ts.total += 1
    if (rec.correct) ts.correct += 1
    typeMap.set(rec.question.type, ts)
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

