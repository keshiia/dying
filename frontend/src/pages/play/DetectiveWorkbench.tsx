import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Search,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import Sheet from '@/components/ui/Sheet'
import SceneMap from '@/components/detective/SceneMap'
import EvidenceWall from '@/components/detective/EvidenceWall'
import InterventionCard, { type Intervention } from '@/components/student/InterventionCard'
import { getDetectiveCaseById, type DetectiveCaseData, type DetectiveNpc } from '@/data/detectiveCases'
import { apiFetch, errorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { clueKind, clipLabel, MISSED_LIMIT, type GameDetail } from '@/utils/gameDetail'

/**
 * 案件侦查工作台。
 *
 * 挂在 `/play/detective/:caseId`，在 AppShell 之外 —— 侧边栏和顶栏杵在旁边的话
 * 「沉浸」是假的：学生还是觉得自己在网页里。
 *
 * 三个刻意的结构决定：
 *
 * 1. **线索不再弹窗。** 点热点 → 卡片进右侧证据墙并永久留下。原来「点热点 →
 *    弹出居中模态 → 关掉 → 什么都没有」，线索是一次性的，侦查的累积感全丢了。
 * 2. **询问证人不再吃掉整个画面。** 中间栏切成对话视图，证据墙留在右边 ——
 *    学生可以一边听证词一边对照已经收集到的线索。原来是整块板子被替换掉。
 * 3. **过程内不给提示。** 智能体只在结算时出现。一旦有提示可等，学生就不推理了，
 *    直接等喂答案 —— 那会污染「推理答题」这条能力轴的数据源。
 */

type Phase = 'briefing' | 'investigation' | 'deduction' | 'result'

interface PlayerState {
  foundClues: string[]
  interviewedNpcs: string[]
  npcSecretsRevealed: string[]
  deductionAnswers: Record<string, string>
}

const EMPTY_STATE: PlayerState = {
  foundClues: [],
  interviewedNpcs: [],
  npcSecretsRevealed: [],
  deductionAnswers: {},
}

function calcScore(state: PlayerState, theCase: DetectiveCaseData) {
  const details: { label: string; earned: number; max: number }[] = []

  const totalClues = theCase.scenes.reduce((a, s) => a + s.hotspots.length, 0)
  details.push({ label: '🔍 线索搜集', earned: state.foundClues.length, max: totalClues })

  const secretsFound = state.npcSecretsRevealed.length
  details.push({ label: '💬 询问证人', earned: secretsFound, max: theCase.npcs.length })

  let deductCorrect = 0
  for (const q of theCase.deduction.questions) {
    const chosen = state.deductionAnswers[q.id]
    if (q.options.find((o) => o.id === chosen)?.isCorrect) deductCorrect++
  }
  details.push({
    label: '🧩 推理答题',
    earned: deductCorrect,
    max: theCase.deduction.questions.length,
  })

  return {
    score: details.reduce((a, d) => a + d.earned, 0),
    maxScore: details.reduce((a, d) => a + d.max, 0),
    details,
  }
}

/** 与服务端能力轴口径一致，明细全部来自已有的对局状态，没有新增埋点 */
function buildDetail(
  state: PlayerState,
  theCase: DetectiveCaseData,
  durationMs: number,
): GameDetail {
  const allClues = theCase.scenes.flatMap((s) => s.hotspots)
  const missedClues = allClues.filter((h) => !state.foundClues.includes(h.id))
  const missedSecrets = theCase.npcs.filter((n) => !state.npcSecretsRevealed.includes(n.id))
  const wrongQuestions = theCase.deduction.questions.filter((q) => {
    const chosen = state.deductionAnswers[q.id]
    return !q.options.find((o) => o.id === chosen)?.isCorrect
  })

  return {
    v: 1,
    axes: [
      { axis: 'OBSERVE', correct: state.foundClues.length, total: allClues.length },
      { axis: 'INTERVIEW', correct: state.npcSecretsRevealed.length, total: theCase.npcs.length },
      {
        axis: 'REASONING',
        correct: theCase.deduction.questions.length - wrongQuestions.length,
        total: theCase.deduction.questions.length,
      },
    ],
    missed: [
      ...missedClues.map((h) => ({ label: clipLabel(h.content.title), kind: clueKind(h.type) })),
      ...missedSecrets.map((n) => ({
        label: clipLabel(`${n.name}隐瞒的事`),
        kind: 'clue-testimony' as const,
      })),
      ...wrongQuestions.map((q) => ({ label: clipLabel(q.question), kind: 'evidence' as const })),
    ].slice(0, MISSED_LIMIT),
    durationMs,
  }
}

export default function DetectiveWorkbench() {
  const { caseId = '' } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const theCase = useMemo(() => getDetectiveCaseById(caseId), [caseId])

  const [phase, setPhase] = useState<Phase>('briefing')
  const [state, setState] = useState<PlayerState>(EMPTY_STATE)
  const [activeSceneId, setActiveSceneId] = useState<string>('')
  const [currentNpc, setCurrentNpc] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [dossierOpen, setDossierOpen] = useState(false)
  const [wallOpen, setWallOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [intervention, setIntervention] = useState<Intervention | null>(null)

  const exit = useCallback(() => navigate('/app/games/detective'), [navigate])

  // caseId 非法（手敲 URL 或旧链接）→ 回案件列表，而不是白屏
  useEffect(() => {
    if (!theCase) navigate('/app/games/detective', { replace: true })
  }, [theCase, navigate])

  useEffect(() => {
    if (!theCase) return
    setState(EMPTY_STATE)
    setPhase('briefing')
    setActiveSceneId(theCase.scenes[0]?.id ?? '')
    setCurrentNpc(null)
    setXpGained(0)
    setIntervention(null)
    setSubmitError(null)
    setStartedAt(Date.now())
  }, [theCase])

  const totalClues = useMemo(
    () => (theCase ? theCase.scenes.reduce((a, s) => a + s.hotspots.length, 0) : 0),
    [theCase],
  )

  const activeScene = useMemo(
    () => theCase?.scenes.find((s) => s.id === activeSceneId) ?? null,
    [theCase, activeSceneId],
  )

  const activeNpc = useMemo(
    () => theCase?.npcs.find((n) => n.id === currentNpc) ?? null,
    [theCase, currentNpc],
  )

  const sceneNpcs = useMemo(
    () => (theCase && activeScene ? theCase.npcs.filter((n) => n.sceneId === activeScene.id) : []),
    [theCase, activeScene],
  )

  const allDeductionDone =
    !!theCase && Object.keys(state.deductionAnswers).length >= theCase.deduction.questions.length
  const canDeduce = !!theCase && state.foundClues.length >= theCase.minCluesToUnlock

  function findClue(id: string) {
    setState((prev) =>
      prev.foundClues.includes(id) ? prev : { ...prev, foundClues: [...prev.foundClues, id] },
    )
  }

  function talkToNpc(id: string) {
    setCurrentNpc(id)
    setState((prev) => ({
      ...prev,
      interviewedNpcs: prev.interviewedNpcs.includes(id)
        ? prev.interviewedNpcs
        : [...prev.interviewedNpcs, id],
    }))
  }

  function revealSecret(npcId: string) {
    setState((prev) => ({
      ...prev,
      npcSecretsRevealed: prev.npcSecretsRevealed.includes(npcId)
        ? prev.npcSecretsRevealed
        : [...prev.npcSecretsRevealed, npcId],
    }))
  }

  function answerDeduction(qId: string, optId: string) {
    setState((prev) => ({ ...prev, deductionAnswers: { ...prev.deductionAnswers, [qId]: optId } }))
  }

  async function submitResult() {
    if (!theCase) return
    const scoreData = calcScore(state, theCase)
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await apiFetch<{
        success: true
        xpGain: number
        user: { xp: number; level: number }
        intervention: Intervention | null
      }>('/api/student/detective-result', {
        method: 'POST',
        body: JSON.stringify({
          caseId: theCase.id,
          score: scoreData.score,
          maxScore: scoreData.maxScore,
          detail: buildDetail(state, theCase, Date.now() - startedAt),
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
    setPhase('result')
  }

  if (!theCase) return <div className="min-h-screen bg-zinc-950" />

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-950 text-white">
      <TopBar
        theCase={theCase}
        found={state.foundClues.length}
        total={totalClues}
        xp={user?.xp ?? 0}
        onExit={exit}
        onOpenDossier={() => setDossierOpen(true)}
        onOpenWall={() => setWallOpen(true)}
      />

      <main className="min-h-0 flex-1 overflow-hidden">
        {phase === 'briefing' && (
          <BriefingView theCase={theCase} totalClues={totalClues} onStart={() => setPhase('investigation')} />
        )}

        {phase === 'investigation' && activeScene && (
          <div className="flex h-full min-h-0 gap-3 px-3 pb-3">
            {/* 左：案卷（桌面常驻 / 移动端抽屉） */}
            <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto rounded-3xl bg-white/[0.03] ring-1 ring-white/10 lg:flex">
              <Dossier
                theCase={theCase}
                activeSceneId={activeSceneId}
                state={state}
                onPickScene={(id) => {
                  setActiveSceneId(id)
                  setCurrentNpc(null)
                }}
                onPickNpc={talkToNpc}
              />
            </aside>

            {/* 中：现场 / 证人对话 */}
            <section className="flex min-w-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                {activeNpc ? (
                  <NpcDialogue
                    npc={activeNpc}
                    secretRevealed={state.npcSecretsRevealed.includes(activeNpc.id)}
                    onReveal={() => revealSecret(activeNpc.id)}
                    onBack={() => setCurrentNpc(null)}
                  />
                ) : (
                  <SceneMap
                    sceneId={activeScene.id}
                    clues={activeScene.hotspots}
                    foundClues={state.foundClues}
                    npcs={sceneNpcs}
                    interviewedNpcs={state.interviewedNpcs}
                    secretsRevealed={state.npcSecretsRevealed}
                    currentNpcId={currentNpc}
                    locked={false}
                    onFindClue={(hs) => findClue(hs.id)}
                    onTalkToNpc={talkToNpc}
                  />
                )}
              </div>
            </section>

            {/* 右：证据墙（桌面常驻 / 移动端抽屉） */}
            <aside className="hidden w-80 shrink-0 flex-col rounded-3xl bg-white/[0.03] p-2 ring-1 ring-white/10 lg:flex">
              <EvidenceWall scenes={theCase.scenes} foundClues={state.foundClues} />
            </aside>
          </div>
        )}

        {phase === 'deduction' && (
          <div className="flex h-full min-h-0 gap-3 px-3 pb-3">
            <section className="flex min-w-0 flex-1 flex-col">
              <DeductionView
                theCase={theCase}
                answers={state.deductionAnswers}
                submitting={submitting}
                allDone={allDeductionDone}
                onAnswer={answerDeduction}
                onSubmit={submitResult}
              />
            </section>
            {/* 推理时把证据墙留在旁边：让学生对着自己收集到的线索作答，
                而不是凭记忆。评分口径完全不变 —— REASONING 仍是这四题的对错，
                改动那条轴会牵动诊断引擎的输入。 */}
            <aside className="hidden w-80 shrink-0 flex-col rounded-3xl bg-white/[0.03] p-2 ring-1 ring-white/10 lg:flex">
              <EvidenceWall scenes={theCase.scenes} foundClues={state.foundClues} />
            </aside>
          </div>
        )}

        {phase === 'result' && (
          <ResultView
            theCase={theCase}
            state={state}
            xpGained={xpGained}
            submitError={submitError}
            submitting={submitting}
            intervention={intervention}
            onRetry={submitResult}
            onRestart={() => {
              setState(EMPTY_STATE)
              setPhase('briefing')
              setActiveSceneId(theCase.scenes[0]?.id ?? '')
              setCurrentNpc(null)
              setXpGained(0)
              setIntervention(null)
              setSubmitError(null)
            }}
            onExit={exit}
          />
        )}
      </main>

      {/* 底栏：进入推理。
          还没解锁时不用 disabled 的主按钮（灰字压在按钮底色上几乎看不清），
          改成一条中性提示 —— 也避免「一个按不动的按钮里面写着原因」这种别扭。 */}
      {phase === 'investigation' && (
        <footer className="shrink-0 border-t border-white/10 px-3 py-3">
          {canDeduce ? (
            <Button onClick={() => setPhase('deduction')} className="w-full" size="lg">
              🧩 进入推理 — 还原真相！
            </Button>
          ) : (
            <div className="rounded-2xl bg-white/[0.04] py-3 text-center text-sm font-bold text-white/50 ring-1 ring-white/10">
              还需找到 {theCase.minCluesToUnlock - state.foundClues.length} 条线索才能推理
            </div>
          )}
        </footer>
      )}

      {/* 移动端：案卷抽屉 */}
      <Sheet open={dossierOpen} title="案卷" onClose={() => setDossierOpen(false)}>
        <div className="rounded-2xl bg-zinc-900 p-3 text-white">
          <Dossier
            theCase={theCase}
            activeSceneId={activeSceneId}
            state={state}
            onPickScene={(id) => {
              setActiveSceneId(id)
              setCurrentNpc(null)
              setDossierOpen(false)
            }}
            onPickNpc={(id) => {
              talkToNpc(id)
              setDossierOpen(false)
            }}
          />
        </div>
      </Sheet>

      {/* 移动端：证据墙抽屉 */}
      <Sheet open={wallOpen} title="证据墙" onClose={() => setWallOpen(false)}>
        <div className="rounded-2xl bg-zinc-900 p-3 text-white">
          <EvidenceWall scenes={theCase.scenes} foundClues={state.foundClues} />
        </div>
      </Sheet>
    </div>
  )
}

// ── 顶栏 ──────────────────────────────────────────

function TopBar({
  theCase,
  found,
  total,
  xp,
  onExit,
  onOpenDossier,
  onOpenWall,
}: {
  theCase: DetectiveCaseData
  found: number
  total: number
  xp: number
  onExit: () => void
  onOpenDossier: () => void
  onOpenWall: () => void
}) {
  const pct = total === 0 ? 0 : (found / total) * 100
  return (
    <header className="flex shrink-0 items-center gap-3 px-3 py-3">
      <button
        type="button"
        onClick={onExit}
        aria-label="退出侦查"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold">
          {theCase.emoji} {theCase.title}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[var(--p-primary)] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-bold text-white/50">
            线索 {found}/{total}
          </span>
        </div>
      </div>

      {/* 移动端才需要这两个入口 */}
      <button
        type="button"
        onClick={onOpenDossier}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20 lg:hidden"
        aria-label="打开案卷"
      >
        <BookOpen className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onOpenWall}
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20 lg:hidden"
        aria-label="打开证据墙"
      >
        <Search className="h-4 w-4" />
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-sky-500 px-1 text-[10px] font-bold">
          {found}
        </span>
      </button>

      <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70 lg:flex">
        <Trophy className="h-3.5 w-3.5 text-amber-300" />
        {xp} XP
      </div>
    </header>
  )
}

// ── 左栏：案卷 ────────────────────────────────────

function Dossier({
  theCase,
  activeSceneId,
  state,
  onPickScene,
  onPickNpc,
}: {
  theCase: DetectiveCaseData
  activeSceneId: string
  state: PlayerState
  onPickScene: (id: string) => void
  onPickNpc: (id: string) => void
}) {
  return (
    <div className="grid gap-4 p-3">
      <div>
        <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-white/35">
          场景
        </div>
        <div className="grid gap-1">
          {theCase.scenes.map((s) => {
            const foundHere = s.hotspots.filter((h) => state.foundClues.includes(h.id)).length
            const active = s.id === activeSceneId
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPickScene(s.id)}
                className={clsx(
                  'flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs font-bold transition-colors',
                  active ? 'bg-sky-500 text-white' : 'text-white/70 hover:bg-white/10',
                )}
              >
                <span className="truncate">{s.name}</span>
                <span
                  className={clsx(
                    'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px]',
                    active ? 'bg-white/25' : 'bg-white/10 text-white/50',
                  )}
                >
                  {foundHere}/{s.hotspots.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white/35">
          <Users className="h-3 w-3" />
          相关人物
        </div>
        <div className="grid gap-1">
          {theCase.npcs.map((n) => {
            const secret = state.npcSecretsRevealed.includes(n.id)
            const talked = state.interviewedNpcs.includes(n.id)
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onPickNpc(n.id)}
                className="flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs font-bold text-white/70 transition-colors hover:bg-white/10"
              >
                <span className="text-base">{n.emoji}</span>
                <span className="min-w-0 truncate">{n.name}</span>
                <span className="ml-auto shrink-0">
                  {secret ? (
                    <span title="已问出关键信息">🤫</span>
                  ) : talked ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-sky-500/10 p-3 ring-1 ring-sky-400/25">
        <div className="text-[11px] font-extrabold text-sky-300">🎯 侦查目标</div>
        <div className="mt-1.5 text-xs leading-relaxed text-white/75">{theCase.intro.briefing}</div>
      </div>
    </div>
  )
}

// ── 中间栏：证人对话 ──────────────────────────────

function NpcDialogue({
  npc,
  secretRevealed,
  onReveal,
  onBack,
}: {
  npc: DetectiveNpc
  secretRevealed: boolean
  onReveal: () => void
  onBack: () => void
}) {
  const [asked, setAsked] = useState<Set<string>>(new Set())
  const [activeResponse, setActiveResponse] = useState<string | null>(null)

  const ask = (key: string, isSecret: boolean) => {
    if (asked.has(key)) return
    setAsked((prev) => new Set(prev).add(key))
    setActiveResponse(key)
    if (isSecret) onReveal()
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl bg-white/[0.03] ring-1 ring-white/10">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-xl">
          {npc.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold">{npc.name}</div>
          <div className="truncate text-xs text-white/50">{npc.role}</div>
        </div>
        <button
          type="button"
          onClick={onBack}
          aria-label="回到现场"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-white/80">
          💬 “{npc.dialogue}”
        </div>

        {!activeResponse && (
          <div className="grid gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wide text-white/40">
              选择如何询问
            </div>
            {!asked.has('secret') && !secretRevealed && (
              <button
                type="button"
                onClick={() => ask('secret', true)}
                className="rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-left text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/20"
              >
                🔍 {npc.triggerQuestion}
              </button>
            )}
            {npc.otherQuestions.map((oq, idx) => {
              const key = `other-${idx}`
              if (asked.has(key)) return null
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => ask(key, false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                >
                  💬 {oq.question}
                </button>
              )
            })}
          </div>
        )}

        {activeResponse && (
          <div className="grid gap-3">
            <div className="rounded-2xl bg-sky-500/10 px-4 py-3 text-sm leading-relaxed text-white/85 ring-1 ring-sky-400/25">
              <div className="mb-1 font-bold">
                {activeResponse === 'secret' ? '🤫 他透露了一个秘密：' : '💬 回答：'}
              </div>
              {activeResponse === 'secret'
                ? npc.secret
                : npc.otherQuestions[Number(activeResponse.split('-')[1])]?.response}
            </div>
            <Button variant="secondary" onClick={onBack} className="w-full">
              ← 继续调查
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 简报 ──────────────────────────────────────────

function BriefingView({
  theCase,
  totalClues,
  onStart,
}: {
  theCase: DetectiveCaseData
  totalClues: number
  onStart: () => void
}) {
  return (
    <ScrollPane>
      <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{theCase.emoji}</span>
          <div>
            <div className="text-xl font-black">{theCase.title}</div>
            <div className="text-sm text-white/80">{theCase.subtitle}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10">
        {theCase.intro.narrative.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-white/75">
            {p}
          </p>
        ))}
        <div className="rounded-2xl bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100 ring-1 ring-sky-400/25">
          🎯 {theCase.intro.briefing}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat value={theCase.scenes.length} label="可调查场景" />
        <Stat value={totalClues} label="待搜集线索" />
        <Stat value={theCase.npcs.length} label="可询问证人" />
      </div>

      <Button onClick={onStart} className="w-full" size="lg">
        开始搜查！ <Search className="h-4 w-4 ml-1.5" />
      </Button>
    </ScrollPane>
  )
}

/**
 * 简报 / 推理 / 结算三个整页共用的滚动壳。
 *
 * 注意是**外层滚动、内层 grid**。把两者合到一起（`grid h-full overflow-y-auto`）
 * 会让 grid 容器拿到一个确定高度，行高就要和这个高度分配博弈：内容超出时行被
 * 压到最小尺寸，而展开的卡片会把内容溢出到下一行上面，叠成一团。
 */
function ScrollPane({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-2xl gap-4 px-4 pb-6">{children}</div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] py-3 text-center ring-1 ring-white/10">
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[11px] text-white/50">{label}</div>
    </div>
  )
}

// ── 推理 ──────────────────────────────────────────

function DeductionView({
  theCase,
  answers,
  submitting,
  allDone,
  onAnswer,
  onSubmit,
}: {
  theCase: DetectiveCaseData
  answers: Record<string, string>
  submitting: boolean
  allDone: boolean
  onAnswer: (qId: string, optId: string) => void
  onSubmit: () => void
}) {
  return (
    <ScrollPane>
      <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] to-[var(--p-primary-dark)] p-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧩</span>
          <div>
            <div className="text-base font-extrabold">{theCase.deduction.title}</div>
            <div className="text-sm text-white/80">{theCase.deduction.description}</div>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-black/15 px-3.5 py-2.5 text-xs leading-relaxed text-white/85">
          右边是你收集到的证据墙 —— <span className="font-bold">对着线索作答，别凭记忆</span>。
          <span className="lg:hidden">手机上点顶栏的放大镜图标打开它。</span>
        </div>
      </div>

      {theCase.deduction.questions.map((q) => {
        const chosen = answers[q.id]
        return (
          <div key={q.id} className="rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10">
            <div className="mb-3 text-sm font-extrabold text-white/90">{q.question}</div>
            <div className="grid gap-2">
              {q.options.map((opt, i) => {
                const selected = chosen === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onAnswer(q.id, opt.id)}
                    className={clsx(
                      'flex items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                      selected
                        ? 'border-sky-400/60 bg-sky-500/15 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.07]',
                    )}
                  >
                    <span
                      className={clsx(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold',
                        selected ? 'bg-sky-500 text-white' : 'bg-white/10 text-white/50',
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-semibold leading-relaxed">{opt.text}</span>
                  </button>
                )
              })}
            </div>
            {chosen && (
              <div className="mt-3 rounded-2xl bg-sky-500/10 px-4 py-3 text-xs leading-relaxed text-white/80 ring-1 ring-sky-400/25">
                {q.options.find((o) => o.id === chosen)?.explanation}
              </div>
            )}
          </div>
        )
      })}

      <Button onClick={onSubmit} disabled={!allDone || submitting} className="w-full" size="lg">
        {submitting ? '🕵️‍♀️ 还原真相中...' : '🔍 揭晓真相！'}
      </Button>
    </ScrollPane>
  )
}

// ── 结算 ──────────────────────────────────────────

function ResultView({
  theCase,
  state,
  xpGained,
  submitError,
  submitting,
  intervention,
  onRetry,
  onRestart,
  onExit,
}: {
  theCase: DetectiveCaseData
  state: PlayerState
  xpGained: number
  submitError: string | null
  submitting: boolean
  intervention: Intervention | null
  onRetry: () => void
  onRestart: () => void
  onExit: () => void
}) {
  const scoreData = calcScore(state, theCase)
  return (
    <ScrollPane>
      <div className="rounded-3xl bg-gradient-to-br from-[var(--p-primary)] via-[#4bb5e5] to-[var(--p-primary-dark)] p-6 text-center">
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
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <span>成绩未能保存：{submitError}</span>
          <Button size="sm" variant="secondary" onClick={onRetry} disabled={submitting}>
            {submitting ? '重试中…' : '重试'}
          </Button>
        </div>
      )}

      <div className="rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10">
        <div className="mb-1 text-base font-extrabold">📊 侦探评分</div>
        <div className="mb-4 text-sm text-white/50">
          总分 {scoreData.score}/{scoreData.maxScore}
          {scoreData.score === scoreData.maxScore
            ? ' · 🎉 完美推理！你是名侦探！'
            : scoreData.score >= scoreData.maxScore * 0.7
              ? ' · 👏 干得漂亮！'
              : ' · 💪 继续练习观察力！'}
        </div>
        <div className="grid gap-2">
          {scoreData.details.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-bold text-white/60">{d.label}</span>
              <div className="flex-1">
                <ProgressBar value={(d.earned / Math.max(1, d.max)) * 100} size="sm" color="blue" />
              </div>
              <span
                className={clsx(
                  'w-12 text-right text-xs font-extrabold',
                  d.earned === d.max ? 'text-sky-300' : 'text-white/50',
                )}
              >
                {d.earned}/{d.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-sky-500/10 p-5 ring-1 ring-sky-400/25">
        <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-sky-200">
          <Lightbulb className="h-4 w-4" />
          真相大白
        </div>
        <div className="text-sm leading-relaxed text-white/80">{theCase.result.summary}</div>
      </div>

      <div className="rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10">
        <div className="whitespace-pre-line text-sm leading-relaxed text-white/70">
          {theCase.result.fullStory}
        </div>
      </div>

      {/* 智能体复盘。放在「真相大白」之后：先读完案子发生了什么，再看自己漏了什么 */}
      <InterventionCard data={intervention} tone="dark" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="primary" onClick={onRestart} className="w-full">
          🔄 再玩一次
        </Button>
        <Button variant="secondary" onClick={onExit} className="w-full">
          📋 返回案件列表
        </Button>
      </div>
    </ScrollPane>
  )
}
