import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { addRiskStreamClient } from '../lib/riskStream.js'

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
  const [attempts, completed, openRisks] = await Promise.all([
    prisma.attempt.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, score: true },
    }),
    prisma.userProgress.findMany({
      where: { studentId: { in: studentIds }, status: 'COMPLETED' },
      select: { studentId: true },
    }),
    // 未处理的风险事件，用于在成员表里给出一个风险标记
    prisma.riskEvent.findMany({
      where: { studentId: { in: studentIds }, status: 'OPEN' },
      select: { studentId: true, level: true },
    }),
  ])

  const RISK_RANK: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 }
  const riskAgg = new Map<string, { count: number; level: string }>()
  for (const r of openRisks) {
    const prev = riskAgg.get(r.studentId)
    const level =
      prev && RISK_RANK[prev.level] >= RISK_RANK[r.level] ? prev.level : r.level
    riskAgg.set(r.studentId, { count: (prev?.count ?? 0) + 1, level })
  }

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
        openRiskCount: riskAgg.get(m.student.id)?.count ?? 0,
        riskLevel: riskAgg.get(m.student.id)?.level ?? null,
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

// ─────────────────────────── 风险预警 ───────────────────────────

function serializeRiskEvent(
  e: {
    id: string
    studentId: string
    kind: string
    level: string
    snippet: string
    summary: string | null
    suggestion: string | null
    triggerCount: number
    lastSeenAt: Date
    status: string
    handledNote: string | null
    handledAt: Date | null
    createdAt: Date
  },
  student: { nickname: string; grade: string | null } | undefined,
  className: string | undefined,
) {
  return {
    id: e.id,
    studentId: e.studentId,
    studentName: student?.nickname ?? '同学',
    studentGrade: student?.grade ?? null,
    className: className ?? null,
    kind: e.kind,
    level: e.level,
    snippet: e.snippet,
    summary: e.summary,
    suggestion: e.suggestion,
    triggerCount: e.triggerCount,
    lastSeenAt: e.lastSeenAt,
    status: e.status,
    handledNote: e.handledNote,
    handledAt: e.handledAt,
    createdAt: e.createdAt,
  }
}

/**
 * 布置任务时选择关卡用。原先教师端让老师手打 `level-campus-1` 这类内部 ID，
 * 既容易填错也没人记得住；这里按单元分组返回可选的关卡。
 */
router.get('/levels', async (_req: Request, res: Response) => {
  const units = await prisma.learningUnit.findMany({
    orderBy: { orderNo: 'asc' },
    select: {
      id: true,
      title: true,
      category: true,
      levels: {
        orderBy: { orderNo: 'asc' },
        select: { id: true, title: true, orderNo: true },
      },
    },
  })
  res.json({ success: true, units })
})

/** 侧边栏角标用：只返回未处理数量，不必为了一个数字拉整个列表 */
router.get('/risk-events/count', async (req: Request, res: Response) => {
  const classes = await prisma.class.findMany({
    where: { teacherId: req.user!.id },
    select: { id: true },
  })
  const classIds = classes.map((c) => c.id)
  const openCount = classIds.length
    ? await prisma.riskEvent.count({ where: { classId: { in: classIds }, status: 'OPEN' } })
    : 0
  res.json({ success: true, openCount })
})

/** 列出本教师各班的风险预警。status 支持 OPEN（默认）/ HANDLED / ALL */
router.get('/risk-events', async (req: Request, res: Response) => {
  const classes = await prisma.class.findMany({
    where: { teacherId: req.user!.id },
    select: { id: true, name: true },
  })
  const classIds = classes.map((c) => c.id)
  const classNameById = new Map(classes.map((c) => [c.id, c.name]))

  const statusParam = typeof req.query.status === 'string' ? req.query.status : 'OPEN'
  const statusIn: Array<'OPEN' | 'RESOLVED' | 'DISMISSED'> | null =
    statusParam === 'ALL'
      ? null
      : statusParam === 'HANDLED'
        ? ['RESOLVED', 'DISMISSED']
        : ['OPEN']

  const events = await prisma.riskEvent.findMany({
    where: {
      classId: { in: classIds },
      ...(statusIn ? { status: { in: statusIn } } : {}),
    },
    orderBy: { lastSeenAt: 'desc' },
    take: 100,
  })

  const studentIds = [...new Set(events.map((e) => e.studentId))]
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, nickname: true, grade: true },
  })
  const studentById = new Map(students.map((s) => [s.id, s]))

  // 侧边栏角标用：未处理总数
  const openCount = classIds.length
    ? await prisma.riskEvent.count({ where: { classId: { in: classIds }, status: 'OPEN' } })
    : 0

  res.json({
    success: true,
    openCount,
    events: events.map((e) =>
      serializeRiskEvent(e, studentById.get(e.studentId), e.classId ? classNameById.get(e.classId) : undefined),
    ),
  })
})

const HandleRiskEventSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  note: z.string().max(500).optional(),
})

/** 标记预警已处理 / 误报。归属校验沿用 classId + teacherId 的方式，越权返回 404 而不是 403 */
router.post('/risk-events/:id/handle', async (req: Request, res: Response) => {
  const parsed = HandleRiskEventSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: req.user!.id },
    select: { id: true },
  })
  const event = await prisma.riskEvent.findFirst({
    where: { id: req.params.id, classId: { in: classes.map((c) => c.id) } },
  })
  if (!event) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }

  const updated = await prisma.riskEvent.update({
    where: { id: event.id },
    data: {
      status: parsed.data.status,
      handledBy: req.user!.id,
      handledNote: parsed.data.note ?? null,
      handledAt: new Date(),
    },
  })

  const student = await prisma.user.findUnique({
    where: { id: updated.studentId },
    select: { nickname: true, grade: true },
  })

  res.json({ success: true, event: serializeRiskEvent(updated, student ?? undefined, undefined) })
})

/**
 * 实时推送通道。前端用 fetch + ReadableStream 消费（原生 EventSource 带不了
 * Authorization 头），收到 risk-event 后重新拉一次列表即可。
 */
router.get('/risk-events/stream', (req: Request, res: Response) => {
  addRiskStreamClient(req.user!.id, res)
})

export default router

