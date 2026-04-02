import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import { apiFetch, errorMessage } from '@/utils/api'
import type { Question } from '@/types'
import { CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { safeParseOptions } from '@/components/student/challengeUtils'

type LevelLite = {
  id: string
  title: string
  xpReward: number
}

type Props = {
  openLevel: LevelLite | null
  onClose: () => void
  onCompleted: () => Promise<void>
}

type LevelQuestions = {
  level: { id: string; title: string; xpReward: number }
  questions: Question[]
}

type SubmitData = {
  success: true
  result: { score: number; correctCount: number; totalCount: number; xpGain: number; status: 'COMPLETED' | 'IN_PROGRESS' }
  details: Array<{ questionId: string; given: string; expected: string; correct: boolean; explanation: string }>
}

export default function ChallengeModal({ openLevel, onClose, onCompleted }: Props) {
  const [lq, setLq] = useState<LevelQuestions | null>(null)
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const total = lq?.questions.length ?? 0
  const pct = total ? Math.round(((Math.min(step + 1, total)) / total) * 100) : 0

  const current = useMemo(() => {
    if (!lq) return null
    return lq.questions[step] ?? null
  }, [lq, step])

  const answeredCount = useMemo(() => {
    if (!lq) return 0
    return lq.questions.filter((q) => (answerMap[q.id] ?? '').trim()).length
  }, [answerMap, lq])

  const canGoNext = useMemo(() => {
    if (!current) return false
    return !!(answerMap[current.id] ?? '').trim()
  }, [answerMap, current])

  const allAnswered = useMemo(() => {
    if (!lq) return false
    return answeredCount === lq.questions.length
  }, [answeredCount, lq])

  async function start(levelId: string) {
    setLoading(true)
    setError(null)
    setResult(null)
    setAnswerMap({})
    setStep(0)
    try {
      const data = await apiFetch<{ success: true; level: { id: string; title: string; xpReward: number }; questions: Question[] }>(
        `/api/student/levels/${levelId}/questions`,
      )
      setLq({ level: data.level, questions: data.questions })
    } catch (e: unknown) {
      setError(errorMessage(e))
      setLq(null)
    } finally {
      setLoading(false)
    }
  }

  const openLevelId = openLevel?.id ?? null

  useEffect(() => {
    if (!openLevelId) return
    void start(openLevelId)
  }, [openLevelId])

  async function submit() {
    if (!lq || submitting) return
    if (!allAnswered) {
      setError('请先完成所有题目再提交')
      return
    }
    setSubmitting(true)
    setError(null)
    const answers = lq.questions.map((q) => ({ questionId: q.id, answer: (answerMap[q.id] ?? '').trim() }))
    try {
      const data = await apiFetch<SubmitData>(`/api/student/levels/${lq.level.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      })
      setResult(data)
      await onCompleted()
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  function close() {
    setLq(null)
    setAnswerMap({})
    setStep(0)
    setResult(null)
    setError(null)
    onClose()
  }

  const detailMap = useMemo(() => {
    const m = new Map<string, SubmitData['details'][number]>()
    if (!result) return m
    for (const d of result.details) m.set(d.questionId, d)
    return m
  }, [result])

  return (
    <Modal open={!!openLevel} title={openLevel ? `闯关：${openLevel.title}` : ''} onClose={close} className="max-w-3xl">
      {loading && <div className="text-sm text-zinc-600">正在加载题目...</div>}
      {!loading && error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}

      {!loading && lq && !result && (
        <div className="grid gap-4">
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-zinc-900 truncate">{lq.level.title}</div>
                <div className="mt-1 text-xs text-zinc-600">奖励 {lq.level.xpReward} XP · 已答 {answeredCount}/{total}</div>
              </div>
              <div className="w-[160px] hidden sm:block">
                <ProgressBar value={pct} />
              </div>
            </div>
            <div className="mt-3 sm:hidden">
              <ProgressBar value={pct} />
            </div>
          </div>

          {current && (
            <div className="rounded-2xl border border-zinc-100 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">第 {step + 1} / {total} 题</div>
                <div className="text-xs text-zinc-500">{current.type === 'SCENARIO' ? '情景题' : current.type === 'TRUE_FALSE' ? '判断题' : '选择题'}</div>
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-900 whitespace-pre-line">{current.prompt}</div>

              <div className="mt-4 grid gap-2">
                {safeParseOptions(current.optionsJson).map((o) => {
                  const value = answerMap[current.id] ?? ''
                  const active = value === o.key
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        setAnswerMap((m) => ({ ...m, [current.id]: o.key }))
                        setError(null)
                      }}
                      className={clsx(
                        'rounded-2xl border px-4 py-3 text-sm font-semibold transition active:scale-[0.99] text-left',
                        active
                          ? 'border-[var(--p-primary)] bg-[color:var(--p-primary)]/10 text-zinc-900'
                          : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50',
                      )}
                    >
                      <span className="mr-2 text-zinc-500">{o.key}.</span>
                      {o.text}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                  <ChevronLeft className="h-4 w-4 mr-1" />上一题
                </Button>
                {step < total - 1 ? (
                  <Button onClick={() => setStep((s) => Math.min(total - 1, s + 1))} disabled={!canGoNext}>
                    下一题<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={submit} disabled={!allAnswered || submitting}>
                    {submitting ? '提交中...' : '完成并交卷'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && lq && result && (
        <div className="grid gap-4">
          <Card className="p-4 bg-[color:var(--p-primary)]/5 border-[color:var(--p-primary)]/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold text-zinc-900">本局结果</div>
                <div className="mt-2 text-sm text-zinc-700">
                  得分 {result.result.score} 分 · 正确 {result.result.correctCount}/{result.result.totalCount} · 获得 {result.result.xpGain} XP
                </div>
                <div className="mt-2 text-xs text-zinc-600">建议：把错题的“解释”读一遍，再来一局会更稳。</div>
              </div>
              <div className="hidden sm:block">
                <div className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold', result.result.score >= 60 ? 'bg-[color:var(--p-primary)] text-white' : 'bg-[color:var(--p-danger)] text-white')}>
                  {result.result.score >= 60 ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {result.result.score >= 60 ? '通关' : '未通关'}
                </div>
              </div>
            </div>
          </Card>

          <div className="rounded-2xl border border-zinc-100 p-4">
            <div className="text-sm font-extrabold text-zinc-900">错题复盘</div>
            <div className="mt-3 grid gap-3">
              {lq.questions.map((q, idx) => {
                const d = detailMap.get(q.id)
                const options = safeParseOptions(q.optionsJson)
                return (
                  <div key={q.id} className="rounded-2xl border border-zinc-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-zinc-500">第 {idx + 1} 题</div>
                      {d && (
                        <div className={clsx('text-xs font-extrabold', d.correct ? 'text-[color:var(--p-primary)]' : 'text-[color:var(--p-danger)]')}>
                          {d.correct ? '正确' : '错误'}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900 whitespace-pre-line">{q.prompt}</div>
                    <div className="mt-3 grid gap-2">
                      {options.map((o) => {
                        const expected = (d?.expected ?? '').toUpperCase()
                        const given = (d?.given ?? '').toUpperCase()
                        const isExpected = expected === o.key.toUpperCase()
                        const isGiven = given === o.key.toUpperCase()
                        return (
                          <div
                            key={o.key}
                            className={clsx(
                              'rounded-2xl border px-4 py-3 text-sm font-semibold',
                              isExpected
                                ? 'border-[color:var(--p-primary)] bg-[color:var(--p-primary)]/10'
                                : isGiven
                                  ? 'border-[color:var(--p-danger)] bg-[color:var(--p-danger)]/10'
                                  : 'border-zinc-200 bg-white',
                            )}
                          >
                            <span className="mr-2 text-zinc-500">{o.key}.</span>
                            {o.text}
                          </div>
                        )
                      })}
                    </div>
                    {d?.explanation && (
                      <div className="mt-3 rounded-2xl bg-zinc-50 border border-zinc-100 p-3 text-sm text-zinc-700 whitespace-pre-line">
                        {d.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                if (!lq) return
                void start(lq.level.id)
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />再来一局
            </Button>
            <Button onClick={close}>返回学习</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
