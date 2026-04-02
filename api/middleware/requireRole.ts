import type { NextFunction, Request, Response } from 'express'

export function requireRole(role: 'STUDENT' | 'TEACHER') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
      return
    }
    if (req.user.role !== role) {
      res.status(403).json({ success: false, error: 'FORBIDDEN' })
      return
    }
    next()
  }
}
