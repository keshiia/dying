import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.use(requireAuth)

const ListQuery = z.object({
  q: z.string().optional(),
  type: z.enum(['CASE', 'LAW_SUMMARY', 'VIDEO', 'ARTICLE']).optional(),
  tag: z.string().optional(),
})

router.get('/', async (req: Request, res: Response) => {
  const parsed = ListQuery.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const { q, type, tag } = parsed.data
  const resources = await prisma.resource.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(q ? { title: { contains: q } } : {}),
      ...(tag ? { tagsJson: { contains: JSON.stringify(tag).replace(/"/g, '') } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      type: true,
      tagsJson: true,
      contentUrl: true,
      createdAt: true,
    },
  })

  res.json({
    success: true,
    resources: resources.map((r) => ({
      ...r,
      tags: safeJsonArray(r.tagsJson),
    })),
  })
})

router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      type: true,
      tagsJson: true,
      contentUrl: true,
      contentMd: true,
      createdAt: true,
      author: { select: { nickname: true } },
    },
  })

  if (!resource) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }

  res.json({
    success: true,
    resource: {
      ...resource,
      tags: safeJsonArray(resource.tagsJson),
      author: resource.author.nickname,
    },
  })
})

function safeJsonArray(input: string): string[] {
  try {
    const v = JSON.parse(input)
    if (Array.isArray(v)) return v.filter((x) => typeof x === 'string')
    return []
  } catch {
    return []
  }
}

export default router

