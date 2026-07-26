import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { env } from '../lib/env.js'

const router = Router()

router.use(requireAuth)

const ChatSchema = z.object({
  sessionId: z.string().min(6),
  message: z.string().min(1).max(2000),
  context: z
    .object({
      unitId: z.string().optional(),
      levelId: z.string().optional(),
      resourceId: z.string().optional(),
    })
    .optional(),
})

router.post('/chat', async (req: Request, res: Response) => {
  const parsed = ChatSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST' })
    return
  }

  const { message } = parsed.data
  const citations = recommendCitations(message)

  if (!env.OPENAI_API_KEY || !env.OPENAI_BASE_URL) {
    res.json({
      success: true,
      answer:
        '我可以帮你用“学习用途”的方式解释法律概念与风险提示。当前未配置AI密钥，所以我先给你一份学习建议：\n\n1) 先确认情境（校园/网络/家庭/消费）\n2) 先保证安全，再求助可信成年人\n3) 保留证据（截图/聊天记录/转账凭证）\n4) 需要紧急帮助可拨打 110 或 12348\n',
      citations,
    })
    return
  }

  const baseUrl = env.OPENAI_BASE_URL.replace(/\/$/, '')
  const url = `${baseUrl}/v1/chat/completions`

  const system =
    '你是面向初高中生的普法学习助手。你的目标是用简单、温和、可操作的语言解释法律常识与风险提示。\n' +
    '要求：\n' +
    '- 不提供具体法律意见或办案结论，只做学习解释与一般性建议。\n' +
    '- 遇到涉及自伤、暴力、性侵、勒索等高风险内容，优先建议立即求助监护人/老师/报警（110）或12348。\n' +
    '- 内容要适合未成年人阅读，不使用恐吓或刺激性描述。\n' +
    '- 尽量给出3-5条行动清单。\n'

  const body = {
    model: env.OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: message,
      },
    ],
    temperature: 0.4,
  }

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!r.ok) {
    res.status(502).json({ success: false, error: 'AI_UPSTREAM_ERROR' })
    return
  }

  const data = (await r.json()) as unknown
  const answer = readOpenAiAnswer(data)
  res.json({
    success: true,
    answer: answer ?? '我暂时没想好，你可以换个说法问问。',
    citations,
  })
})

function readOpenAiAnswer(data: unknown) {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  const choices = d.choices
  if (!Array.isArray(choices) || choices.length === 0) return null
  const first = choices[0]
  if (typeof first !== 'object' || first === null) return null
  const msg = (first as Record<string, unknown>).message
  if (typeof msg !== 'object' || msg === null) return null
  const content = (msg as Record<string, unknown>).content
  return typeof content === 'string' ? content : null
}

function recommendCitations(text: string) {
  const t = text
  const citations: Array<{ type: 'resource' | 'level'; id: string; label: string }> = []
  if (t.includes('欺凌') || t.includes('霸凌')) {
    citations.push({ type: 'level', id: 'level-campus-1', label: '第一关：什么是校园欺凌？' })
    citations.push({ type: 'resource', id: 'res-1', label: '未成年人保护法摘要：校园欺凌' })
  }
  if (t.includes('诈骗') || t.includes('中奖') || t.includes('转账')) {
    citations.push({ type: 'level', id: 'level-network-1', label: '第一关：识别网络诈骗' })
    citations.push({ type: 'resource', id: 'res-3', label: '反诈微动画（示例链接）' })
  }
  if (t.includes('隐私') || t.includes('照片') || t.includes('肖像')) {
    citations.push({ type: 'resource', id: 'res-2', label: '案例：传播照片的法律风险' })
  }
  if (citations.length === 0) citations.push({ type: 'resource', id: 'res-4', label: '12348法律服务热线' })
  return citations
}

export default router
