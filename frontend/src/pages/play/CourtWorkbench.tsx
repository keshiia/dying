import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Scale,
  Search,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import Sheet from '@/components/ui/Sheet'
import InterventionCard, { type Intervention } from '@/components/student/InterventionCard'
import {
  courtCases,
  type CourtCaseData,
  type SceneHotspot,
  type EvidenceItem,
} from '@/data/courtCases'
import { apiFetch, errorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { clueKind, clipLabel, MISSED_LIMIT, type GameDetail } from '@/utils/gameDetail'

/**
 * 模拟法庭工作台。
 *
 * 挂在 `/play/court/:caseId`，在 AppShell 之外 —— 与案件侦查同一套外壳语言。
 *
 * 刻意保持不变的部分：**六个阶段内部的交互一律不动**。这是 P1 的边界 ——
 * 法庭的流程（收案→现场调查→法庭调查→法庭辩论→合议裁决→宣判）本身是设计好的，
 * 只换皮不换骨。重做一遍六阶段不会多拿一分，但会让交付晚两周。
 *
 * 真正改掉的是两件事：
 * 1. **详情不再弹窗。** 原来是自绘的居中模态（连 Esc 和滚动锁都要自己写，
 *    与 ui/Modal 行为不一致）。现在是一个常驻的右栏详情面板 —— 点线索、点证据
 *    「查看详情」都往那里送。学生不必记住自己刚才点开了什么。
 * 2. **结算页的复盘卡是暗色版**，与侦查一致。
 */

type StepId = 'intro' | 'scene' | 'trial' | 'debate' | 'deliberation' | 'result'

interface PlayerChoices {
  foundHotspots: string[]
  acceptedEvidence: string[]
  rejectedEvidence: string[]
  debateChoices: Record<string, string>
  selectedLaws: string[]
  verdictChoice: string | null
  penaltyChoice: string | null
}

const EMPTY_CHOICES: PlayerChoices = {
  foundHotspots: [],
  acceptedEvidence: [],
  rejectedEvidence: [],
  debateChoices: {},
  selectedLaws: [],
  verdictChoice: null,
  penaltyChoice: null,
}

const STEPS: { id: StepId; label: string; emoji: string }[] = [
  { id: 'intro', label: '收案', emoji: '📜' },
  { id: 'scene', label: '现场调查', emoji: '🔍' },
  { id: 'trial', label: '法庭调查', emoji: '⚖️' },
  { id: 'debate', label: '法庭辩论', emoji: '💬' },
  { id: 'deliberation', label: '合议裁决', emoji: '🧠' },
  { id: 'result', label: '宣判', emoji: '🏆' },
]

/** 详情面板里显示的东西：线索或证据 */
type DetailTarget = { type: 'hotspot'; data: SceneHotspot } | { type: 'evidence'; data: EvidenceItem }

/**
 * 桌面端是否显示右栏（lg 断点，与 Tailwind 的 lg 对齐）。
 *
 * 必须用 JS 判断而不是纯 CSS：详情抽屉在移动端是「点了线索就自动弹出」的，
 * 而 Sheet 是 fixed 覆盖层 —— 用 class 藏它是藏不住的，桌面上照样盖住内容。
 * 所以得从源头决定要不要把它打开。
 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(min-width: 1024px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

function calcScore(choices: PlayerChoices, theCase: CourtCaseData) {
  const details: { label: string; earned: number; max: number }[] = []

  const sceneFound = choices.foundHotspots.length
  details.push({ label: '🔍 现场搜证', earned: Math.min(sceneFound, 6), max: 6 })

  const evCorrect = theCase.evidence.items.filter(
    (e) =>
      (e.correctAccept && choices.acceptedEvidence.includes(e.id)) ||
      (!e.correctAccept && choices.rejectedEvidence.includes(e.id)),
  ).length
  details.push({ label: '⚖️ 证据审查', earned: evCorrect, max: theCase.evidence.items.length })

  let debateCorrect = 0
  let debateTotal = 0
  for (const stage of theCase.debate.stages) {
    debateTotal++
    const chosen = stage.choices.find((c) => c.id === choices.debateChoices[stage.id])
    if (chosen?.isRecommended) debateCorrect++
  }
  details.push({ label: '💬 法庭辩论', earned: debateCorrect, max: debateTotal })

  const lawCorrect = theCase.deliberation.laws.filter(
    (l) => l.isCorrect && choices.selectedLaws.includes(l.id),
  ).length
  details.push({ label: '📜 法条适用', earned: lawCorrect, max: 1 })

  const verdictCorrect =
    choices.verdictChoice !== null &&
    (theCase.deliberation.verdict.options.find((o) => o.id === choices.verdictChoice)?.isCorrect ??
      false)
  details.push({ label: '⚖️ 裁决', earned: verdictCorrect ? 1 : 0, max: 1 })

  const penalty = theCase.deliberation.penalty
  const penaltyCorrect =
    !!penalty &&
    choices.penaltyChoice !== null &&
    (penalty.options.find((o) => o.id === choices.penaltyChoice)?.isCorrect ?? false)
  if (penalty) {
    details.push({ label: '📋 处分措施', earned: penaltyCorrect ? 1 : 0, max: 1 })
  }

  return {
    score: details.reduce((a, d) => a + d.earned, 0),
    maxScore: details.reduce((a, d) => a + d.max, 0),
    details,
  }
}

/** 与服务端能力轴口径一致，明细全部来自已有的 choices，没有新增埋点 */
function buildDetail(
  choices: PlayerChoices,
  theCase: CourtCaseData,
  durationMs: number,
): GameDetail {
  const missedHotspots = theCase.scene.hotspots.filter((h) => !choices.foundHotspots.includes(h.id))
  const wrongEvidence = theCase.evidence.items.filter((e) =>
    e.correctAccept
      ? !choices.acceptedEvidence.includes(e.id)
      : !choices.rejectedEvidence.includes(e.id),
  )
  const wrongDebate = theCase.debate.stages.filter((s) => {
    const chosen = s.choices.find((c) => c.id === choices.debateChoices[s.id])
    return !chosen?.isRecommended
  })

  const verdictCorrect =
    choices.verdictChoice !== null &&
    (theCase.deliberation.verdict.options.find((o) => o.id === choices.verdictChoice)?.isCorrect ??
      false)
  const penalty = theCase.deliberation.penalty
  const penaltyCorrect =
    !!penalty &&
    choices.penaltyChoice !== null &&
    (penalty.options.find((o) => o.id === choices.penaltyChoice)?.isCorrect ?? false)
  const lawsCorrect = theCase.deliberation.laws.filter(
    (l) => l.isCorrect && choices.selectedLaws.includes(l.id),
  ).length
  // 漏选的正解法条 + 判错的裁决/处分。没有这几项，「法律适用」这条轴的诊断
  // 就永远拿不出对应的举证 —— 只能引用别的轴的东西，那就成了噪音。
  const missedLaws = theCase.deliberation.laws.filter(
    (l) => l.isCorrect && !choices.selectedLaws.includes(l.id),
  )

  return {
    v: 1,
    axes: [
      { axis: 'OBSERVE', correct: Math.min(choices.foundHotspots.length, 6), total: 6 },
      {
        axis: 'EVIDENCE',
        correct: theCase.evidence.items.length - wrongEvidence.length,
        total: theCase.evidence.items.length,
      },
      {
        axis: 'ARGUE',
        correct: theCase.debate.stages.length - wrongDebate.length,
        total: theCase.debate.stages.length,
      },
      {
        axis: 'LAW',
        correct: lawsCorrect + (verdictCorrect ? 1 : 0) + (penaltyCorrect ? 1 : 0),
        total: 2 + (penalty ? 1 : 0),
      },
    ],
    missed: [
      ...missedHotspots.map((h) => ({ label: clipLabel(h.content.title), kind: clueKind(h.type) })),
      ...wrongEvidence.map((e) => ({ label: clipLabel(e.title), kind: 'evidence' as const })),
      ...wrongDebate.map((s) => ({ label: clipLabel(`${s.speaker}的发言`), kind: 'debate' as const })),
      ...missedLaws.map((l) => ({ label: clipLabel(l.name), kind: 'law' as const })),
      ...(verdictCorrect ? [] : [{ label: '裁决结果', kind: 'verdict' as const }]),
      ...(penalty && !penaltyCorrect ? [{ label: '处分措施', kind: 'verdict' as const }] : []),
    ].slice(0, MISSED_LIMIT),
    durationMs,
  }
}

// ── 暗色外壳的共用件 ────────────────────────────────

/** 暗色卡片。不复用 ui/Card —— 那是浅色组件，改它的类名会波及所有学生页 */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10', className)}>
      {children}
    </div>
  )
}

