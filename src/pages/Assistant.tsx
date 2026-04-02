import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, ClipboardList, MessageCircleMore, ShieldAlert, Sparkles } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

declare global {
  interface Window {
    CozeWebSDK?: {
      WebChatClient: new (options: Record<string, unknown>) => { destroy?: () => void }
    }
  }
}

const COZE_SDK_SRC =
  'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js'
const COZE_SDK_SCRIPT_ID = 'coze-web-chat-sdk-script'
const COZE_BOT_ID = '7623403522860040246'
const COZE_PAT = 'pat_yViwFlYXce8OzBZea9drm6TZJZYaxwIZQYwhCYplbVPLeV5mYBcPf81tMMZ1o1bh'
const GUIDE_SEEN_KEY = 'assistant-coze-entry-guide-seen'

const QUICK_PROMPTS = [
  '遇到校园欺凌，应该怎么留证据并求助？',
  '我被网络诈骗转账了，第一步该做什么？',
  '未成年人签的消费协议有效吗？',
  '同学传播我的隐私照片，我该怎么维权？',
  '家长翻看我的聊天记录，法律上怎么看？',
  '被诱导借钱给同学，怎么安全处理？',
]

type CozeClient = { destroy?: () => void }

async function ensureCozeSdkLoaded() {
  if (window.CozeWebSDK?.WebChatClient) return

  const existing = document.getElementById(COZE_SDK_SCRIPT_ID) as HTMLScriptElement | null
  if (existing) existing.remove()

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = COZE_SDK_SCRIPT_ID
    script.src = COZE_SDK_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('COZE_SDK_LOAD_FAILED'))
    document.body.appendChild(script)
  })

  if (!window.CozeWebSDK?.WebChatClient) throw new Error('COZE_SDK_NOT_READY')
}

