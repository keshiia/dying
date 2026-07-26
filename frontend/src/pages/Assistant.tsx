import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, Bot, User, ChevronLeft, RefreshCw, BookOpen, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import ReactMarkdown from 'react-markdown'
import { apiFetch } from '@/utils/api'

// ── Types ──
type Message = {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

type Citation = {
  type: 'resource' | 'level'
  id: string
  label: string
}

type ChatResponse = {
  success: true
  answer: string
  citations: Citation[]
}

type Session = {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

// ── Quick prompts (4 items, 2×2) ──
const QUICK_PROMPTS = [
  '遇到校园欺凌，怎么留证据并求助？',
  '被网络诈骗转账了，第一步该做什么？',
  '同学传播我的隐私照片，我该怎么维权？',
  '未成年人签的消费协议有效吗？',
]

// ── Helpers ──
function makeId() {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${ts}_${rand}`
}

function makeTitle(msg: string) {
  return msg.length > 20 ? msg.slice(0, 20) + '…' : msg
}

const STORAGE_KEY = 'lft_assistant_sessions'

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Session[]
  } catch {
    return []
  }
}

function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch { /* ignore */ }
}

// ── Component ──
export default function Assistant() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions())
  const [activeId, setActiveId] = useState<string>('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Resolve current session
  const activeSession = sessions.find((s) => s.id === activeId)
  const messages = activeSession?.messages ?? []
  const showQuick = messages.length === 0

  function upsertSession(id: string, updater: (s: Session) => Session) {
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === id ? updater(s) : s))
      saveSessions(next)
      return next
    })
  }

  function newSession() {
    const id = makeId()
    const session: Session = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
    }
    setSessions((prev) => {
      const next = [session, ...prev]
      saveSessions(next)
      return next
    })
    setActiveId(id)
    setInput('')
    setLoading(false)
  }

  function switchSession(id: string) {
    setActiveId(id)
    setInput('')
    setLoading(false)
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      saveSessions(next)
      return next
    })
    if (activeId === id) {
      setActiveId('')
    }
  }

  // Auto-init first session
  useEffect(() => {
    if (!activeId && sessions.length > 0) {
      setActiveId(sessions[0].id)
    }
    if (!activeId && sessions.length === 0) {
      newSession()
    }
  }, [activeId, sessions.length])

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on session switch
  useEffect(() => {
    inputRef.current?.focus()
  }, [activeId])

  async function send(text: string) {
    const msg = text.trim()
    if (!msg || loading || !activeId) return

    const userMsg: Message = { role: 'user', content: msg }
    upsertSession(activeId, (s) => ({
      ...s,
      title: s.messages.length === 0 ? makeTitle(msg) : s.title,
      messages: [...s.messages, userMsg],
    }))
    setInput('')
    setLoading(true)

    try {
      const data = await apiFetch<ChatResponse>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ sessionId: activeId, message: msg }),
      })

      const aiMsg: Message = {
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
      }
      upsertSession(activeId, (s) => ({
        ...s,
        messages: [...s.messages, aiMsg],
      }))
    } catch {
      upsertSession(activeId, (s) => ({
        ...s,
        messages: [...s.messages, { role: 'assistant', content: '抱歉，我暂时无法回答。请稍后重试，或者换个方式描述你的问题。' }],
      }))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <div className="flex h-dvh bg-[var(--p-bg)] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={clsx(
          'flex flex-col shrink-0 h-full bg-white border-r border-zinc-200/60 transition-all duration-300',
          sidebarOpen ? 'w-52' : 'w-0 overflow-hidden border-r-0',
        )}
      >
        <div className="flex items-center gap-2 px-3 h-12 shrink-0 border-b border-zinc-100">
          <div className="flex-1 text-xs font-bold text-zinc-400 tracking-wide">会话</div>
          <button
            type="button"
            onClick={newSession}
            className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            title="新建对话"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
          {sessions.length === 0 && (
            <div className="text-xs text-zinc-400 text-center mt-6">暂无会话</div>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => switchSession(s.id)}
              className={clsx(
                'group relative w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all',
                s.id === activeId
                  ? 'bg-zinc-100'
                  : 'hover:bg-zinc-50',
              )}
            >
              <MessageSquare className={clsx(
                'h-3.5 w-3.5 shrink-0',
                s.id === activeId ? 'text-zinc-700' : 'text-zinc-400',
              )} />
              <span className={clsx(
                'flex-1 text-sm truncate',
                s.id === activeId ? 'font-semibold text-zinc-800' : 'font-medium text-zinc-600',
              )}>
                {s.title}
              </span>
              <span
                role="button"
                onClick={(e) => deleteSession(s.id, e)}
                className="shrink-0 grid h-6 w-6 place-items-center rounded-md text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ── Header ── */}
        <header className="shrink-0 border-b border-white/40 bg-white/70 backdrop-blur-xl px-4 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile back */}
              <button
                type="button"
                onClick={() => navigate('/app/learn')}
                className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500 hover:bg-zinc-100 lg:hidden"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-md shadow-cyan-200/60 shrink-0">
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-extrabold text-zinc-900 truncate">AI普法助手</h1>
                <p className="text-xs text-zinc-500">学习用途 · 不构成法律意见</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/app/learn')}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              <BookOpen className="h-4 w-4" />
              返回学习
            </button>
          </div>
        </header>

        {/* ── Messages ── */}
        <div ref={listRef} className="flex-1 overflow-y-auto scroll-smooth px-4 py-5">
          <div className="mx-auto max-w-3xl grid gap-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-500 shadow-inner mb-4">
                  <Bot className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-extrabold text-zinc-800">有什么法律问题？</h2>
                <p className="mt-1 text-sm text-zinc-500 max-w-sm">描述一个场景，我来帮你分析涉及的法律问题与应对建议</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  'flex gap-3 animate-slide-up',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                <div
                  className={clsx(
                    'mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl shadow-sm',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-zinc-700 to-zinc-800 text-white'
                      : 'bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-cyan-200/60',
                  )}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4.5 w-4.5" strokeWidth={2.3} />
                  ) : (
                    <Bot className="h-4.5 w-4.5" strokeWidth={2.3} />
                  )}
                </div>

                <div className={clsx('max-w-[85%] md:max-w-[75%] min-w-0', msg.role === 'user' && 'order-first')}>
                  <div
                    className={clsx(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-200/70'
                        : 'border border-zinc-200/70 bg-white/90 shadow-sm backdrop-blur-sm',
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-zinc-900 prose-strong:text-zinc-900 prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline prose-code:text-sky-700 prose-code:bg-sky-50 prose-code:px-1 prose-code:rounded prose-pre:bg-zinc-50 prose-pre:border prose-pre:border-zinc-200 prose-blockquote:border-sky-300 prose-blockquote:text-zinc-600 [&>p]:my-1.5 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className={clsx('mt-2 flex flex-wrap gap-1.5', msg.role === 'user' && 'justify-end')}>
                      {msg.citations.map((c, ci) => (
                        <span
                          key={ci}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 text-[11px] font-semibold"
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 animate-slide-up">
                <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-sm shadow-cyan-200/60">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white/90 px-5 py-3.5 shadow-sm">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 ml-1">正在思考…</span>
                </div>
              </div>
            )}

            {/* Quick prompts (only on empty session) */}
            {showQuick && (
              <div className="mt-6 grid grid-cols-2 gap-3 animate-slide-up">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void send(prompt)}
                    className="animate-chip-fade-up rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3.5 text-sm font-semibold text-zinc-700 shadow-sm text-left leading-snug hover:border-sky-200 hover:bg-sky-50/60 hover:text-sky-700 transition-all"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 border-t border-white/40 bg-white/70 backdrop-blur-xl px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="描述你的问题或场景…"
                  rows={1}
                  className="h-12 w-full resize-none rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/40 transition-all"
                  style={{ scrollbarWidth: 'none' }}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => void send(input)}
                disabled={!canSend}
                className={clsx(
                  'grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-all',
                  canSend
                    ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-200/70 hover:shadow-lg hover:from-sky-600 hover:to-cyan-600 active:scale-95'
                    : 'bg-zinc-100 text-zinc-300 cursor-not-allowed',
                )}
              >
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-400 text-center">按 Enter 发送 · Shift+Enter 换行</p>
          </div>
        </div>
      </div>
    </div>
  )
}
