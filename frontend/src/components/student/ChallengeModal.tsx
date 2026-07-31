import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import { apiFetch, errorMessage } from '@/utils/api'
import type { Question } from '@/types'
import { safeParseOptions } from '@/components/student/challengeUtils'

type LevelLite = {
  id: string
  title: string
  xpReward: number
}

type Props = {
  openLevel: LevelLite | null
  onClose: () => void
  onCompleted: (data: SubmitData) => Promise<void>
}

type LevelDetail = {
  id: string
  title: string
  xpReward: number
  orderNo: number
  difficulty: '基础' | '进阶' | '挑战' | '实战'
  lawRefs: string[]
}

type LevelQuestionsResponse = {
  success: true
  level: LevelDetail
  questions: Question[]
}

type SubmitData = {
  success: true
  result: {
    score: number
    correctCount: number
    totalCount: number
    xpGain: number
    status: 'COMPLETED' | 'IN_PROGRESS'
  }
  levelMeta: {
    difficulty: '基础' | '进阶' | '挑战' | '实战'
    lawRefs: string[]
  }
  details: Array<{
    questionId: string
    given: string
    expected: string
    correct: boolean
    explanation: string
  }>
  user?: { id: string; xp: number; level: number }
}

export default function ChallengeModal({ openLevel, onClose, onCompleted }: Props) {
  const [level, setLevel] = useState<LevelDetail | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const total = questions.length
  const pct = total ? Math.round((Math.min(step + 1, total) / total) * 100) : 0

  const current = useMemo(() => questions[step] ?? null, [questions, step])

  const answeredCount = useMemo(
    () => questions.filter((q) => (answerMap[q.id] ?? '').trim()).length,
    [answerMap, questions],
  )

  const canGoNext = useMemo(() => {
    if (!current) return false
    return !!(answerMap[current.id] ?? '').trim()
  }, [answerMap, current])

  const allAnswered = total > 0 && answeredCount === total

  async function start(levelId: string) {
    setLoading(true)
    setError(null)
    setResult(null)
    setAnswerMap({})
    setStep(0)

    try {
      const data = await apiFetch<LevelQuestionsResponse>(`/api/student/levels/${levelId}/questions`)
      setLevel(data.level)
      setQuestions(data.questions)
    } catch (e: unknown) {
      setError(errorMessage(e))
      setLevel(null)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const levelId = openLevel?.id
    if (!levelId) return
    void start(levelId)
  }, [openLevel?.id])

  async function submit() {
    if (!level || submitting) return
    if (!allAnswered) {
      setError('请先完成所有题目再提交')
      return
    }

    setSubmitting(true)
    setError(null)

    const answers = questions.map((q) => ({
      questionId: q.id,
      answer: (answerMap[q.id] ?? '').trim(),
    }))

    try {
      const data = await apiFetch<SubmitData>(`/api/student/levels/${level.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      })
      setResult(data)
      await onCompleted(data)
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  function close() {
    setLevel(null)
    setQuestions([])
    setAnswerMap({})
    setStep(0)
    setResult(null)
    setError(null)
    onClose()
  }

  const detailMap = useMemo(() => {
    const map = new Map<string, SubmitData['details'][number]>()
    if (!result) return map
    for (const d of result.details) map.set(d.questionId, d)
    return map
  }, [result])

  return (
    <Modal
      open={!!openLevel}
      title={openLevel ? `闯关：${openLevel.title}` : ''}
      onClose={close}
      className="max-w-3xl"
    >
      {loading && <div className="text-sm text-zinc-600">正在加载题目...</div>}

      {!loading && error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && level && !result && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-zinc-900 truncate">{level.title}</div>
                <div className="mt-1 text-xs text-zinc-600">
                  奖励 {level.xpReward} XP · 已答 {answeredCount}/{total}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-700">
                    难度：{level.difficulty}
                  </span>
                  {level.lawRefs.map((law) => (
                    <span
                      key={law}
                      className="rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      {law}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hidden w-[160px] sm:block">
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    第 {step + 1} / {total} 题
                  </span>
                  {current.difficulty === 1 || current.type === 'TRUE_FALSE' ? null : (
                    <span className="rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200/60">
                      自适应
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {current.type === 'SCENARIO'
                    ? '情景题'
                    : current.type === 'TRUE_FALSE'
                      ? '判断题'
                      : '选择题'}
                </div>
              </div>

              <div className="mt-2 whitespace-pre-line text-sm font-semibold text-zinc-900">
                {current.prompt}
              </div>

              <div className="mt-4 grid gap-2">
                {safeParseOptions(current.optionsJson).map((o) => {
                  const active = (answerMap[current.id] ?? '') === o.key
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        setAnswerMap((m) => ({ ...m, [current.id]: o.key }))
                        setError(null)
                      }}
                      className={clsx(
                        'rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition active:scale-[0.99]',
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
                <Button
                  variant="secondary"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> 上一题
                </Button>

                {step < total - 1 ? (
                  <Button
                    onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                    disabled={!canGoNext}
                  >
                    下一题 <ChevronRight className="ml-1 h-4 w-4" />
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

      {!loading && level && result && (
        <div className="grid gap-4">
          <Card className="border-[color:var(--p-primary)]/20 bg-[color:var(--p-primary)]/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold text-zinc-900">本局结果</div>
                <div className="mt-2 text-sm text-zinc-700">
                  得分 {result.result.score} 分 · 正确 {result.result.correctCount}/{result.result.totalCount} · 获得 {result.result.xpGain} XP
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-700">
                    难度：{result.levelMeta.difficulty}
                  </span>
                  {result.levelMeta.lawRefs.map((law) => (
                    <span
                      key={law}
                      className="rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      {law}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-zinc-600">
                  建议：把错题解析再看一遍，结合法条出处复盘，会提升更快。
                </div>
              </div>

              <div className="hidden sm:block">
                <div
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold text-white',
                    result.result.score >= 60
                      ? 'bg-[color:var(--p-primary)]'
                      : 'bg-[color:var(--p-danger)]',
                  )}
                >
                  {result.result.score >= 60 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {result.result.score >= 60 ? '通关' : '未通关'}
                </div>
              </div>
            </div>
          </Card>

          <div className="rounded-2xl border border-zinc-100 p-4">
            <div className="text-sm font-extrabold text-zinc-900">错题复盘</div>
            <div className="mt-3 grid gap-3">
              {questions.map((q, idx) => {
                const d = detailMap.get(q.id)
                const options = safeParseOptions(q.optionsJson)
                return (
                  <div key={q.id} className="rounded-2xl border border-zinc-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-zinc-500">第 {idx + 1} 题</div>
                      {d && (
                        <div
                          className={clsx(
                            'text-xs font-extrabold',
                            d.correct
                              ? 'text-slate-700'
                              : 'text-[color:var(--p-danger)]',
                          )}
                        >
                          {d.correct ? '正确' : '错误'}
                        </div>
                      )}
                    </div>

                    <div className="mt-1 whitespace-pre-line text-sm font-semibold text-zinc-900">
                      {q.prompt}
                    </div>

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
                      <div className="mt-3 whitespace-pre-line rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700">
                        {d.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => {
                if (!level) return
                void start(level.id)
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> 再来一局
            </Button>
            <Button onClick={close}>返回学习</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
