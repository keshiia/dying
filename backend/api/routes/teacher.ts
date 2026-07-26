import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('TEACHER'))

function makeJoinCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

router.get('/classes', async (req: Request, res: Response) => {
  const classes = await prisma.class.findMany({
    where: { teacherId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, joinCode: true, createdAt: true },
  })
  res.json({ success: true, classes })
})

const CreateClassSchema = z.object({ name: z.string().min(1).max(80) })

router.post('/classes', async (req: Request, res: Response) => {
  const parsed = CreateClassSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  let code = makeJoinCode()
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.class.findUnique({ where: { joinCode: code } })
    if (!exists) break
    code = makeJoinCode()
  }

  const clazz = await prisma.class.create({
    data: { name: parsed.data.name, teacherId: req.user!.id, joinCode: code },
    select: { id: true, name: true, joinCode: true, createdAt: true },
  })

  res.json({ success: true, class: clazz })
})

router.get('/classes/:classId/members', async (req: Request, res: Response) => {
  const classId = req.params.classId
  const clazz = await prisma.class.findFirst({ where: { id: classId, teacherId: req.user!.id } })
  if (!clazz) {
    res.status(404).json({ success: false, error: 'CLASS_NOT_FOUND' })
    return
  }

  const members = await prisma.classMember.findMany({
    where: { classId },
    select: { student: { select: { id: true, nickname: true, grade: true } } },
  })

  const studentIds = members.map((m) => m.student.id)
  const [attempts, completed] = await Promise.all([
    prisma.attempt.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, score: true },
    }),
    prisma.userProgress.findMany({
      where: { studentId: { in: studentIds }, status: 'COMPLETED' },
      select: { studentId: true },
    }),
  ])

  const attemptAgg = new Map<string, { count: number; sum: number }>()
  for (const a of attempts) {
    const prev = attemptAgg.get(a.studentId) ?? { count: 0, sum: 0 }
    attemptAgg.set(a.studentId, { count: prev.count + 1, sum: prev.sum + a.score })
  }

  const completedAgg = new Map<string, number>()
  for (const p of completed) completedAgg.set(p.studentId, (completedAgg.get(p.studentId) ?? 0) + 1)

  res.json({
    success: true,
    members: members.map((m) => {
      const a = attemptAgg.get(m.student.id)
      const avg = a && a.count ? Math.round(a.sum / a.count) : 0
      return {
        id: m.student.id,
        nickname: m.student.nickname,
        grade: m.student.grade,
        attemptCount: a?.count ?? 0,
        avgScore: avg,
        completedLevels: completedAgg.get(m.student.id) ?? 0,
      }
    }),
  })
})

router.get('/dashboard', async (req: Request, res: Response) => {
  const classId = typeof req.query.classId === 'string' ? req.query.classId : ''
  const clazz = await prisma.class.findFirst({ where: { id: classId, teacherId: req.user!.id } })
  if (!clazz) {
    res.status(404).json({ success: false, error: 'CLASS_NOT_FOUND' })
    return
  }

  const members = await prisma.classMember.findMany({ where: { classId }, select: { studentId: true } })
  const studentIds = members.map((m) => m.studentId)
  const [attemptCount, avgAgg, latestAttempts] = await Promise.all([
    prisma.attempt.count({ where: { studentId: { in: studentIds } } }),
    prisma.attempt.aggregate({ where: { studentId: { in: studentIds } }, _avg: { score: true } }),
    prisma.attempt.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { studentId: true, score: true, createdAt: true },
    }),
  ])

  const activeStudents = new Set(
    latestAttempts
      .filter((a) => a.createdAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
      .map((a) => a.studentId),
  )

  res.json({
    success: true,
    kpi: {
      studentCount: studentIds.length,
      activeStudents: activeStudents.size,
      attemptCount,
      avgScore: Math.round(avgAgg._avg.score ?? 0),
    },
  })
})

const CreateAssignmentSchema = z.object({
  classId: z.string().min(1),
  targetType: z.enum(['LEVEL', 'RESOURCE']),
  targetId: z.string().min(1),
  dueAt: z.string().datetime().optional(),
})

router.post('/assignments', async (req: Request, res: Response) => {
  const parsed = CreateAssignmentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const clazz = await prisma.class.findFirst({ where: { id: parsed.data.classId, teacherId: req.user!.id } })
  if (!clazz) {
    res.status(404).json({ success: false, error: 'CLASS_NOT_FOUND' })
    return
  }

  const assignment = await prisma.assignment.create({
    data: {
      classId: parsed.data.classId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    },
  })

  res.json({ success: true, assignment })
})

router.get('/assignments', async (req: Request, res: Response) => {
  const classId = typeof req.query.classId === 'string' ? req.query.classId : ''
  const clazz = await prisma.class.findFirst({ where: { id: classId, teacherId: req.user!.id } })
  if (!clazz) {
    res.status(404).json({ success: false, error: 'CLASS_NOT_FOUND' })
    return
  }

  const assignments = await prisma.assignment.findMany({
    where: { classId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: { in: assignments.map((a) => a.id) } },
    select: { assignmentId: true },
  })

  const doneCount = new Map<string, number>()
  for (const s of submissions) doneCount.set(s.assignmentId, (doneCount.get(s.assignmentId) ?? 0) + 1)

  res.json({
    success: true,
    assignments: assignments.map((a) => ({
      id: a.id,
      classId: a.classId,
      targetType: a.targetType,
      targetId: a.targetId,
      dueAt: a.dueAt,
      createdAt: a.createdAt,
      doneCount: doneCount.get(a.id) ?? 0,
    })),
  })
})

const CreateResourceSchema = z.object({
  title: z.string().min(1).max(120),
  type: z.enum(['CASE', 'LAW_SUMMARY', 'VIDEO', 'ARTICLE']),
  tags: z.array(z.string().min(1)).max(10).default([]),
  contentUrl: z.string().url().optional(),
  contentMd: z.string().optional(),
})

router.post('/resources', async (req: Request, res: Response) => {
  const parsed = CreateResourceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const resource = await prisma.resource.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      tagsJson: JSON.stringify(parsed.data.tags),
      contentUrl: parsed.data.contentUrl ?? null,
      contentMd: parsed.data.contentMd ?? null,
      createdBy: req.user!.id,
    },
  })

  res.json({ success: true, resource })
})

export default router

