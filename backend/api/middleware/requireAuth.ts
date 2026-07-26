import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyToken } from '../lib/jwt.js'

function readBearer(req: Request) {
  const raw = req.header('authorization')
  if (!raw) return null
  const [kind, token] = raw.split(' ')
  if (kind !== 'Bearer' || !token) return null
  return token
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readBearer(req)
  if (!token) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, nickname: true, email: true, grade: true, xp: true, level: true },
  })

  if (!user) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    return
  }

  req.user = user
  next()
}

