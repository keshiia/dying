import type { User } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, 'id' | 'role' | 'nickname' | 'email' | 'grade' | 'xp' | 'level'>
    }
  }
}

export {}

