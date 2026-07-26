import { useState, useCallback, useMemo } from 'react'
import { clsx } from 'clsx'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Search,
  Scale,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import Tag from '@/components/ui/Tag'
import { courtCases, type CourtCaseData, type SceneHotspot, type EvidenceItem, type DebateStage } from '@/data/courtCases'
import { apiFetch } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

// ── Types ──────────────────────────────────────────

type StepId = 'intro' | 'scene' | 'trial' | 'debate' | 'deliberation' | 'result'

interface PlayerChoices {
  foundHotspots: string[]       // IDs of found hotspots
  acceptedEvidence: string[]     // IDs of accepted evidence
  rejectedEvidence: string[]     // IDs of rejected evidence
  debateChoices: Record<string, string>  // debateStageId → choiceId
  selectedLaws: string[]         // IDs of selected laws
  verdictChoice: string | null   // verdict option ID
  penaltyChoice: string | null   // penalty option ID
}

const STEPS: { id: StepId; label: string; emoji: string }[] = [
  { id: 'intro', label: '收案', emoji: '📜' },
  { id: 'scene', label: '现场调查', emoji: '🔍' },
  { id: 'trial', label: '法庭调查', emoji: '⚖️' },
  { id: 'debate', label: '法庭辩论', emoji: '💬' },
  { id: 'deliberation', label: '合议裁决', emoji: '🧠' },
  { id: 'result', label: '宣判', emoji: '🏆' },
]

// ── Helpers ────────────────────────────────────────

function calcScore(choices: PlayerChoices, theCase: CourtCaseData): { score: number; maxScore: number; details: { label: string; earned: number; max: number }[] } {
  const details: { label: string; earned: number; max: number }[] = []

  // Scene investigation (max 6)
  const sceneFound = choices.foundHotspots.length
  details.push({ label: '🔍 现场搜证', earned: Math.min(sceneFound, 6), max: 6 })

  // Evidence (max 6)
  const evCorrect = theCase.evidence.items.filter(
    (e) =>
      (e.correctAccept && choices.acceptedEvidence.includes(e.id)) ||
      (!e.correctAccept && choices.rejectedEvidence.includes(e.id)),
  ).length
  details.push({ label: '⚖️ 证据审查', earned: evCorrect, max: theCase.evidence.items.length })

  // Debate (sum of recommended choices)
  let debateCorrect = 0
  let debateTotal = 0
  for (const stage of theCase.debate.stages) {
    debateTotal++
    const chosenId = choices.debateChoices[stage.id]
    const chosen = stage.choices.find((c) => c.id === chosenId)
    if (chosen?.isRecommended) debateCorrect++
  }
  details.push({ label: '💬 法庭辩论', earned: debateCorrect, max: debateTotal })

  // Laws
  const lawCorrect = theCase.deliberation.laws.filter(
    (l) => l.isCorrect && choices.selectedLaws.includes(l.id),
  ).length
  details.push({ label: '📜 法条适用', earned: lawCorrect, max: 1 })

  // Verdict
  const verdictCorrect =
    choices.verdictChoice !== null &&
    theCase.deliberation.verdict.options.find((o) => o.id === choices.verdictChoice)?.isCorrect
  details.push({ label: '⚖️ 裁决', earned: verdictCorrect ? 1 : 0, max: 1 })

  // Penalty
  let penaltyCorrect = 0
  if (theCase.deliberation.penalty && choices.penaltyChoice !== null) {
    const pc = theCase.deliberation.penalty.options.find((o) => o.id === choices.penaltyChoice)?.isCorrect
    penaltyCorrect = pc ? 1 : 0
    details.push({ label: '📋 处分措施', earned: penaltyCorrect, max: 1 })
  }

  const totalEarned = details.reduce((a, d) => a + d.earned, 0)
  const totalMax = details.reduce((a, d) => a + d.max, 0)
  return { score: totalEarned, maxScore: totalMax, details }
}

