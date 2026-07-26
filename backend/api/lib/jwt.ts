import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from './env.js'

export type AppJwtPayload = {
  sub: string
  role: 'STUDENT' | 'TEACHER'
}

export function signToken(payload: AppJwtPayload) {
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn })
}

export function verifyToken(token: string): AppJwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (typeof decoded !== 'object' || decoded === null) return null
    const d = decoded as Record<string, unknown>
    const sub = d.sub
    const role = d.role
    if (typeof sub !== 'string') return null
    if (role !== 'STUDENT' && role !== 'TEACHER') return null
    return { sub, role }
  } catch {
    return null
  }
}