/** 外层滚动、内层普通文档流。见 DetectiveWorkbench 的 ScrollPane 注释 */
function ScrollPane({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-2xl gap-3 px-4 pb-6">{children}</div>
    </div>
  )
}

/**
 * 阶段推进按钮。
 *
 * 未解锁时不用 disabled 的主按钮 —— 灰字压在按钮本身的底色上几乎看不清，
 * 而且「一个按不动的按钮里面写着原因」本身就别扭。换成一条中性提示，
 * 解锁后才是真按钮。
 */
function AdvanceButton({
  ready,
  hint,
  onClick,
  children,
}: {
  ready: boolean
  hint: string
  onClick: () => void
  children: React.ReactNode
}) {
  if (!ready) {
    return (
      <div className="rounded-2xl bg-white/[0.04] py-3.5 text-center text-sm font-bold text-white/50 ring-1 ring-white/10">
        {hint}
      </div>
    )
  }
  return (
    <Button onClick={onClick} className="w-full" size="lg">
      {children}
    </Button>
  )
}

function StepIndicator({ currentStep }: { currentStep: StepId }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep)
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {STEPS.map((s, i) => {
        const isPast = i < currentIdx
        const isNow = i === currentIdx
        return (
          <div key={s.id} className="flex shrink-0 items-center gap-1">
            <div
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all',
                isNow
                  ? 'bg-[var(--p-primary)] text-white'
                  : isPast
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/[0.06] text-white/35',
              )}
            >
              <span className="text-xs">{isPast ? '✅' : s.emoji}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight
                className={clsx('h-3 w-3', isPast ? 'text-emerald-500/60' : 'text-white/20')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** 右栏详情面板。取代原先那份自绘的居中模态 */
function DetailPanel({ target, onClear }: { target: DetailTarget | null; onClear: () => void }) {
  if (!target) {
    return (
      <div className="grid gap-3 p-4">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-white/35">
          案卷详情
        </div>
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-xs leading-relaxed text-white/30">
          点现场里的线索，
          <br />
          或证据上的「查看详情」，
          <br />
          内容会显示在这里
        </div>
      </div>
    )
  }

  const isHotspot = target.type === 'hotspot'
  const emoji = isHotspot ? target.data.emoji : target.data.emoji
  const title = isHotspot ? target.data.content.title : target.data.title
  const detail = isHotspot ? target.data.content.detail : target.data.detail

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start gap-2.5 border-b border-white/10 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-lg">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-white/40">
            {isHotspot ? '现场线索' : '证据材料'}
          </div>
          <div className="text-sm font-extrabold text-white/90">{title}</div>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="关闭详情"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="text-sm leading-relaxed text-white/75">{detail}</p>
        {!isHotspot && !(target.data as EvidenceItem).correctAccept && (
          <div className="mt-3 rounded-2xl bg-amber-500/10 px-3.5 py-3 text-xs leading-relaxed text-amber-100 ring-1 ring-amber-400/25">
            ⚠️ 该证据因{(target.data as EvidenceItem).inadmissibleReason}不应被采纳。
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────

export default function CourtWorkbench() {
  const { caseId = '' } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const theCase = useMemo(() => courtCases.find((c) => c.id === caseId), [caseId])
  const isDesktop = useIsDesktop()

  const [step, setStep] = useState<StepId>('intro')
  const [choices, setChoices] = useState<PlayerChoices>(EMPTY_CHOICES)
  const [animatingHotspot, setAnimatingHotspot] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailTarget | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [startedAt, setStartedAt] = useState(() => Date.now())

  const [submitting, setSubmitting] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const exit = useCallback(() => navigate('/app/games/court'), [navigate])

  // caseId 非法（手敲 URL 或旧链接）→ 回案件列表，而不是白屏
  useEffect(() => {
    if (!theCase) navigate('/app/games/court', { replace: true })
  }, [theCase, navigate])

  useEffect(() => {
    if (!theCase) return
    setStep('intro')
    setChoices(EMPTY_CHOICES)
    setDetail(null)
    setIntervention(null)
    setXpGained(0)
    setSubmitError(null)
    setStartedAt(Date.now())
  }, [theCase])

  const scoreData = useMemo(
    () => (theCase ? calcScore(choices, theCase) : null),
    [theCase, choices],
  )

  function goToStep(s: StepId) {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** 显示详情：桌面进右栏，移动端弹抽屉。桌面**不能**顺手打开抽屉（会盖住整页） */
  function showDetail(target: DetailTarget) {
    setDetail(target)
    if (!isDesktop) setDetailOpen(true)
  }

  function findHotspot(hs: SceneHotspot) {
    if (choices.foundHotspots.includes(hs.id)) {
      // 已经找到过的：只是再看一眼详情，不再计入
      showDetail({ type: 'hotspot', data: hs })
      return
    }
    setAnimatingHotspot(hs.id)
    showDetail({ type: 'hotspot', data: hs })
    setTimeout(() => {
      setChoices((prev) => ({ ...prev, foundHotspots: [...prev.foundHotspots, hs.id] }))
      setAnimatingHotspot(null)
    }, 300)
  }

  function toggleEvidence(evId: string, accept: boolean) {
    setChoices((prev) => ({
      ...prev,
      acceptedEvidence: accept
        ? [...prev.acceptedEvidence.filter((id) => id !== evId), evId]
        : prev.acceptedEvidence.filter((id) => id !== evId),
      rejectedEvidence: !accept
        ? [...prev.rejectedEvidence.filter((id) => id !== evId), evId]
        : prev.rejectedEvidence.filter((id) => id !== evId),
    }))
  }

  function pickDebateChoice(stageId: string, choiceId: string) {
    setChoices((prev) => ({
      ...prev,
      debateChoices: { ...prev.debateChoices, [stageId]: choiceId },
    }))
  }

  function toggleLaw(lawId: string) {
    setChoices((prev) => ({
      ...prev,
      selectedLaws: prev.selectedLaws.includes(lawId)
        ? prev.selectedLaws.filter((id) => id !== lawId)
        : [...prev.selectedLaws, lawId],
    }))
  }

  async function submitResult() {
    if (!theCase) return
    const data = calcScore(choices, theCase)
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await apiFetch<{
        success: true
        xpGain: number
        user: { xp: number; level: number }
        intervention: Intervention | null
      }>('/api/student/court-result', {
        method: 'POST',
        body: JSON.stringify({
          caseId: theCase.id,
          score: data.score,
          maxScore: data.maxScore,
          detail: buildDetail(choices, theCase, Date.now() - startedAt),
        }),
      })
      setXpGained(res.xpGain)
      setIntervention(res.intervention ?? null)
      if (res.user) {
        const store = useAuthStore.getState()
        if (store.token && store.user) {
          store.setAuth(store.token, { ...store.user, xp: res.user.xp, level: res.user.level })
        }
      }
    } catch (e: unknown) {
      // 提交失败不伪造奖励，如实提示并给重试入口
      setXpGained(0)
      setSubmitError(errorMessage(e))
    }
    setSubmitting(false)
    goToStep('result')
  }

  function restart() {
    if (!theCase) return
    setStep('intro')
    setChoices(EMPTY_CHOICES)
    setDetail(null)
    setIntervention(null)
    setXpGained(0)
    setSubmitError(null)
    setStartedAt(Date.now())
  }

  if (!theCase) return <div className="min-h-screen bg-zinc-950" />

  const allHotspotsFound = choices.foundHotspots.length >= theCase.scene.hotspots.length
  const allEvidenceJudged =
    choices.acceptedEvidence.length + choices.rejectedEvidence.length >=
    theCase.evidence.items.length
  const allDebateDone = Object.keys(choices.debateChoices).length >= theCase.debate.stages.length
  const canDeliberate =
    choices.verdictChoice !== null &&
    (theCase.deliberation.penalty ? choices.penaltyChoice !== null : true)

  /** 需要展示右栏面板的阶段：现场调查与法庭调查 */
  const showDetailColumn = step === 'scene' || step === 'trial'

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-950 text-white">
      {/* 顶栏 */}
      <header className="shrink-0 border-b border-white/10 px-3 pb-2 pt-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step === 'intro' || step === 'result' ? exit() : goToStep('intro'))}
            aria-label={step === 'intro' || step === 'result' ? '返回案件列表' : '回到收案'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1 truncate text-sm font-extrabold">
            {theCase.emoji} {theCase.title}
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70 sm:flex">
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            {user?.xp ?? 0} XP
          </div>
          {/* 移动端：打开详情抽屉 */}
          {showDetailColumn && (
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20 lg:hidden"
              aria-label="打开案卷详情"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-2">
          <StepIndicator currentStep={step} />
        </div>
      </header>

      {/* 主体 */}
      <main className="flex min-h-0 flex-1 gap-3 overflow-hidden p-3">
        <section className="min-w-0 flex-1">
          {step === 'intro' && (
            <ScrollPane>
              <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-5">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">📜</span>
                  <div>
                    <div className="text-xl font-black">{theCase.title}</div>
                    <div className="text-sm text-white/80">{theCase.subtitle}</div>
                  </div>
                </div>
              </div>

              <Panel>
                <div className="mb-3 text-sm font-bold text-white/70">📖 案件背景</div>
                <div className="grid gap-3">
                  {theCase.intro.narrative.map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-white/75">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-sky-500/10 p-3.5 ring-1 ring-sky-400/25">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{theCase.intro.plaintiff.avatar}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-sky-100">
                          👤 原告：{theCase.intro.plaintiff.name}
                        </div>
                        <div className="text-xs text-white/50">{theCase.intro.plaintiff.info}</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-rose-500/10 p-3.5 ring-1 ring-rose-400/25">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{theCase.intro.defendant.avatar}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-rose-100">
                          👤 被告：{theCase.intro.defendant.name}
                        </div>
                        <div className="text-xs text-white/50">{theCase.intro.defendant.info}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={() => goToStep('scene')} className="mt-4 w-full" size="lg">
                  开始调查 →
                  <Search className="h-4 w-4 ml-1.5" />
                </Button>
              </Panel>
            </ScrollPane>
          )}

          {step === 'scene' && (
            <ScrollPane>
              <Panel className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-extrabold text-white/90">
                      {theCase.scene.title}
                    </div>
                    <div className="mt-1 text-sm text-white/60">{theCase.scene.description}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-bold text-sky-200">
                    收集 {choices.foundHotspots.length}/{theCase.scene.hotspots.length}
                  </span>
                </div>
              </Panel>

              {/* 现场。六个阶段内部不动：仍是原来那套胶囊热点 */}
              <div
                className={clsx(
                  'relative w-full overflow-hidden rounded-3xl ring-1 ring-white/10',
                  'bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.10),transparent_60%)] bg-zinc-900',
                )}
                style={{ minHeight: 380 }}
              >
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] opacity-[0.06]">
                  {theCase.emoji}
                </span>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />

                {theCase.scene.hotspots.map((hs) => {
                  const found = choices.foundHotspots.includes(hs.id)
                  const isAnimating = animatingHotspot === hs.id
                  return (
                    <button
                      key={hs.id}
                      type="button"
                      onClick={() => findHotspot(hs)}
                      className={clsx(
                        'absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
                        !found && 'animate-soft-pulse cursor-pointer hover:scale-110',
                        isAnimating && 'scale-125',
                      )}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                    >
                      <div
                        className={clsx(
                          'flex items-center gap-1.5 rounded-full px-3 py-2 shadow-lg ring-2 transition-all',
                          found
                            ? 'bg-emerald-500/90 text-white ring-emerald-400/50'
                            : 'bg-white/95 text-zinc-700 ring-sky-400/60',
                        )}
                      >
                        <span className="text-lg">{found ? '✅' : hs.emoji}</span>
                        <span
                          className={clsx(
                            'max-w-[80px] truncate text-xs font-bold',
                            found && 'text-white',
                          )}
                        >
                          {found ? '已发现' : hs.label}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <Panel className="py-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  已收集线索
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {theCase.scene.hotspots.map((hs) => {
                    const found = choices.foundHotspots.includes(hs.id)
                    return (
                      <button
                        key={hs.id}
                        type="button"
                        onClick={() => {
                          if (!found) return
                          showDetail({ type: 'hotspot', data: hs })
                        }}
                        className={clsx(
                          'rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors',
                          found
                            ? 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/25 hover:bg-emerald-500/25'
                            : 'bg-white/[0.04] text-white/25 ring-1 ring-white/10',
                        )}
                      >
                        {found ? `${hs.emoji} ${hs.content.title}` : '❓ 未发现'}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4">
                  <ProgressBar
                    value={(choices.foundHotspots.length / theCase.scene.hotspots.length) * 100}
                    color="blue"
                    animated
                  />
                  <div className="mt-1 text-xs text-white/45">
                    找到 {choices.foundHotspots.length}/{theCase.scene.hotspots.length} 个线索即可进入下一关
                  </div>
                </div>
              </Panel>

              <AdvanceButton
                ready={allHotspotsFound}
                hint={`还需找到 ${theCase.scene.hotspots.length - choices.foundHotspots.length} 个线索`}
                onClick={() => goToStep('trial')}
              >
                进入法庭调查 →
              </AdvanceButton>
            </ScrollPane>
          )}

          {step === 'trial' && (
            <ScrollPane>
              <Panel className="py-4">
                <div className="text-base font-extrabold text-white/90">
                  {theCase.evidence.title}
                </div>
                <div className="mt-1 text-sm text-white/60">{theCase.evidence.description}</div>
              </Panel>

              {theCase.evidence.items.map((ev) => {
                const accepted = choices.acceptedEvidence.includes(ev.id)
                const rejected = choices.rejectedEvidence.includes(ev.id)
                const judged = accepted || rejected
                return (
                  <Panel
                    key={ev.id}
                    className={clsx(
                      'transition-colors',
                      judged &&
                        (accepted
                          ? 'bg-emerald-500/10 ring-emerald-400/25'
                          : 'bg-rose-500/10 ring-rose-400/25'),
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 text-2xl">{ev.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-white/90">{ev.title}</div>
                        <div className="mt-0.5 text-xs text-white/45">
                          {ev.type === 'physical'
                            ? '物证'
                            : ev.type === 'digital'
                              ? '电子证据'
                              : ev.type === 'testimony'
                                ? '证人证言'
                                : '书证'}
                        </div>
                        <div className="mt-2 text-sm leading-relaxed text-white/70">
                          {ev.description}
                        </div>

                        {judged && (
                          <div
                            className={clsx(
                              'mt-2 rounded-xl px-3 py-2.5 text-xs ring-1',
                              accepted
                                ? 'bg-emerald-500/10 text-emerald-100 ring-emerald-400/25'
                                : 'bg-rose-500/10 text-rose-100 ring-rose-400/25',
                            )}
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              {accepted ? '✅ 已采纳' : '❌ 已驳回'}
                            </div>
                            <div className="mt-1 leading-relaxed text-white/65">{ev.detail}</div>
                            {!ev.correctAccept && (
                              <div className="mt-1 text-amber-200">
                                ⚠️ 该证据因{ev.inadmissibleReason}不应被采纳。
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {!judged && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="primary" onClick={() => toggleEvidence(ev.id, true)}>
                          ✅ 采纳
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => toggleEvidence(ev.id, false)}
                        >
                          ❌ 驳回
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            showDetail({ type: 'evidence', data: ev })
                          }}
                          className="ml-1 text-xs font-semibold text-white/45 hover:text-white/80"
                        >
                          查看详情
                        </button>
                      </div>
                    )}
                  </Panel>
                )
              })}

              <Panel className="py-4">
                <ProgressBar
                  value={
                    ((choices.acceptedEvidence.length + choices.rejectedEvidence.length) /
                      theCase.evidence.items.length) *
                    100
                  }
                  color="blue"
                  animated
                />
                <div className="mt-3">
                  <AdvanceButton
                    ready={allEvidenceJudged}
                    hint="请先审查所有证据"
                    onClick={() => goToStep('debate')}
                  >
                    进入法庭辩论 →
                  </AdvanceButton>
                </div>
              </Panel>
            </ScrollPane>
          )}

          {step === 'debate' && (
            <ScrollPane>
              <Panel className="py-4">
                <div className="text-base font-extrabold text-white/90">{theCase.debate.title}</div>
                <div className="mt-1 text-sm text-white/60">{theCase.debate.description}</div>
              </Panel>

              {theCase.debate.stages.map((stage) => {
                const chosenId = choices.debateChoices[stage.id]
                const chosen = stage.choices.find((c) => c.id === chosenId)
                return (
                  <Panel
                    key={stage.id}
                    className={clsx(chosen && 'bg-emerald-500/[0.07] ring-emerald-400/20')}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-xl">{stage.speakerEmoji}</span>
                      <div className="text-sm font-extrabold text-white/90">{stage.speaker}</div>
                    </div>

                    <div className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-white/80">
                      “{stage.dialogue}”
                    </div>

                    {!chosen ? (
                      <div className="mt-3 grid gap-2">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-white/40">
                          你选择如何追问？
                        </div>
                        {stage.choices.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => pickDebateChoice(stage.id, c.id)}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-white/80 transition-colors hover:border-sky-400/40 hover:bg-sky-500/10"
                          >
                            {c.text}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        <div className="rounded-2xl bg-sky-500/10 px-3.5 py-2.5 text-sm font-semibold text-sky-100 ring-1 ring-sky-400/25">
                          🎯 你选择了：{chosen.text}
                        </div>
                        <div className="rounded-2xl bg-white/[0.04] px-3.5 py-3 text-sm leading-relaxed text-white/75 ring-1 ring-white/10">
                          <div className="mb-1 font-bold text-white/85">📢 结果：</div>
                          {chosen.reveal}
                        </div>
                        <div
                          className={clsx(
                            'text-xs font-semibold',
                            chosen.isRecommended ? 'text-emerald-300' : 'text-amber-300',
                          )}
                        >
                          {chosen.feedback}
                        </div>
                      </div>
                    )}
                  </Panel>
                )
              })}

              <Panel className="py-4">
                <ProgressBar
                  value={(Object.keys(choices.debateChoices).length / theCase.debate.stages.length) * 100}
                  color="blue"
                  animated
                />
                <div className="mt-3">
                  <AdvanceButton
                    ready={allDebateDone}
                    hint="请完成全部辩论环节"
                    onClick={() => goToStep('deliberation')}
                  >
                    进入合议裁决 →
                  </AdvanceButton>
                </div>
              </Panel>
            </ScrollPane>
          )}

          {step === 'deliberation' && (
            <ScrollPane>
              <Panel className="py-4">
                <div className="text-base font-extrabold text-white/90">
                  {theCase.deliberation.title}
                </div>
                <div className="mt-1 text-sm text-white/60">{theCase.deliberation.description}</div>
              </Panel>

              <Panel>
                <div className="mb-3 text-sm font-extrabold text-white/85">
                  📜 适用法律（选择你认为最适用的法条）
                </div>
                <div className="grid gap-2.5">
                  {theCase.deliberation.laws.map((law) => {
                    const selected = choices.selectedLaws.includes(law.id)
                    return (
                      <button
                        key={law.id}
                        type="button"
                        onClick={() => toggleLaw(law.id)}
                        className={clsx(
                          'rounded-2xl border px-4 py-3.5 text-left transition-colors',
                          selected
                            ? 'border-emerald-400/50 bg-emerald-500/12'
                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={clsx(
                              'grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold',
                              selected ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/45',
                            )}
                          >
                            {selected ? '✓' : law.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white/90">{law.name}</div>
                            <div className="mt-1 text-xs leading-relaxed text-white/60">
                              {law.summary}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Panel>

              <Panel>
                <div className="mb-3 text-sm font-extrabold text-white/85">
                  ⚖️ {theCase.deliberation.verdict.question}
                </div>
                <div className="grid gap-2.5">
                  {theCase.deliberation.verdict.options.map((opt) => {
                    const selected = choices.verdictChoice === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setChoices((prev) => ({ ...prev, verdictChoice: opt.id }))
                        }
                        className={clsx(
                          'rounded-2xl border px-4 py-3.5 text-left transition-colors',
                          selected
                            ? 'border-emerald-400/50 bg-emerald-500/12'
                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={clsx(
                              'grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold',
                              selected ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/45',
                            )}
                          >
                            {opt.label.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white/90">{opt.label}</div>
                            <div className="mt-0.5 text-xs leading-relaxed text-white/60">
                              {opt.desc}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Panel>

              {theCase.deliberation.penalty && choices.verdictChoice !== null && (
                <Panel className="ring-sky-400/25">
                  <div className="mb-3 text-sm font-extrabold text-white/85">
                    📋 {theCase.deliberation.penalty.question}
                  </div>
                  <div className="grid gap-2.5">
                    {theCase.deliberation.penalty.options.map((opt) => {
                      const selected = choices.penaltyChoice === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setChoices((prev) => ({ ...prev, penaltyChoice: opt.id }))
                          }
                          className={clsx(
                            'rounded-2xl border px-4 py-3.5 text-left transition-colors',
                            selected
                              ? 'border-emerald-400/50 bg-emerald-500/12'
                              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]',
                          )}
                        >
                          <div className="text-sm font-bold text-white/90">{opt.label}</div>
                          <div className="mt-0.5 text-xs leading-relaxed text-white/60">
                            {opt.desc}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Panel>
              )}

              {canDeliberate ? (
                <Button onClick={submitResult} disabled={submitting} className="w-full" size="lg">
                  {submitting ? '⚖️ 宣判中...' : '⚖️ 宣判！'}
                  {!submitting && <Gavel className="h-4 w-4 ml-1.5" />}
                </Button>
              ) : (
                <div className="rounded-2xl bg-white/[0.04] py-3.5 text-center text-sm font-bold text-white/50 ring-1 ring-white/10">
                  请先选出适用法律与裁决结果
                </div>
              )}
            </ScrollPane>
          )}

          {step === 'result' && scoreData && (
            <ScrollPane>
              <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-6 text-center">
                <span className="text-5xl">🏆</span>
                <div className="mt-2 text-2xl font-black">判决完成！</div>
                <div className="mt-1 text-lg font-bold text-white/80">{theCase.title}</div>
                {xpGained > 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2">
                    <Zap className="h-5 w-5 text-yellow-300" />
                    <span className="text-lg font-black">+{xpGained} XP</span>
                  </div>
                )}
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  <span>成绩未能保存：{submitError}</span>
                  <Button size="sm" variant="secondary" onClick={submitResult} disabled={submitting}>
                    {submitting ? '重试中…' : '重试'}
                  </Button>
                </div>
              )}

              <Panel>
                <div className="mb-1 text-base font-extrabold text-white/90">📊 评分报告</div>
                <div className="mb-4 text-sm text-white/50">
                  总分 {scoreData.score}/{scoreData.maxScore}
                  {scoreData.score === scoreData.maxScore
                    ? ' · 🎉 完美判决！你是个出色的法官！'
                    : scoreData.score >= scoreData.maxScore * 0.7
                      ? ' · 👏 干得不错！继续加油！'
                      : ' · 💪 多学法律知识，下次会更好！'}
                </div>
                <div className="grid gap-2">
                  {scoreData.details.map((d) => (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs font-bold text-white/60">
                        {d.label}
                      </span>
                      <div className="flex-1">
                        <ProgressBar
                          value={(d.earned / Math.max(1, d.max)) * 100}
                          size="sm"
                          color={d.earned === d.max ? 'green' : 'blue'}
                        />
                      </div>
                      <span
                        className={clsx(
                          'w-12 text-right text-xs font-extrabold',
                          d.earned === d.max ? 'text-emerald-300' : 'text-white/50',
                        )}
                      >
                        {d.earned}/{d.max}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="bg-emerald-500/10 ring-emerald-400/25">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  正确答案
                </div>
                <div className="grid gap-2.5">
                  <div className="rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
                    <div className="text-xs font-bold uppercase text-white/45">裁决结果</div>
                    <div className="mt-1 text-base font-extrabold text-emerald-200">
                      {theCase.result.correctVerdict}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
                    <div className="text-xs font-bold uppercase text-white/45">适用法律</div>
                    <div className="mt-1 text-sm font-bold text-white/90">
                      {theCase.result.correctLaw}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel className="bg-sky-500/10 ring-sky-400/25">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-sky-200">
                  <Scale className="h-4 w-4" />
                  法律小课堂
                </div>
                <div className="whitespace-pre-line text-sm leading-relaxed text-white/80">
                  {theCase.result.lawExplanation}
                </div>
              </Panel>

              {/* 智能体复盘。放在宣判与法律小课堂之后 —— 学生先看完「正确答案是
                  什么、为什么」，再看自己哪一步偏了。 */}
              <InterventionCard data={intervention} tone="dark" />

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="primary" onClick={restart} className="w-full">
                  🔄 再玩一次
                </Button>
                <Button variant="secondary" onClick={exit} className="w-full">
                  📋 返回案件列表
                </Button>
              </div>
            </ScrollPane>
          )}
        </section>

        {/* 右栏详情。取代原先那份自绘的居中模态 */}
        {showDetailColumn && (
          <aside className="hidden w-80 shrink-0 overflow-hidden rounded-3xl bg-white/[0.03] ring-1 ring-white/10 lg:block">
            <DetailPanel target={detail} onClear={() => setDetail(null)} />
          </aside>
        )}
      </main>

      {/* 移动端：详情抽屉 */}
      {showDetailColumn && (
        <Sheet open={detailOpen && !isDesktop} title="案卷详情" onClose={() => setDetailOpen(false)}>
          <div className="rounded-2xl bg-zinc-900 text-white">
            <DetailPanel target={detail} onClear={() => setDetail(null)} />
          </div>
        </Sheet>
      )}
    </div>
  )
}