// ── Step Components ────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: StepId }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep)
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {STEPS.map((s, i) => {
        const isPast = i < currentIdx
        const isNow = i === currentIdx
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <div
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                isNow
                  ? 'bg-gradient-to-r from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white shadow-md'
                  : isPast
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-zinc-100 text-zinc-400',
              )}
            >
              <span className="text-sm">{isPast ? '✅' : s.emoji}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className={clsx('h-3.5 w-3.5', isPast ? 'text-emerald-400' : 'text-zinc-300')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────

export default function Court() {
  const [activeCase, setActiveCase] = useState<CourtCaseData | null>(null)
  const [step, setStep] = useState<StepId>('intro')
  const [choices, setChoices] = useState<PlayerChoices>({
    foundHotspots: [],
    acceptedEvidence: [],
    rejectedEvidence: [],
    debateChoices: {},
    selectedLaws: [],
    verdictChoice: null,
    penaltyChoice: null,
  })
  const [animatingHotspot, setAnimatingHotspot] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)

  // Viewing a detail modal
  const [detailModal, setDetailModal] = useState<{ type: 'hotspot' | 'evidence'; data: unknown } | null>(null)

  const theCase = activeCase

  function startCase(c: CourtCaseData) {
    setActiveCase(c)
    setStep('intro')
    setChoices({
      foundHotspots: [],
      acceptedEvidence: [],
      rejectedEvidence: [],
      debateChoices: {},
      selectedLaws: [],
      verdictChoice: null,
      penaltyChoice: null,
    })
  }

  function goToStep(s: StepId) {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Scene Investigation ──
  function findHotspot(hs: SceneHotspot) {
    if (choices.foundHotspots.includes(hs.id)) return
    setAnimatingHotspot(hs.id)
    setDetailModal({ type: 'hotspot', data: hs })
    setTimeout(() => {
      setChoices((prev) => ({ ...prev, foundHotspots: [...prev.foundHotspots, hs.id] }))
      setAnimatingHotspot(null)
    }, 300)
  }

  const allHotspotsFound = theCase && choices.foundHotspots.length >= theCase.scene.hotspots.length

  // ── Evidence ──
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

  const allEvidenceJudged =
    theCase && choices.acceptedEvidence.length + choices.rejectedEvidence.length >= theCase.evidence.items.length

  // ── Debate ──
  function pickDebateChoice(stageId: string, choiceId: string) {
    setChoices((prev) => ({ ...prev, debateChoices: { ...prev.debateChoices, [stageId]: choiceId } }))
  }

  const allDebateDone = theCase && Object.keys(choices.debateChoices).length >= theCase.debate.stages.length

  // ── Deliberation ──
  function toggleLaw(lawId: string) {
    setChoices((prev) => ({
      ...prev,
      selectedLaws: prev.selectedLaws.includes(lawId)
        ? prev.selectedLaws.filter((id) => id !== lawId)
        : [...prev.selectedLaws, lawId],
    }))
  }

  function pickVerdict(optId: string) {
    setChoices((prev) => ({ ...prev, verdictChoice: optId }))
  }

  function pickPenalty(optId: string) {
    setChoices((prev) => ({ ...prev, penaltyChoice: optId }))
  }

  const canDeliberate =
    choices.verdictChoice !== null &&
    (theCase?.deliberation.penalty ? choices.penaltyChoice !== null : true)

  // ── Result submission ──
  const [submitting, setSubmitting] = useState(false)
  const [xpGained, setXpGained] = useState(0)

  const scoreData = theCase ? calcScore(choices, theCase) : null

  async function submitResult() {
    if (!theCase || !scoreData) return
    setSubmitting(true)
    // Simulate a slight delay for the "submitting" feel
    await new Promise((r) => setTimeout(r, 800))
    try {
      const res = await apiFetch<{ success: true; xpGain: number; user: { xp: number; level: number } }>(
        '/api/student/court-result',
        {
          method: 'POST',
          body: JSON.stringify({
            caseId: theCase.id,
            score: scoreData.score,
            maxScore: scoreData.maxScore,
          }),
        },
      )
      setXpGained(res.xpGain)
      if (res.user) {
        const store = useAuthStore.getState()
        if (store.token && store.user) {
          store.setAuth(store.token, { ...store.user, xp: res.user.xp, level: res.user.level })
        }
      }
    } catch {
      // Offline fallback — still show result
      setXpGained(theCase.result.xpReward)
    }
    setSubmitting(false)
    goToStep('result')
  }

  // ── Render ────────────────────────────────────────

  // Menu: case selection
  if (!theCase) {
    return (
      <div className="grid gap-5">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-6 text-white shadow-lg shadow-orange-200">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⚖️</span>
            <div>
              <div className="text-xl font-black">模拟法庭</div>
              <div className="mt-1 text-sm text-white/80">当一回小法官，用法律知识裁决真实案件</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">互动判案</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">学法用法</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">+XP</span>
          </div>
        </div>

        {/* Case list */}
        <div className="text-sm font-extrabold text-zinc-800">选择案件</div>
        <div className="grid gap-4">
          {courtCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => startCase(c)}
              className="group rounded-3xl border-2 border-zinc-200 bg-white overflow-hidden text-left transition-all hover:border-amber-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.emoji}</span>
                  <div>
                    <div className="text-lg font-extrabold text-zinc-900 group-hover:text-amber-700 transition-colors">
                      {c.title}
                    </div>
                    <div className="text-sm font-semibold text-zinc-500">{c.subtitle}</div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600">
                  <Gavel className="h-4 w-4 text-amber-500" />
                  6 个关卡 · {c.result.xpReward} XP
                </div>
                <span className="text-sm font-bold text-amber-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  开始审理
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {courtCases.length === 0 && (
          <Card className="p-8 text-center">
            <span className="text-5xl">⚖️</span>
            <div className="mt-3 text-base font-extrabold text-zinc-900">案件正在准备中</div>
            <div className="mt-1 text-sm text-zinc-500">敬请期待模拟法庭上线</div>
          </Card>
        )}
      </div>
    )
  }

  // Game playing
  return (
    <div className="grid gap-4">
      {/* Top bar */}
      <div className="rounded-2xl bg-white border border-zinc-200/80 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={() => {
              if (step === 'result') {
                setActiveCase(null)
              } else if (step === 'intro') {
                setActiveCase(null)
              } else {
                goToStep('intro')
              }
            }}
            className="flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 'result' ? '返回案件列表' : '返回'}
          </button>
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            <span className="text-lg">{theCase.emoji}</span>
            <span className="hidden sm:inline">{theCase.title}</span>
          </div>
          {user && (
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              {user.xp} XP
            </div>
          )}
        </div>
        <StepIndicator currentStep={step} />
      </div>

      {/* ── STEP: Intro ── */}
      {step === 'intro' && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">📜</span>
              <div>
                <div className="text-xl font-black">{theCase.title}</div>
                <div className="text-sm text-white/80">{theCase.subtitle}</div>
              </div>
            </div>
          </div>

          <div className="p-5 grid gap-4">
            <div className="text-sm font-bold text-zinc-700">📖 案件背景</div>
            <div className="grid gap-3">
              {theCase.intro.narrative.map((para, i) => (
                <p key={i} className="text-sm text-zinc-700 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{theCase.intro.plaintiff.avatar}</span>
                  <div>
                    <div className="text-sm font-extrabold text-zinc-900">
                      👤 原告：{theCase.intro.plaintiff.name}
                    </div>
                    <div className="text-xs text-zinc-500">{theCase.intro.plaintiff.info}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{theCase.intro.defendant.avatar}</span>
                  <div>
                    <div className="text-sm font-extrabold text-zinc-900">
                      👤 被告：{theCase.intro.defendant.name}
                    </div>
                    <div className="text-xs text-zinc-500">{theCase.intro.defendant.info}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2">
              <Button
                onClick={() => goToStep('scene')}
                className="w-full"
                size="lg"
              >
                开始调查 →
                <Search className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── STEP: Scene Investigation ── */}
      {step === 'scene' && (
        <div className="grid gap-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-extrabold text-zinc-900">{theCase.scene.title}</div>
                <div className="mt-1 text-sm text-zinc-600">{theCase.scene.description}</div>
              </div>
              <Tag color="blue">
                收集 {choices.foundHotspots.length}/{theCase.scene.hotspots.length}
              </Tag>
            </div>
          </Card>

          {/* Scene canvas */}
          <div
            className={clsx(
              'relative w-full rounded-3xl overflow-hidden border-2 border-zinc-200',
              'bg-gradient-to-br',
              theCase.scene.bgColor,
            )}
            style={{ minHeight: 420 }}
          >
            {/* Decorative scene elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-200/30 to-transparent" />
              {/* Floor line */}
              <div className="absolute bottom-16 left-0 right-0 h-0.5 bg-zinc-300/40" />
              {/* Some background decorations */}
              <span className="absolute top-6 left-8 text-6xl opacity-30">🏛️</span>
              <span className="absolute top-4 right-8 text-5xl opacity-25">🌳</span>
              <span className="absolute bottom-8 left-12 text-4xl opacity-20">🚪</span>
              <span className="absolute bottom-8 right-16 text-4xl opacity-20">🪟</span>
            </div>

            {/* Hotspots */}
            {theCase.scene.hotspots.map((hs) => {
              const found = choices.foundHotspots.includes(hs.id)
              const isAnimating = animatingHotspot === hs.id
              return (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => findHotspot(hs)}
                  disabled={found}
                  className={clsx(
                    'absolute transition-all duration-300',
                    found
                      ? 'opacity-100 scale-100'
                      : 'hover:scale-110 animate-soft-pulse cursor-pointer',
                    isAnimating && 'scale-125',
                  )}
                  style={{ left: `${hs.x}%`, top: `${hs.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div
                    className={clsx(
                      'flex items-center gap-1.5 rounded-full px-3 py-2 shadow-lg transition-all',
                      found
                        ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                        : 'bg-white/95 text-zinc-700 ring-2 ring-amber-300 hover:bg-amber-50',
                    )}
                  >
                    <span className="text-lg">{found ? '✅' : hs.emoji}</span>
                    <span className={clsx('text-xs font-bold truncate max-w-[80px]', found && 'text-white')}>
                      {found ? '已发现' : hs.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Collected items bar */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              已收集线索
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {theCase.scene.hotspots.map((hs) => {
                const found = choices.foundHotspots.includes(hs.id)
                return (
                  <div
                    key={hs.id}
                    className={clsx(
                      'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                      found
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-200',
                    )}
                  >
                    {found ? `${hs.emoji} ${hs.content.title}` : '❓ 未发现'}
                  </div>
                )
              })}
            </div>

            <div className="mt-4">
              <ProgressBar
                value={(choices.foundHotspots.length / theCase.scene.hotspots.length) * 100}
                color="orange"
                animated
              />
              <div className="mt-1 text-xs text-zinc-500">
                找到 {choices.foundHotspots.length}/{theCase.scene.hotspots.length} 个线索即可进入下一关
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={() => goToStep('trial')}
                disabled={!allHotspotsFound}
                className="w-full"
              >
                {allHotspotsFound ? '进入法庭调查 →' : `还需找到 ${theCase.scene.hotspots.length - choices.foundHotspots.length} 个线索`}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── STEP: Trial (Evidence) ── */}
      {step === 'trial' && (
        <div className="grid gap-4">
          <Card className="p-5">
            <div className="text-base font-extrabold text-zinc-900">{theCase.evidence.title}</div>
            <div className="mt-1 text-sm text-zinc-600">{theCase.evidence.description}</div>
          </Card>

          {theCase.evidence.items.map((ev) => {
            const accepted = choices.acceptedEvidence.includes(ev.id)
            const rejected = choices.rejectedEvidence.includes(ev.id)
            const judged = accepted || rejected
            return (
              <Card
                key={ev.id}
                className={clsx(
                  'p-4 transition-all',
                  judged && (accepted ? 'border-emerald-300 bg-emerald-50/50' : 'border-rose-300 bg-rose-50/50'),
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{ev.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-zinc-900">{ev.title}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">{ev.type === 'physical' ? '物证' : ev.type === 'digital' ? '电子证据' : ev.type === 'testimony' ? '证人证言' : '书证'}</div>
                    <div className="mt-2 text-sm text-zinc-700 leading-relaxed">{ev.description}</div>

                    {judged && (
                      <div className={clsx('mt-2 rounded-xl p-3 text-xs font-semibold', accepted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
                        <div className="flex items-center gap-1.5">
                          {accepted ? '✅ 已采纳' : '❌ 已驳回'}
                        </div>
                        <div className="mt-1 font-normal text-zinc-600">{ev.detail}</div>
                        {!ev.correctAccept && (
                          <div className="mt-1 text-rose-700">⚠️ 该证据因{ev.inadmissibleReason}不应被采纳。</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!judged && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => toggleEvidence(ev.id, true)}
                    >
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
                      onClick={() => setDetailModal({ type: 'evidence', data: ev })}
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 ml-2"
                    >
                      查看详情
                    </button>
                  </div>
                )}
              </Card>
            )
          })}

          <Card className="p-4">
            <ProgressBar
              value={(choices.acceptedEvidence.length + choices.rejectedEvidence.length) / theCase.evidence.items.length * 100}
              color="blue"
              animated
            />
            <div className="mt-4">
              <Button
                onClick={() => goToStep('debate')}
                disabled={!allEvidenceJudged}
                className="w-full"
              >
                {allEvidenceJudged ? '进入法庭辩论 →' : '请先审查所有证据'}                </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── STEP: Debate ── */}
      {step === 'debate' && (
        <div className="grid gap-4">
          <Card className="p-5">
            <div className="text-base font-extrabold text-zinc-900">{theCase.debate.title}</div>
            <div className="mt-1 text-sm text-zinc-600">{theCase.debate.description}</div>
          </Card>

          {theCase.debate.stages.map((stage) => {
            const chosenId = choices.debateChoices[stage.id]
            const chosen = stage.choices.find((c) => c.id === chosenId)
            return (
              <Card key={stage.id} className={clsx('p-5', chosen && 'border-emerald-200')}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{stage.speakerEmoji}</span>
                  <div>
                    <div className="text-sm font-extrabold text-zinc-900">{stage.speaker}</div>
                  </div>
                </div>

                {/* Dialogue bubble */}
                <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-700 leading-relaxed">
                  "{stage.dialogue}"
                </div>

                {/* Choices */}
                {!chosen ? (
                  <div className="mt-3 grid gap-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                      你选择如何追问？
                    </div>
                    {stage.choices.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickDebateChoice(stage.id, c.id)}
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-700 transition-all hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-sm"
                      >
                        {c.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm font-semibold text-amber-800">
                      🎯 你选择了：{chosen.text}
                    </div>
                    <div className="rounded-2xl bg-sky-50 border border-sky-200 p-3 text-sm text-zinc-700">
                      <div className="font-bold text-sky-800 mb-1">📢 结果：</div>
                      {chosen.reveal}
                    </div>
                    <div className="text-xs font-semibold" style={{ color: chosen.isRecommended ? '#059669' : '#d97706' }}>
                      {chosen.feedback}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          <Card className="p-4">
            <ProgressBar
              value={(Object.keys(choices.debateChoices).length / theCase.debate.stages.length) * 100}
              color="purple"
              animated
            />
            <div className="mt-4">
              <Button
                onClick={() => goToStep('deliberation')}
                disabled={!allDebateDone}
                className="w-full"
              >
                {allDebateDone ? '进入合议裁决 →' : '请完成全部辩论环节'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── STEP: Deliberation ── */}
      {step === 'deliberation' && (
        <div className="grid gap-4">
          <Card className="p-5">
            <div className="text-base font-extrabold text-zinc-900">{theCase.deliberation.title}</div>
            <div className="mt-1 text-sm text-zinc-600">{theCase.deliberation.description}</div>
          </Card>

          {/* Law selection */}
          <Card className="p-5">
            <div className="text-sm font-extrabold text-zinc-900 mb-3">📜 适用法律（选择你认为最适用的法条）</div>
            <div className="grid gap-3">
              {theCase.deliberation.laws.map((law) => {
                const selected = choices.selectedLaws.includes(law.id)
                return (
                  <button
                    key={law.id}
                    type="button"
                    onClick={() => toggleLaw(law.id)}
                    className={clsx(
                      'rounded-2xl border-2 p-4 text-left transition-all',
                      selected
                        ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                        : 'border-zinc-200 bg-white hover:border-zinc-300',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold',
                          selected ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500',
                        )}
                      >
                        {selected ? '✓' : law.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-900">{law.name}</div>
                        <div className="mt-1 text-xs text-zinc-600">{law.summary}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Verdict */}
          <Card className="p-5">
            <div className="text-sm font-extrabold text-zinc-900 mb-3">⚖️ {theCase.deliberation.verdict.question}</div>
            <div className="grid gap-3">
              {theCase.deliberation.verdict.options.map((opt) => {
                const selected = choices.verdictChoice === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => pickVerdict(opt.id)}
                    className={clsx(
                      'rounded-2xl border-2 p-4 text-left transition-all',
                      selected
                        ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                        : 'border-zinc-200 bg-white hover:border-zinc-300',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          'grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold',
                          selected ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-500',
                        )}
                      >
                        {opt.label.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-900">{opt.label}</div>
                        <div className="mt-0.5 text-xs text-zinc-600">{opt.desc}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Penalty */}
          {theCase.deliberation.penalty && choices.verdictChoice !== null && (
            <Card className="p-5 border-amber-200">
              <div className="text-sm font-extrabold text-zinc-900 mb-3">📋 {theCase.deliberation.penalty.question}</div>
              <div className="grid gap-3">
                {theCase.deliberation.penalty.options.map((opt) => {
                  const selected = choices.penaltyChoice === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => pickPenalty(opt.id)}
                      className={clsx(
                        'rounded-2xl border-2 p-4 text-left transition-all',
                        selected
                          ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                          : 'border-zinc-200 bg-white hover:border-zinc-300',
                      )}
                    >
                      <div className="text-sm font-bold text-zinc-900">{opt.label}</div>
                      <div className="mt-0.5 text-xs text-zinc-600">{opt.desc}</div>
                    </button>
                  )
                })}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <Button
              onClick={submitResult}
              disabled={!canDeliberate || submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? '⚖️ 宣判中...' : '⚖️ 宣判！'}
              {!submitting && <Gavel className="h-4 w-4 ml-1.5" />}
            </Button>
          </Card>
        </div>
      )}

      {/* ── STEP: Result ── */}
      {step === 'result' && scoreData && (
        <div className="grid gap-4">
          {/* Score Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-200">
            <div className="text-center">
              <span className="text-5xl">🏆</span>
              <div className="mt-2 text-2xl font-black">判决完成！</div>
              <div className="mt-1 text-lg font-bold text-white/80">
                {theCase.title}
              </div>
              {xpGained > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2">
                  <Zap className="h-5 w-5 text-yellow-300" />
                  <span className="text-lg font-black">+{xpGained} XP</span>
                </div>
              )}
            </div>
          </div>

          {/* Score breakdown */}
          <Card className="p-5">
            <div className="text-base font-extrabold text-zinc-900 mb-1">📊 评分报告</div>
            <div className="text-sm text-zinc-500 mb-4">
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
                  <span className="w-28 text-xs font-bold text-zinc-600 shrink-0">{d.label}</span>
                  <div className="flex-1">
                    <ProgressBar value={(d.earned / Math.max(1, d.max)) * 100} size="sm" color={d.earned === d.max ? 'green' : 'blue'} />
                  </div>
                  <span className={clsx('text-xs font-extrabold w-12 text-right', d.earned === d.max ? 'text-emerald-600' : 'text-zinc-500')}>
                    {d.earned}/{d.max}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Correct answers */}
          <Card className="p-5 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-800 mb-3">
              <CheckCircle2 className="h-4 w-4" />
              正确答案
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-white border border-emerald-200 p-4">
                <div className="text-xs font-bold text-zinc-500 uppercase">裁决结果</div>
                <div className="mt-1 text-base font-extrabold text-emerald-700">{theCase.result.correctVerdict}</div>
              </div>
              <div className="rounded-2xl bg-white border border-emerald-200 p-4">
                <div className="text-xs font-bold text-zinc-500 uppercase">适用法律</div>
                <div className="mt-1 text-sm font-bold text-zinc-900">{theCase.result.correctLaw}</div>
              </div>
            </div>
          </Card>

          {/* Law explanation */}
          <Card className="p-5 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
            <div className="flex items-center gap-2 text-sm font-extrabold text-sky-800 mb-3">
              <Scale className="h-4 w-4" />
              法律小课堂
            </div>
            <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
              {theCase.result.lawExplanation}
            </div>
          </Card>

          {/* Actions */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="primary"
              onClick={() => startCase(theCase)}
              className="w-full"
            >
              🔄 再玩一次
            </Button>
            <Button
              variant="secondary"
              onClick={() => setActiveCase(null)}
              className="w-full"
            >
              📋 返回案件列表
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{detailModal.type === 'hotspot' ? (detailModal.data as SceneHotspot).emoji : (detailModal.data as EvidenceItem).emoji}</span>
                  <span className="text-base font-extrabold">
                    {detailModal.type === 'hotspot' ? (detailModal.data as SceneHotspot).content.title : (detailModal.data as EvidenceItem).title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailModal(null)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-5 text-sm text-zinc-700 leading-relaxed">
              {detailModal.type === 'hotspot'
                ? (detailModal.data as SceneHotspot).content.detail
                : (detailModal.data as EvidenceItem).detail}
            </div>
            <div className="px-5 pb-4">
              <Button variant="ghost" onClick={() => setDetailModal(null)} className="w-full">
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
