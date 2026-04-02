import { useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import { apiFetch } from '@/utils/api'
import type { AiCitation } from '@/types'
import { Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function Assistant() {
  const navigate = useNavigate()
  const [sessionId] = useState(() => String(Date.now()))
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [citations, setCitations] = useState<AiCitation[]>([])

  const canSend = useMemo(() => text.trim().length > 0 && !loading, [text, loading])

  async function send() {
    const content = text.trim()
    if (!content) return
    setText('')
    setLoading(true)
    setMessages((m) => [...m, { role: 'user', content }])
    try {
      const data = await apiFetch<{ success: true; answer: string; citations: AiCitation[] }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message: content }),
      })
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }])
      setCitations(data.citations)
    } finally {
      setLoading(false)
    }
  }

  function jump(c: AiCitation) {
    if (c.type === 'level') navigate('/app/learn')
    else navigate('/app/resources')
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1120px] px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-[var(--p-accent)] text-white flex items-center justify-center shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-zinc-900">AI普法助手</div>
              <div className="text-sm text-zinc-600">学习用途，不构成法律意见</div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate('/app/learn')}>
            返回学习
          </Button>
        </div>

        <Card className="mt-5 p-4">
          <div className="rounded-2xl bg-[color:var(--p-warning)]/10 border border-[color:var(--p-warning)]/25 px-4 py-3 text-sm text-zinc-800">
            如果你遇到紧急危险或严重侵害，请立即求助可信成年人，并拨打 110 或 12348。
          </div>

          <div className="mt-4 h-[460px] overflow-auto rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
            {messages.length === 0 ? (
              <div className="text-sm text-zinc-600">你可以问：遇到网络诈骗怎么办？校园欺凌如何求助？隐私照片被传播怎么处理？</div>
            ) : (
              <div className="grid gap-3">
                {messages.map((m, idx) => (
                  <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[80%] rounded-2xl bg-white border border-zinc-200 px-4 py-3 text-sm text-zinc-900'
                          : 'max-w-[80%] rounded-2xl bg-[color:var(--p-accent)]/10 border border-[color:var(--p-accent)]/20 px-4 py-3 text-sm text-zinc-900 whitespace-pre-line'
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && <div className="text-sm text-zinc-500">正在思考...</div>}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="输入你的问题（例如：同学在群里骂我怎么办？）"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void send()
                }}
              />
            </div>
            <Button onClick={send} disabled={!canSend}>
              发送
            </Button>
          </div>

          <div className="mt-4">
            <div className="text-xs text-zinc-500">推荐继续学习</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {citations.map((c) => (
                <button
                  key={c.type + c.id}
                  type="button"
                  onClick={() => jump(c)}
                  className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-200"
                >
                  {c.type === 'level' ? '关卡：' : '资源：'}{c.label}
                </button>
              ))}
              {citations.length === 0 && <Tag>暂无推荐</Tag>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

