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
  // 已经取到题目的关卡 id。用于「数据就绪后才渲染弹窗」，见下方 ready 的说明。
  const [loadedLevelId, setLoadedLevelId] = useState<string | null>(null)
  // 每题的判定结果。判定过就锁定该题，不能再改（否则交卷时人人满分）。
  // 判定在服务端做 —— 取题接口不下发 answerKey。
  const [checked, setChecked] = useState<Record<string, { correct: boolean; expected: string }>>({})
  const [checking, setChecking] = useState(false)

  const total = questions.length
  const pct = total ? Math.round((Math.min(step + 1, total) / total) * 100) : 0

  const current = useMemo(() => questions[step] ?? null, [questions, step])
  const currentCheck = current ? checked[current.id] : undefined
  // 正确答案的可读形式：优先显示选项文本，找不到就退回选项字母
  const expectedLabel = useMemo(() => {
    if (!currentCheck || !current) return ''
    const hit = safeParseOptions(current.optionsJson).find(
      (o) => o.key.toUpperCase() === currentCheck.expected.toUpperCase(),
    )
    return hit ? `${hit.key}. ${hit.text}` : currentCheck.expected
  }, [currentCheck, current])

  const answeredCount = useMemo(
    () => questions.filter((q) => checked[q.id]).length,
    [checked, questions],
  )

  // 必须「提交并判定」之后才能进入下一题
  const canGoNext = useMemo(() => {
    if (!current) return false
    return !!checked[current.id]
  }, [checked, current])

  const allAnswered = total > 0 && answeredCount === total

  async function checkCurrent() {
    if (!current || checking || checked[current.id]) return
    const answer = (answerMap[current.id] ?? '').trim()
    if (!answer) return
    setChecking(true)
    setError(null)
    try {
      const data = await apiFetch<{ success: true; correct: boolean; expected: string }>(
        `/api/student/levels/${level.id}/check`,
        { method: 'POST', body: JSON.stringify({ questionId: current.id, answer }) },
      )
      setChecked((m) => ({ ...m, [current.id]: { correct: data.correct, expected: data.expected } }))
    } catch (e: unknown) {
      setError(errorMessage(e))
    } finally {
      setChecking(false)
    }
  }

  async function start(levelId: string) {
    setLoading(true)
    setError(null)
    setResult(null)
    setAnswerMap({})
    setChecked({})
    setStep(0)
    // 取数期间一律不算就绪，否则重开同一关时会拿上一次的题目提前把弹窗打开
    setLoadedLevelId(null)

    try {
      const data = await apiFetch<LevelQuestionsResponse>(`/api/student/levels/${levelId}/questions`)
      setLevel(data.level)
      setQuestions(data.questions)
      setLoadedLevelId(levelId)
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

  // 数据就绪后才渲染弹窗。
  //
  // 原来是立刻打开、题目后到：弹窗先以加载态出现，实测 41ms 时被题目从 139px
  // 撑到 499px，而打开动画有 400ms——布局变化整个落在动画里，看上去就是边长边缩放。
  // 等题目到位再打开，动画跑在稳定布局上（案例中心已用同一方式改好并验证）。
  const ready = !!openLevel && (loadedLevelId === openLevel.id || !!error)

  return (
    <Modal
      open={ready}
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
                  const isExpected =
                    !!currentCheck && o.key.toUpperCase() === currentCheck.expected.toUpperCase()
                  const isWrongPick = !!currentCheck && active && !currentCheck.correct
                  return (
                    <button
                      key={o.key}
                      type="button"
                      disabled={!!currentCheck}
                      onClick={() => {
                        setAnswerMap((m) => ({ ...m, [current.id]: o.key }))
                        setError(null)
                      }}
                      className={clsx(
                        'flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition',
                        !currentCheck && 'active:scale-[0.99]',
                        currentCheck
                          ? isExpected
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : isWrongPick
                              ? 'border-red-300 bg-red-50 text-red-900'
                              : 'border-zinc-200 bg-white text-zinc-400'
                          : active
                            ? 'border-[var(--p-primary)] bg-[color:var(--p-primary)]/10 text-zinc-900'
                            : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="mr-2 text-zinc-500">{o.key}.</span>
                        {o.text}
                      </span>
                      {isExpected && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                      {isWrongPick && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
                    </button>
                  )
                })}
              </div>

              {currentCheck && (
                <div
                  role="status"
                  className={clsx(
                    'mt-3 rounded-2xl border px-4 py-3 text-sm font-semibold',
                    currentCheck.correct
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-red-700',
                  )}
                >
                  {currentCheck.correct
                    ? '✓ 回答正确'
                    : `✗ 回答错误。正确答案是 ${expectedLabel}。题目解析会在交卷后连同全部题目一起展示。`}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> 上一题
                </Button>

                {!currentCheck ? (
                  // 每题一个提交按钮：选中后点它才判定，判定在服务端做，判定后该题锁定
                  <Button
                    onClick={() => void checkCurrent()}
                    disabled={!(answerMap[current.id] ?? '').trim() || checking}
                  >
                    {checking ? '判定中…' : '提交本题'}
                  </Button>
                ) : step < total - 1 ? (
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
