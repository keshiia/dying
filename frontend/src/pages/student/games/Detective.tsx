import { useState, useMemo, useCallback } from 'react'
import { clsx } from 'clsx'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  Search,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import ProgressBar from '@/components/ui/ProgressBar'
import ClueDetailModal from '@/components/student/ClueDetailModal'
import {
  detectiveCases,
  type DetectiveCaseData,
  type DetectiveScene,
  type DetectiveHotspot,
  type DetectiveNpc,
} from '@/data/detectiveCases'
import { apiFetch, errorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

// ── Types ──────────────────────────────────────────

type DetectiveStep = 'menu' | 'briefing' | 'investigation' | 'deduction' | 'result'

interface PlayerState {
  foundClues: string[]
  interviewedNpcs: string[]
  npcSecretsRevealed: string[]
  deductionAnswers: Record<string, string>
}

// ── NPC Positions ──────────────────────────────────
// Position of each NPC on the scene canvas (0-100%)
const NPC_POSITIONS: Record<string, { x: number; y: number }> = {
  // Case 1: 画室涂鸦
  'npc-xiaomei': { x: 22, y: 55 },
  'npc-chenhao': { x: 72, y: 35 },
  'npc-linyue': { x: 40, y: 40 },
  // Case 2: 食堂窃贼
  'npc-zhang': { x: 25, y: 50 },
  'npc-xiaoyu': { x: 55, y: 40 },
  'npc-chen': { x: 65, y: 55 },
  // Case 3: 谣言风波
  'npc-zhao': { x: 30, y: 45 },
  'npc-linsi': { x: 55, y: 35 },
  'npc-teacher': { x: 65, y: 50 },
  // Case 4: 体育馆奖杯
  'npc-coach': { x: 70, y: 40 },
  'npc-maqiang': { x: 40, y: 30 },
  'npc-liu': { x: 55, y: 50 },
  // Case 5: 班级群幽灵
  'npc-zhangqing': { x: 30, y: 45 },
  'npc-wanghao': { x: 60, y: 40 },
  'npc-lixiaoming': { x: 45, y: 50 },
};

function npcPos(npcId: string) {
  return NPC_POSITIONS[npcId] ?? { x: 50, y: 50 };
}

// ── Helpers ────────────────────────────────────────

function calcDetectiveScore(state: PlayerState, theCase: DetectiveCaseData): {
  score: number; maxScore: number; details: { label: string; earned: number; max: number }[]
} {
  const details: { label: string; earned: number; max: number }[] = []

  const totalClues = theCase.scenes.reduce((a, s) => a + s.hotspots.length, 0)
  details.push({ label: '🔍 线索搜集', earned: state.foundClues.length, max: totalClues })

  const npcTotal = theCase.npcs.length
  const secretsFound = state.npcSecretsRevealed.length
  details.push({ label: '💬 询问证人', earned: secretsFound, max: npcTotal })

  let deductCorrect = 0
  for (const q of theCase.deduction.questions) {
    const chosen = state.deductionAnswers[q.id]
    const correct = q.options.find((o) => o.id === chosen)?.isCorrect
    if (correct) deductCorrect++
  }
  details.push({ label: '🧩 推理答题', earned: deductCorrect, max: theCase.deduction.questions.length })

  const totalEarned = details.reduce((a, d) => a + d.earned, 0)
  const totalMax = details.reduce((a, d) => a + d.max, 0)
  return { score: totalEarned, maxScore: totalMax, details }
}

// ── Scene Board ────────────────────────────────────

function SceneBoard({
  scene,
  clues,
  foundClues,
  onFindClue,
  currentNpc,
  npc,
  allNpcs,
  onTalkToNpc,
  onAskQuestion,
  onBackToScene,
}: {
  scene: DetectiveScene
  clues: DetectiveHotspot[]
  foundClues: string[]
  onFindClue: (hs: DetectiveHotspot) => void
  currentNpc: string | null
  npc: DetectiveNpc | null
  allNpcs: DetectiveNpc[]
  onTalkToNpc: (id: string) => void
  onAskQuestion: (npcId: string, type: 'secret' | 'other', idx?: number) => void
  onBackToScene: () => void
}) {
  // If in NPC dialogue view
  if (currentNpc && npc) {
    return <NpcDialogueView npc={npc} onAskQuestion={onAskQuestion} onBack={onBackToScene} />
  }

  return (
    <div className="grid gap-4">
      {/* Scene description */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{scene.name.slice(0, 2)}</span>
          <div>
            <div className="text-sm font-extrabold text-zinc-900">{scene.name}</div>
            <div className="text-xs text-zinc-500">{scene.description}</div>
          </div>
        </div>
      </Card>

      {/* Scene canvas */}
      <div
        className={clsx(
          'relative w-full rounded-3xl overflow-hidden border-2 border-zinc-200',
          'bg-gradient-to-br',
          scene.bgColor,
        )}
        style={{ minHeight: 380 }}
      >
        {/* Background decorations */}
        {scene.bgDecorations.map((dec, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30 select-none"
            style={{ left: `${dec.x}%`, top: `${dec.y}%`, fontSize: dec.size ?? '2.5rem' }}
          >
            {dec.emoji}
          </span>
        ))}

        {/* Hotspot markers */}
        {clues.map((hs) => {
          const found = foundClues.includes(hs.id)
          return (
            <button
              key={hs.id}
              type="button"
              onClick={() => !found && onFindClue(hs)}
              disabled={found}
              className={clsx(
                'absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
                found
                  ? 'opacity-100 scale-100'
                  : 'hover:scale-110 animate-soft-pulse cursor-pointer',
              )}
              style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
            >
              <div
                className={clsx(
                  'flex items-center gap-1.5 rounded-full px-3 py-2 shadow-lg transition-all',
                  found
                    ? 'bg-sky-500 text-white ring-2 ring-sky-300'
                    : 'bg-white/95 text-zinc-700 ring-2 ring-sky-300/60 hover:bg-sky-50',
                )}
              >
                <span className="text-lg">{found ? '✅' : hs.emoji}</span>
                <span className={clsx('text-xs font-bold truncate max-w-[90px]', found && 'text-white')}>
                  {found ? hs.content.title : hs.label}
                </span>
              </div>
            </button>
          )
        })}

        {/* NPC markers — dynamic for any scene */}
        {allNpcs
          .filter((n) => n.sceneId === scene.id)
          .map((npc) => (
            <NpcMarker
              key={npc.id}
              npcId={npc.id}
              emoji={npc.emoji}
              x={npcPos(npc.id).x}
              y={npcPos(npc.id).y}
              label={npc.name}
              onClick={() => onTalkToNpc(npc.id)}
            />
          ))}
      </div>
    </div>
  )
}

function NpcMarker({
  npcId,
  emoji,
  x,
  y,
  label,
  onClick,
}: {
  npcId: string
  emoji: string
  x: number
  y: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 animate-soft-pulse cursor-pointer"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 shadow-lg ring-2 ring-sky-400/60 hover:bg-sky-50 transition-all">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-bold text-zinc-700 truncate max-w-[80px]">{label}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <MessageCircle className="h-3 w-3" />
        </span>
      </div>
    </button>
  )
}

// ── NPC Dialogue ───────────────────────────────────

function NpcDialogueView({
  npc,
  onAskQuestion,
  onBack,
}: {
  npc: DetectiveNpc
  onAskQuestion: (npcId: string, type: 'secret' | 'other', idx?: number) => void
  onBack: () => void
}) {
  const [asked, setAsked] = useState<Set<string>>(new Set())
  const [secretRevealed, setSecretRevealed] = useState(false)
  const [activeResponse, setActiveResponse] = useState<string | null>(null)

  const handleAsk = useCallback(
    (type: 'secret' | 'other', idx?: number) => {
      const key = type === 'secret' ? `secret-${npc.id}` : `other-${npc.id}-${idx}`
      if (asked.has(key)) return
      setAsked((prev) => new Set(prev).add(key))
      setActiveResponse(key)
      if (type === 'secret') {
        setSecretRevealed(true)
      }
      onAskQuestion(npc.id, type, idx)
    },
    [npc.id, asked, onAskQuestion],
  )

  return (
    <Card className="overflow-hidden border-sky-200">
      <div className="bg-gradient-to-r from-[var(--p-primary)] to-[var(--p-primary-dark)] p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{npc.emoji}</span>
            <div>
              <div className="text-base font-extrabold">{npc.name}</div>
              <div className="text-xs text-white/80">{npc.role}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Initial dialogue */}
        <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-700 leading-relaxed">
          💬 "{npc.dialogue}"
        </div>

        {/* Question options */}
        {!activeResponse && (
          <div className="mt-4 grid gap-2">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">选择如何询问：</div>
            {!asked.has(`secret-${npc.id}`) && (
              <button
                type="button"
                onClick={() => handleAsk('secret')}
                className="rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm font-semibold text-sky-800 transition-all hover:border-sky-400 hover:bg-sky-100"
              >
                🔍 {npc.triggerQuestion}
              </button>
            )}
            {npc.otherQuestions.map((oq, idx) => {
              const key = `other-${npc.id}-${idx}`
              if (asked.has(key)) return null
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAsk('other', idx)}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50"
                >
                  💬 {oq.question}
                </button>
              )
            })}
          </div>
        )}

        {/* Response */}
        {activeResponse && (
          <div className="mt-4 grid gap-3">
            <div
              className={clsx(
                'rounded-2xl p-4 text-sm leading-relaxed',
                activeResponse.startsWith('secret')
                  ? 'bg-sky-50 border border-sky-200 text-zinc-700'
                  : 'bg-sky-50 border border-sky-200 text-zinc-700',
              )}
            >
              <div className="font-bold mb-1">
                {activeResponse.startsWith('secret') ? '🤫 她透露了一个秘密：' : '💬 回答：'}
              </div>
              {activeResponse.startsWith('secret') ? npc.secret : npc.otherQuestions[Number(activeResponse.split('-')[2])]?.response}
            </div>

            {/* Continue button */}
            <Button variant="secondary" onClick={onBack} className="w-full">
              ← 继续调查
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Main Page ──────────────────────────────────────

export default function Detective() {
  const [theCase, setTheCase] = useState<DetectiveCaseData | null>(null)
  const [step, setStep] = useState<DetectiveStep>('menu')
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [state, setState] = useState<PlayerState>({
    foundClues: [],
    interviewedNpcs: [],
    npcSecretsRevealed: [],
    deductionAnswers: {},
  })
  const [currentNpc, setCurrentNpc] = useState<string | null>(null)
  const [xpGained, setXpGained] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  // 提交失败时如实告知，而不是伪造一个奖励数字
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [clueDetail, setClueDetail] = useState<DetectiveHotspot | null>(null)
  const user = useAuthStore((s) => s.user)

  function startCase(c: DetectiveCaseData) {
    setTheCase(c)
    setStep('briefing')
    setState({ foundClues: [], interviewedNpcs: [], npcSecretsRevealed: [], deductionAnswers: {} })
    setActiveSceneId(null)
    setCurrentNpc(null)
    setXpGained(0)
  }

  const activeScene = useMemo(() => {
    if (!theCase || !activeSceneId) return null
    return theCase.scenes.find((s) => s.id === activeSceneId) ?? null
  }, [theCase, activeSceneId])

  const activeNpc = useMemo(() => {
    if (!theCase || !currentNpc) return null
    return theCase.npcs.find((n) => n.id === currentNpc) ?? null
  }, [theCase, currentNpc])

  const totalClues = useMemo(
    () => (theCase ? theCase.scenes.reduce((a, s) => a + s.hotspots.length, 0) : 0),
    [theCase],
  )

  const allCluesFound = state.foundClues.length >= totalClues
  const canDeduce = state.foundClues.length >= (theCase?.minCluesToUnlock ?? 5)

  function findClue(hs: DetectiveHotspot) {
    if (state.foundClues.includes(hs.id)) return
    setState((prev) => ({ ...prev, foundClues: [...prev.foundClues, hs.id] }))
    setClueDetail(hs)
  }

  function talkToNpc(npcId: string) {
    setCurrentNpc(npcId)
    setState((prev) => ({
      ...prev,
      interviewedNpcs: prev.interviewedNpcs.includes(npcId) ? prev.interviewedNpcs : [...prev.interviewedNpcs, npcId],
    }))
  }

  function askNpcQuestion(npcId: string, type: 'secret' | 'other', _idx?: number) {
    if (type === 'secret') {
      setState((prev) => ({
        ...prev,
        npcSecretsRevealed: prev.npcSecretsRevealed.includes(npcId)
          ? prev.npcSecretsRevealed
          : [...prev.npcSecretsRevealed, npcId],
      }))
    }
  }

  function answerDeduction(qId: string, optId: string) {
    setState((prev) => ({ ...prev, deductionAnswers: { ...prev.deductionAnswers, [qId]: optId } }))
  }

  const allDeductionDone = theCase && Object.keys(state.deductionAnswers).length >= theCase.deduction.questions.length

  async function submitResult() {
    if (!theCase) return
    const scoreData = calcDetectiveScore(state, theCase)
    setSubmitting(true)
    setSubmitError(null)
    await new Promise((r) => setTimeout(r, 600))
    try {
      const res = await apiFetch<{ success: true; xpGain: number; user: { xp: number; level: number } }>(
        '/api/student/detective-result',
        {
          method: 'POST',
          body: JSON.stringify({ caseId: theCase.id, score: scoreData.score, maxScore: scoreData.maxScore }),
        },
      )
      setXpGained(res.xpGain)
      if (res.user) {
        const store = useAuthStore.getState()
        if (store.token && store.user) {
          store.setAuth(store.token, { ...store.user, xp: res.user.xp, level: res.user.level })
        }
      }
    } catch (e: unknown) {
      // 与模拟法庭一致：提交失败不伪造奖励，如实提示并给重试入口
      setXpGained(0)
      setSubmitError(errorMessage(e))
    }
    setSubmitting(false)
    setStep('result')
  }

  // ── Render: Case Menu ──
  if (step === 'menu') {
    return (
      <div className="grid gap-5">
        <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-6 text-white shadow-lg shadow-sky-200">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🕵️</span>
            <div>
              <div className="text-xl font-black">案件侦查</div>
              <div className="mt-1 text-sm text-white/80">搜集线索、推理真相，做一名少年侦探！</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">自由搜证</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">询问证人</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 font-bold">+XP</span>
          </div>
        </div>

        <div className="text-sm font-extrabold text-zinc-800">选择案件</div>
        <div className="grid gap-4">
          {detectiveCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => startCase(c)}
              className="group rounded-3xl border-2 border-zinc-200 bg-white overflow-hidden text-left transition-all hover:border-sky-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.emoji}</span>
                  <div>
                    <div className="text-lg font-extrabold text-zinc-900 group-hover:text-sky-700 transition-colors">
                      {c.title}
                    </div>
                    <div className="text-sm font-semibold text-zinc-500">{c.subtitle}</div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
                  <Search className="h-4 w-4 text-sky-500" />
                  <span>{c.scenes.length} 个场景 · {c.difficulty}</span>
                </div>
                <span className="text-sm font-bold text-sky-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  开始侦查
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!theCase) return null

  const scoreData = step === 'result' ? calcDetectiveScore(state, theCase) : null

  // ── Render: Briefing ──
  if (step === 'briefing') {
    return (
      <div className="grid gap-4">
        {/* Back button */}
        <button
          type="button"
          onClick={() => setStep('menu')}
          className="flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回案件列表
        </button>
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-5 text-white">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-4xl">📋</span>
              <div>
                <div className="text-xl font-black">{theCase.title}</div>
                <div className="text-sm text-white/80">{theCase.subtitle}</div>
              </div>
            </div>
          </div>
          <div className="p-5 grid gap-3">
            {theCase.intro.narrative.map((para, i) => (
              <p key={i} className="text-sm text-zinc-700 leading-relaxed">{para}</p>
            ))}
            <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4 text-sm font-semibold text-sky-800">
              🎯 {theCase.intro.briefing}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center">
                <div className="text-lg font-extrabold text-zinc-900">{theCase.scenes.length}</div>
                <div className="text-xs text-zinc-500">可调查场景</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center">
                <div className="text-lg font-extrabold text-zinc-900">{totalClues}</div>
                <div className="text-xs text-zinc-500">待搜集线索</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center">
                <div className="text-lg font-extrabold text-zinc-900">{theCase.npcs.length}</div>
                <div className="text-xs text-zinc-500">可询问证人</div>
              </div>
            </div>
            <Button onClick={() => { setStep('investigation'); setActiveSceneId(theCase.scenes[0].id) }} className="w-full" size="lg">
              开始搜查！ <Search className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Render: Investigation ──
  if (step === 'investigation') {
    return (
      <>
      <div className="grid gap-4">
        {/* Top bar */}
        <div className="rounded-2xl bg-white border border-zinc-200/80 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setStep('briefing'); setActiveSceneId(null); setCurrentNpc(null) }}
              className="flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" /> 返回
            </button>
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <span className="text-lg">{theCase.emoji}</span>
              <span className="hidden sm:inline">{theCase.title}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
              <Trophy className="h-3.5 w-3.5 text-sky-500" />
              {user?.xp ?? 0} XP
            </div>
          </div>
        </div>

        {/* Scene tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {theCase.scenes.map((s) => {
            const clueCount = s.hotspots.filter((h) => state.foundClues.includes(h.id)).length
            const isActive = activeSceneId === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { setActiveSceneId(s.id); setCurrentNpc(null) }}
                className={clsx(
                  'shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white shadow-md'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:border-sky-300',
                )}
              >
                <span>{s.name.slice(0, 2)}</span>
                <span className="hidden sm:inline">{s.name}</span>
                {clueCount > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{clueCount}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Main scene */}
        {activeScene && (
          <SceneBoard
            scene={activeScene}
            clues={activeScene.hotspots}
            foundClues={state.foundClues}
            onFindClue={findClue}
            currentNpc={currentNpc}
            npc={activeNpc}
            allNpcs={theCase.npcs}
            onTalkToNpc={talkToNpc}
            onAskQuestion={askNpcQuestion}
            onBackToScene={() => setCurrentNpc(null)}
          />
        )}

        {/* Clue notebook */}
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2">
            <BookOpen className="h-4 w-4 text-sky-500" />
            侦探笔记本
          </div>

          {/* Clue grid */}
          <div className="flex flex-wrap gap-2 mb-3">
            {theCase.scenes.flatMap((s) => s.hotspots).map((hs) => {
              const found = state.foundClues.includes(hs.id)
              return (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => found && setClueDetail(hs)}
                  className={clsx(
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                    found
                      ? 'bg-sky-100 text-sky-800 border border-sky-200 cursor-pointer hover:bg-sky-200'
                      : 'bg-zinc-100 text-zinc-400 border border-zinc-200',
                  )}
                >
                  {found ? `${hs.emoji} ${hs.content.title}` : '❓ 未发现'}
                </button>
              )
            })}
          </div>

          {/* Progress + unlock deduction */}
          <ProgressBar value={(state.foundClues.length / totalClues) * 100} color="blue" animated />
          <div className="mt-1 text-xs text-zinc-500">
            已找到 {state.foundClues.length}/{totalClues} 条线索
            {canDeduce && !allCluesFound && ' · 已满足推理条件！'}
            {allCluesFound && ' · 全部找到！'}
          </div>
        </Card>

        {/* NPC list */}
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2">
            <Users className="h-4 w-4 text-sky-500" />
            相关人物
          </div>
          <div className="flex flex-wrap gap-2">
            {theCase.npcs.map((npc) => {
              const talked = state.interviewedNpcs.includes(npc.id)
              const secret = state.npcSecretsRevealed.includes(npc.id)
              return (
                <div
                  key={npc.id}
                  className={clsx(
                    'rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5',
                    secret
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : talked
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'bg-zinc-100 text-zinc-500 border border-zinc-200',
                  )}
                >
                  <span>{npc.emoji}</span>
                  <span>{npc.name}</span>
                  {secret && <span className="text-sky-600">🤫</span>}
                  {talked && !secret && <CheckCircle2 className="h-3 w-3 text-sky-500" />}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Unlock deduction */}
        <Button
          onClick={() => setStep('deduction')}
          disabled={!canDeduce}
          className="w-full"
          size="lg"
        >
          {canDeduce ? '🧩 进入推理 — 还原真相！' : `还需找到 ${theCase.minCluesToUnlock - state.foundClues.length} 条线索才能推理`}
        </Button>
      </div>

      {/* 线索详情弹窗必须渲染在「调查」阶段里 —— findClue 就是在这个阶段设置 clueDetail 的。
          原先它只写在文件末尾那个永远走不到的兜底分支里。 */}
      <ClueDetailModal clue={clueDetail} onClose={() => setClueDetail(null)} />
      </>
    )
  }

  // ── Render: Deduction ──
  if (step === 'deduction') {
    return (
      <div className="grid gap-4">
        <Card className="p-5 bg-gradient-to-r from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧩</span>
            <div>
              <div className="text-base font-extrabold">{theCase.deduction.title}</div>
              <div className="text-sm text-white/80">{theCase.deduction.description}</div>
            </div>
          </div>
        </Card>

        {theCase.deduction.questions.map((q) => {
          const chosen = state.deductionAnswers[q.id]
          return (
            <Card key={q.id} className={clsx('p-5', chosen && 'border-sky-200')}>
              <div className="text-sm font-extrabold text-zinc-900 mb-3">{q.question}</div>
              <div className="grid gap-2">
                {q.options.map((opt) => {
                  const selected = chosen === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => answerDeduction(q.id, opt.id)}
                      className={clsx(
                        'rounded-2xl border-2 p-3 text-left text-sm transition-all',
                        selected
                          ? 'border-sky-400 bg-sky-50 shadow-sm'
                          : 'border-zinc-200 bg-white hover:border-zinc-300',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={clsx(
                            'grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold',
                            selected ? 'bg-sky-500 text-white' : 'bg-zinc-100 text-zinc-500',
                          )}
                        >
                          {String.fromCharCode(65 + q.options.indexOf(opt))}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900">{opt.text}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Show explanation after choosing */}
              {chosen && (
                <div className="mt-3 rounded-2xl p-3 text-xs leading-relaxed bg-sky-50 border border-sky-200 text-zinc-700">
                  {q.options.find((o) => o.id === chosen)?.explanation}
                </div>
              )}
            </Card>
          )
        })}

        <Button
          onClick={submitResult}
          disabled={!allDeductionDone || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? '🕵️‍♀️ 还原真相中...' : '🔍 揭晓真相！'}
        </Button>
      </div>
    )
  }

  // ── Render: Result ──
  if (step === 'result' && scoreData) {
    return (
      <div className="grid gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-6 text-white shadow-lg shadow-sky-200 text-center">
          <span className="text-5xl">🔍</span>
          <div className="mt-2 text-2xl font-black">案件告破！</div>
          <div className="mt-1 text-base font-bold text-white/80">{theCase.title}</div>
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
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>成绩未能保存：{submitError}</span>
            <Button size="sm" variant="secondary" onClick={submitResult} disabled={submitting}>
              {submitting ? '重试中…' : '重试'}
            </Button>
          </div>
        )}

        {/* Score */}
        <Card className="p-5">
          <div className="text-base font-extrabold text-zinc-900 mb-1">📊 侦探评分</div>
          <div className="text-sm text-zinc-500 mb-4">
            总分 {scoreData.score}/{scoreData.maxScore}
            {scoreData.score === scoreData.maxScore ? ' · 🎉 完美推理！你是名侦探！' : scoreData.score >= scoreData.maxScore * 0.7 ? ' · 👏 干得漂亮！' : ' · 💪 继续练习观察力！'}
          </div>
          <div className="grid gap-2">
            {scoreData.details.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="w-28 text-xs font-bold text-zinc-600 shrink-0">{d.label}</span>
                <div className="flex-1">
                  <ProgressBar value={(d.earned / Math.max(1, d.max)) * 100} size="sm" color="blue" />
                </div>
                <span className={clsx('text-xs font-extrabold w-12 text-right', d.earned === d.max ? 'text-sky-600' : 'text-zinc-500')}>
                  {d.earned}/{d.max}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Case summary */}
        <Card className="p-5 border-sky-200 bg-sky-50/50">
          <div className="flex items-center gap-2 text-sm font-extrabold text-sky-800 mb-3">
            <Lightbulb className="h-4 w-4" />
            真相大白
          </div>
          <div className="text-sm text-zinc-700 leading-relaxed">{theCase.result.summary}</div>
        </Card>

        {/* Full story */}
        <Card className="p-5 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
          <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
            {theCase.result.fullStory}
          </div>
        </Card>

        {/* Actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="primary" onClick={() => startCase(theCase)} className="w-full">
            🔄 再玩一次
          </Button>
          <Button variant="secondary" onClick={() => setStep('menu')} className="w-full">
            📋 返回案件列表
          </Button>
        </div>
      </div>
    )
  }

  // 四个阶段各有自己的提前 return，正常不会走到这里。
  // 保留兜底，以防将来新增阶段时漏渲染线索弹窗。
  return <ClueDetailModal clue={clueDetail} onClose={() => setClueDetail(null)} />
}
