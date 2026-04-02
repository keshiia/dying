import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('STUDENT'))

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
          xpReward: l.xpReward,
          progress: p ? { status: p.status, bestScore: p.bestScore, updatedAt: p.updatedAt } : null,
        }
      }),
    })),
  })
})

router.get('/levels/:levelId/questions', async (req: Request, res: Response) => {
  const levelId = req.params.levelId

  const level = await prisma.level.findFirst({
    where: { id: levelId, isActive: true },
    select: { id: true, title: true, xpReward: true },
  })

  if (!level) {
    res.status(404).json({ success: false, error: 'LEVEL_NOT_FOUND' })
    return
  }

  const questions = await prisma.question.findMany({
    where: { levelId },
    orderBy: { orderNo: 'asc' },
    select: { id: true, type: true, prompt: true, optionsJson: true, orderNo: true },
  })

  res.json({ success: true, level, questions })
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

  const level = await prisma.level.findFirst({
    where: { id: levelId, isActive: true },
    select: { id: true, xpReward: true },
  })
  if (!level) {
    res.status(404).json({ success: false, error: 'LEVEL_NOT_FOUND' })
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
    details,
    user: updatedUser,
  })
})

router.get('/summary', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { xp: true, level: true, nickname: true, grade: true },
  })

  const [attemptCount, avgScoreAgg, completedCount] = await Promise.all([
    prisma.attempt.count({ where: { studentId: req.user!.id } }),
    prisma.attempt.aggregate({ where: { studentId: req.user!.id }, _avg: { score: true } }),
    prisma.userProgress.count({ where: { studentId: req.user!.id, status: 'COMPLETED' } }),
  ])

  res.json({
    success: true,
    profile: user,
    stats: {
      attemptCount,
      avgScore: Math.round(avgScoreAgg._avg.score ?? 0),
      completedLevels: completedCount,
    },
  })
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