export default function Assistant() {
  const navigate = useNavigate()
  const clientRef = useRef<CozeClient | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorText, setErrorText] = useState('')
  const [hintVisible, setHintVisible] = useState(false)
  const [copyTip, setCopyTip] = useState('')

  const statusMeta = useMemo(() => {
    if (status === 'loading') {
      return {
        label: '连接中',
        cls: 'border-amber-200 bg-amber-50 text-amber-700',
        message: '正在连接智能体，请稍候…',
      }
    }
    if (status === 'error') {
      return {
        label: '连接失败',
        cls: 'border-red-200 bg-red-50 text-red-700',
        message: `智能体加载失败：${errorText || '请刷新页面重试'}`,
      }
    }
    return {
      label: '已连接',
      cls: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      message: '智能体已启动，请点击页面右下角入口开始对话。',
    }
  }, [status, errorText])

  async function copyPrompt(prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyTip('问题已复制，点击右下角聊天入口后直接粘贴发送。')
    } catch {
      setCopyTip('复制失败，请手动复制问题内容。')
    }
    window.setTimeout(() => setCopyTip(''), 2200)
  }

  function dismissGuide() {
    setHintVisible(false)
    localStorage.setItem(GUIDE_SEEN_KEY, '1')
  }

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        setStatus('loading')
        setErrorText('')

        await ensureCozeSdkLoaded()
        if (cancelled) return

        const client = new window.CozeWebSDK!.WebChatClient({
          config: {
            bot_id: COZE_BOT_ID,
          },
          componentProps: {
            title: '青少年普法小助手',
          },
          auth: {
            type: 'token',
            token: COZE_PAT,
            onRefreshToken: function () {
              return COZE_PAT
            },
          },
          // 你给定的官方接入方式：右下角悬浮入口。
          container: 'body',
          position: 'right-bottom',
        }) as CozeClient

        clientRef.current = client
        if (!cancelled) setStatus('ready')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (!cancelled) {
          setErrorText(msg)
          setStatus('error')
        }
      }
    }

    void boot()

    return () => {
      cancelled = true
      if (clientRef.current?.destroy) clientRef.current.destroy()
      clientRef.current = null
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready') return
    const seen = localStorage.getItem(GUIDE_SEEN_KEY) === '1'
    if (seen) return

    setHintVisible(true)
    const timer = window.setTimeout(() => {
      setHintVisible(false)
      localStorage.setItem(GUIDE_SEEN_KEY, '1')
    }, 9000)
    return () => window.clearTimeout(timer)
  }, [status])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1120px] px-4 py-6 pb-24">
        <div className="rounded-3xl border border-white/50 bg-white/45 backdrop-blur-md px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-cyan-200/70 shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-extrabold text-zinc-900">AI普法助手</div>
                <div className="text-sm text-zinc-600">学习用途，不构成法律意见</div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/app/learn')}>
              返回学习
            </Button>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-zinc-700 bg-white/85">
            <span className={`h-2 w-2 rounded-full ${status === 'ready' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
            {statusMeta.label}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-7 p-5 border-white/50 bg-white/55 backdrop-blur-md">
            <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
              <MessageCircleMore className="h-4 w-4 text-sky-600" />
              快速开始
            </div>
            <div className={`mt-3 rounded-2xl border px-3 py-2 text-sm ${statusMeta.cls}`}>{statusMeta.message}</div>

            <div className="mt-4 grid gap-2">
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5">
                <div className="text-xs font-semibold text-zinc-500">步骤 1</div>
                <div className="text-sm font-semibold text-zinc-900 mt-0.5">点击页面右下角聊天入口</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5">
                <div className="text-xs font-semibold text-zinc-500">步骤 2</div>
                <div className="text-sm font-semibold text-zinc-900 mt-0.5">输入你的问题，优先描述场景和时间</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5">
                <div className="text-xs font-semibold text-zinc-500">步骤 3</div>
                <div className="text-sm font-semibold text-zinc-900 mt-0.5">根据回答去任务中心或资源中心继续学习</div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-5 p-5 border-white/50 bg-white/55 backdrop-blur-md">
            <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
              <ClipboardList className="h-4 w-4 text-sky-600" />
              快捷提问
            </div>
            <div className="mt-1 text-xs text-zinc-500">点击问题即可复制，打开右下角聊天入口直接粘贴发送。</div>

            <div className="mt-3 grid gap-2">
              {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void copyPrompt(prompt)}
                  className="text-left rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:border-sky-200 hover:bg-sky-50/60 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              {copyTip || '提示：提问越具体，答复越准确。'}
            </div>
          </Card>

          <Card className="lg:col-span-12 p-5 border-white/50 bg-white/55 backdrop-blur-md">
            <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
              <ShieldAlert className="h-4 w-4 text-sky-600" />
              使用边界
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                法律结论以当地最新法律法规和官方解释为准。
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                紧急危险场景请第一时间联系家长、老师或警方。
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                对个人隐私信息请打码后再提问，避免二次泄露。
              </div>
            </div>
          </Card>
        </div>
      </div>

      {status === 'ready' && hintVisible && (
        <div
          className="fixed right-5 z-30 w-[280px] rounded-2xl border border-sky-200 bg-white/95 backdrop-blur px-3 py-3 shadow-[0_14px_30px_rgba(14,116,144,0.2)]"
          style={{ bottom: 'max(6.2rem, calc(env(safe-area-inset-bottom) + 5.2rem))' }}
        >
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-zinc-900">从这里开始对话</div>
              <div className="mt-1 text-xs text-zinc-600">点击右下角按钮，即可和“青少年普法小助手”聊天。</div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissGuide}
            className="mt-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline-offset-2 hover:underline"
          >
            我知道了
          </button>
          <span className="pointer-events-none absolute -bottom-2 right-9 h-4 w-4 rotate-45 border-r border-b border-sky-200 bg-white/95" />
        </div>
      )}
    </div>
  )
}
