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
      contentMd: true,
      contentUrl: true,
      createdAt: true,
    },
  })

  res.json({
    success: true,
    resources: resources.map((r) => {
      const tags = safeJsonArray(r.tagsJson)
      return {
        id: r.id,
        title: r.title,
        type: r.type,
        contentUrl: r.contentUrl,
        createdAt: r.createdAt,
        tags,
        excerpt: buildExcerpt(r.type, r.contentMd, tags),
      }
    }),
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

function buildExcerpt(
  resourceType: 'CASE' | 'LAW_SUMMARY' | 'VIDEO' | 'ARTICLE',
  contentMd: string | null,
  tags: string[],
): string {
  if (!contentMd || !contentMd.trim()) {
    return tags.length > 0 ? `关键词：${tags.slice(0, 3).join('、')}` : '点击查看完整内容与法条依据。'
  }

  if (resourceType === 'CASE') {
    const caseExcerpt = extractCaseScenario(contentMd)
    if (caseExcerpt) return caseExcerpt
  }
  if (resourceType === 'LAW_SUMMARY') {
    const lawExcerpt = extractLawCommonScene(contentMd)
    if (lawExcerpt) return lawExcerpt
  }

  const firstLine = contentMd
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  const raw = sanitizeText(firstLine ?? contentMd)
  return clampExcerpt(raw)
}

function extractCaseScenario(contentMd: string): string | null {
  const lines = contentMd
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const matched = line.match(/^情境[:：]\s*(.*)$/)
    if (!matched) continue

    const inlineText = matched[1].trim()
    if (inlineText.length > 0) return clampExcerpt(firstSentence(inlineText))

    const nextLine = lines[i + 1]
    if (nextLine) return clampExcerpt(firstSentence(nextLine))
  }

  return null
}

function extractLawCommonScene(contentMd: string): string | null {
  const lines = contentMd
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const matched = line.match(/^常见场景[:：]\s*(.*)$/)
    if (!matched) continue

    const inlineText = normalizeListLine(matched[1])
    if (inlineText.length > 0) return clampExcerpt(`常见场景：${firstSentence(inlineText)}`)

    for (let j = i + 1; j < lines.length; j++) {
      const candidate = lines[j]
      if (/^(正确做法|不要这么做|证据清单)[:：]/.test(candidate)) break
      const normalized = normalizeListLine(candidate)
      if (normalized.length > 0) return clampExcerpt(`常见场景：${firstSentence(normalized)}`)
    }
  }

  return null
}

function firstSentence(text: string): string {
  const normalized = sanitizeText(text)
  const idx = normalized.search(/[。！？!?]/)
  if (idx === -1) return normalized
  return normalized.slice(0, idx + 1).trim()
}

function sanitizeText(text: string): string {
  return text.replace(/[#>*`_-]/g, '').trim()
}

function normalizeListLine(text: string): string {
  return sanitizeText(text.replace(/^[-•·]\s*/, '').trim())
}

function clampExcerpt(text: string): string {
  if (text.length <= 64) return text
  return `${text.slice(0, 64)}...`
}

export default router
