import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, AlertTriangle, Check, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { apiFetch } from '@/utils/api'
import { useRiskStream } from '@/hooks/useRiskStream'

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

type RiskEvent = {
  id: string
  studentId: string
  studentName: string
  studentGrade: string | null
  className: string | null
  kind: string
  level: RiskLevel
  snippet: string
  summary: string | null
  suggestion: string | null
  triggerCount: number
  lastSeenAt: string
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED'
  handledNote: string | null
  handledAt: string | null
  createdAt: string
}

const LEVEL_STYLE: Record<RiskLevel, string> = {
  HIGH: 'bg-red-50 text-red-600 border-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-zinc-50 text-zinc-600 border-zinc-200',
}

const LEVEL_LABEL: Record<RiskLevel, string> = {
  HIGH: '高风险',
  MEDIUM: '需关注',
  LOW: '轻微',
}

type Tab = 'OPEN' | 'HANDLED' | 'ALL'

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'OPEN', label: '待处理' },
  { value: 'HANDLED', label: '已处理' },
  { value: 'ALL', label: '全部' },
]

/** 相对时间：预警的关键是「多久之前」，绝对时间戳反而看不出紧迫程度 */
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  return `${Math.floor(hour / 24)} 天前`
}

export default function RiskAlerts() {
  const [tab, setTab] = useState<Tab>('OPEN')
  const [events, setEvents] = useState<RiskEvent[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState('')
  // 待确认「标为误报」的预警 id
  const [dismissFor, setDismissFor] = useState<string | null>(null)
  const [handling, setHandling] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiFetch<{ success: true; events: RiskEvent[]; openCount: number }>(
        `/api/teacher/risk-events?status=${tab}`,
      )
      setEvents(data.events)
      setOpenCount(data.openCount)
    } catch {
      setError('预警加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    void load()
  }, [load])

  // 学生触发预警时立即刷新，教师不用手动刷新页面
  useRiskStream(() => {
    void load()
  })

  async function handle(id: string, status: 'RESOLVED' | 'DISMISSED', withNote = '') {
    setHandling(true)
    // 成功后要清掉上一次的红色错误条，否则它会一直挂着
    setError(null)
    try {
      await apiFetch(`/api/teacher/risk-events/${id}/handle`, {
        method: 'POST',
        body: JSON.stringify({ status, note: withNote || undefined }),
      })
      setNoteFor(null)
      setNote('')
      setDismissFor(null)
      await load()
    } catch {
      setError('操作失败，请稍后重试')
    } finally {
      setHandling(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-zinc-900">风险预警</div>
            <div className="mt-1 text-sm text-zinc-600">
              学生在 AI 咨询助手中的对话经系统识别后，可能涉及心理或法治风险的内容会汇总到这里。
            </div>
            <div className="mt-2 text-xs leading-relaxed text-zinc-500">
              系统只保留触发预警的原句与自动生成的摘要，不会展示学生的完整对话。
              请以关心而非询问的方式接触学生，必要时联系家长或学校心理老师。
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div role="tablist" className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={
                tab === t.value
                  ? 'rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200'
              }
            >
              {t.label}
              {t.value === 'OPEN' && openCount > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5">{openCount}</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-4 grid gap-3">
          {loading ? (
            <div className="animate-pulse grid gap-2">
              <div className="h-24 bg-zinc-100 rounded-2xl" />
              <div className="h-24 bg-zinc-100 rounded-2xl" />
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              {tab === 'OPEN' ? '当前没有待处理的预警。' : '这里还没有记录。'}
            </div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="rounded-2xl border border-zinc-100 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${LEVEL_STYLE[e.level]}`}
                  >
                    {e.level === 'HIGH' && <AlertTriangle className="h-3 w-3" />}
                    {LEVEL_LABEL[e.level]}
                  </span>
                  <span className="text-sm font-extrabold text-zinc-900">{e.studentName}</span>
                  <span className="text-xs text-zinc-500">
                    {e.className ?? ''}
                    {e.studentGrade ? ` · ${e.studentGrade}` : ''}
                  </span>
                  <span className="text-xs text-zinc-400">· {e.kind}</span>
                  <span className="ml-auto text-xs text-zinc-400">
                    {relativeTime(e.lastSeenAt)}
                    {e.triggerCount > 1 && ` · 共触发 ${e.triggerCount} 次`}
                  </span>
                </div>

                <div className="mt-3 rounded-xl border-l-[3px] border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  「{e.snippet}」
                </div>

                {e.summary && (
                  <div className="mt-2 text-sm text-zinc-700">
                    <span className="font-semibold text-zinc-900">情况：</span>
                    {e.summary}
                  </div>
                )}
                {e.suggestion && (
                  <div className="mt-1 text-sm text-zinc-700">
                    <span className="font-semibold text-zinc-900">建议：</span>
                    {e.suggestion}
                  </div>
                )}

                {e.status !== 'OPEN' && (
                  <div className="mt-2 text-xs text-zinc-500">
                    已标记为{e.status === 'RESOLVED' ? '已处理' : '误报'}
                    {e.handledAt ? ` · ${relativeTime(e.handledAt)}` : ''}
                    {e.handledNote ? ` · 备注：${e.handledNote}` : ''}
                  </div>
                )}

                {e.status === 'OPEN' && (
                  <div className="mt-3">
                    {noteFor === e.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-[220px] flex-1">
                          <Input
                            value={note}
                            onChange={(ev) => setNote(ev.target.value)}
                            placeholder="处理备注，例如：已私下沟通，情绪稳定"
                          />
                        </div>
                        <Button onClick={() => handle(e.id, 'RESOLVED', note)}>确认已处理</Button>
                        <Button variant="ghost" onClick={() => setNoteFor(null)}>
                          取消
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setNoteFor(e.id)
                            setNote('')
                          }}
                        >
                          <Check className="h-4 w-4" /> 标记已处理
                        </Button>
                        {/* 标为误报之后界面没有恢复入口，属于不可撤销操作，
                            原先一击即发；危险性更低的「标记已处理」反倒要两步。 */}
                        <Button variant="ghost" onClick={() => setDismissFor(e.id)}>
                          <X className="h-4 w-4" /> 误报
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!dismissFor}
        title="标为误报？"
        description="这条预警会被标记为误报并归入「已处理」。系统目前没有恢复入口，请确认这是误报。"
        confirmLabel="标为误报"
        danger
        loading={handling}
        onConfirm={() => {
          if (dismissFor) void handle(dismissFor, 'DISMISSED')
        }}
        onClose={() => setDismissFor(null)}
      />
    </div>
  )
}
