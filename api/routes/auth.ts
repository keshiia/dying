import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import { signToken } from '../lib/jwt.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['student', 'teacher']),
  nickname: z.string().min(1).max(20),
  grade: z.string().min(1).max(20).optional(),
})

router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  if (parsed.data.role === 'teacher' && !env.ALLOW_TEACHER_SELF_REGISTER) {
    res.status(403).json({ success: false, error: 'TEACHER_REGISTER_DISABLED' })
    return
  }

  const role = parsed.data.role === 'teacher' ? 'TEACHER' : 'STUDENT'
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) {
    res.status(409).json({ success: false, error: 'EMAIL_EXISTS' })
    return
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role,
      nickname: parsed.data.nickname,
      grade: parsed.data.grade ?? null,
    },
    select: { id: true, role: true, nickname: true, email: true, grade: true, xp: true, level: true },
  })

  const token = signToken({ sub: user.id, role: user.role })
  res.json({ success: true, token, user })
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) {
    res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS' })
    return
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!ok) {
    res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS' })
    return
  }

  const token = signToken({ sub: user.id, role: user.role })
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      role: user.role,
      nickname: user.nickname,
      email: user.email,
      grade: user.grade,
      xp: user.xp,
      level: user.level,
    },
  })
})

router.post('/logout', async (req: Request, res: Response) => {
  res.json({ success: true })
})

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  res.json({ success: true, user: req.user })
})

export default router
