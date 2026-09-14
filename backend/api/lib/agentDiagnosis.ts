/**
 * 青知智能体 —— 诊断引擎。
 *
 * 设计原则（写下来是因为很容易被"顺手加个 LLM"破坏）：
 *
 * 1. **诊断是规则算的，不是模型说的。** 同数据每次结论必须一致（演示要能重放），
 *    而且要能回答"凭什么说他观察力弱"——指回具体是哪条轴、漏了哪条线索。
 *    模型的活儿只有一件：把已经算好的结构转写成一句话。
 * 2. **不允许编造。** 模型不得引入结构里没有的线索名或数字。做不到就退模板。
 * 3. **区分「样本不足」和「掌握度低」。** 只玩过侦查的学生在 ARGUE（表达论辩）
 *    轴上一条样本都没有，报"0 分"既错误又打击人。见 MIN_SAMPLES_FOR_DIAGNOSIS。
 * 4. **只报忧是失败的产品。** 有强项就必须先肯定（STRENGTH 规则）。
 */

import { prisma } from './prisma.js'
import {
  ABILITY_AXES,
  ABILITY_LABELS,
  MIN_SAMPLES_FOR_DIAGNOSIS,
  caseTopic,
  comicForTopic,
  crossGameCaseForTopic,
  type AbilityAxis,
  type GameType,
} from './contentIndex.js'

/** 漏掉的东西的分类。clue-* 用于识别「类型盲区」 */
export type MissedKind =
  | 'clue-physical'
  | 'clue-digital'
  | 'clue-testimony'
  | 'clue-observation'
  | 'evidence'
  | 'debate'
  | 'law'
  | 'verdict'

/**
 * 客户端上报的单局明细。
 *
 * 服务端无法复算（判分逻辑与案件数据都在前端），所以这里的数字是**被信任**的。
 * 它只用于诊断，**绝不参与 XP 结算** —— XP 仍只由 score/maxScore 驱动。
 * 形状与大小在路由层用 zod 卡死。
 */
export type GameDetail = {
  v: 1
  axes: { axis: AbilityAxis; correct: number; total: number }[]
  missed: { label: string; kind: MissedKind }[]
  durationMs: number
}

export type Finding = {
  axis: AbilityAxis
  /**
   * - SINGLE      本局这条轴没达标
   * - PATTERN     不是「这条没找到」，而是「这一类你都没查」
   * - REPEATED    同一条轴最近几局反复不达标（不是偶然）
   * - STRENGTH    全对。只报忧是失败的产品，有强项必须先肯定
   */
  kind: 'SINGLE' | 'PATTERN' | 'REPEATED' | 'STRENGTH'
  text: string
  /** 指回具体是哪条线索/哪道题 —— 没有这个就不是诊断，是评价 */
  evidence: string
  crossCase?: string
}

export type Recommendation = {
  kind: 'COMIC' | 'COURT' | 'DETECTIVE'
  targetId: string
  label: string
  reason: string
  /** 可直接 navigate 的路由 */
  to: string
}

export type Intervention = {
  agent: '青知智能体'
  headline: string
  findings: Finding[]
  recommendations: Recommendation[]
  /** 'RULE' = 模板文案；'LLM' = 模型改写过的措辞。P2 才会出现后者 */
  generatedBy: 'RULE' | 'LLM'
}

/** 及格线。低于此值的轴会被拿出来说 */
const PASS_RATE = 0.6
/**
 * 单局内判定「这条轴样本够不够」的下限。
 *
 * 比累计口径（MIN_SAMPLES_FOR_DIAGNOSIS = 3）低，是因为有些轴在一局里天然
 * 只有 2~3 个观测点：法庭的 LAW 由「法条适用 1 + 裁决 1 + 处分措施 0~1」拼成，
 * 案件没有处分措施时就只有 2 个。用 3 做门槛会把整条轴静音。
 * 代价是 1/2 也会被拿出来说 —— 但文案里带原始分数，学生看得见基数。
 */
const MIN_SAMPLES_PER_GAME = 2
/** 「连续几局」的口径 */
const RECENT_GAMES = 3
const MAX_FINDINGS = 3
const MAX_RECOMMENDATIONS = 2

// ── 能力轴聚合 ─────────────────────────────────────

/**
 * 从原始记录重算能力轴，而不是在每次提交时累加。
 *
 * 累加会被重复提交和各处口径差异搞脏（同一局提交两次就多算一次样本），
 * 而重算天然幂等：数据源只有 GameResult.detail 和 ComicRead.quizCorrect，
 * 每个案件最多一条 GameResult，重放多少次结果都一样。代价是每次读 10 行数据。
 */
export async function recomputeSkillAxes(studentId: string): Promise<void> {
  const [results, comicReads] = await Promise.all([
    prisma.gameResult.findMany({ where: { studentId }, select: { detail: true } }),
    prisma.comicRead.findMany({
      where: { studentId, quizCorrect: { not: null } },
      select: { quizCorrect: true },
    }),
  ])

  const acc = new Map<AbilityAxis, { correct: number; total: number }>()
  for (const axis of ABILITY_AXES) acc.set(axis, { correct: 0, total: 0 })

  for (const r of results) {
    const detail = r.detail as unknown as GameDetail | null
    if (!detail || !Array.isArray(detail.axes)) continue
    for (const a of detail.axes) {
      const slot = acc.get(a.axis)
      if (!slot) continue
      slot.correct += Math.max(0, a.correct)
      slot.total += Math.max(0, a.total)
    }
  }

  // 漫画总结题计入「证据审查」—— 三篇漫画的核心情节全是证据动作
  // （保留聊天记录、商品截图、及时告知大人），它其实是证据意识教材。
  const quizSlot = acc.get('EVIDENCE')!
  for (const c of comicReads) {
    quizSlot.total += 1
    if (c.quizCorrect) quizSlot.correct += 1
  }

  await prisma.$transaction(
    [...acc.entries()].map(([axis, v]) =>
      prisma.skillAxis.upsert({
        where: { studentId_axis: { studentId, axis } },
        update: { correct: v.correct, total: v.total },
        create: { studentId, axis, correct: v.correct, total: v.total },
      }),
    ),
  )
}

// ── 诊断 ───────────────────────────────────────────

export async function diagnoseAfterGame(
  studentId: string,
  gameType: GameType,
  caseId: string,
  detail: GameDetail,
): Promise<Intervention> {
  await recomputeSkillAxes(studentId)

  const [recentResults, reads] = await Promise.all([
    prisma.gameResult.findMany({
      where: { studentId, gameType },
      orderBy: { updatedAt: 'desc' },
      take: RECENT_GAMES,
      select: { caseId: true, detail: true },
    }),
    prisma.comicRead.findMany({ where: { studentId }, select: { storyId: true } }),
  ])

  const readIds = new Set(reads.map((r) => r.storyId))
  const topic = caseTopic(caseId)
  const findings: Finding[] = []
  const recommendations: Recommendation[] = []

  // ── 本局哪些轴没达标（样本不足的轴不参与，见文件头第 3 条） ──
  const weak = detail.axes
    .filter((a) => a.total >= MIN_SAMPLES_PER_GAME && a.correct / a.total < PASS_RATE)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)

  const strong = detail.axes.filter(
    (a) => a.total >= MIN_SAMPLES_PER_GAME && a.correct === a.total,
  )

  // ── R2 类型盲区：比"这条没找到"更值得说的是"这类你都没查" ──
  const digitalMissed = detail.missed.filter((m) => m.kind === 'clue-digital')
  if (digitalMissed.length >= 2) {
    findings.push({
      axis: 'OBSERVE',
      kind: 'PATTERN',
      text: `你这次漏了 ${digitalMissed.length} 条电子类证据 —— 手机、电脑、监控这类东西你都没主动查。`,
      evidence: digitalMissed
        .slice(0, 2)
        .map((m) => `「${m.label}」`)
        .join('、'),
    })
  }

  // ── R1 单局弱项 + R3 跨局重复 ──
  // 先剔掉已经被 PATTERN 说过的轴，再取前两条。反过来的话，PATTERN 占掉的那条
  // 会连带吃掉一个名额（slice 之后再 continue），排序第二的弱项就永远报不出来。
  const weakToReport = weak.filter(
    (w) => !findings.some((f) => f.axis === w.axis && f.kind === 'PATTERN'),
  )
  for (const w of weakToReport.slice(0, 2)) {
    const label = ABILITY_LABELS[w.axis]
    const rate = Math.round((w.correct / w.total) * 100)

    // R3：这个轴在最近几局里是不是反复不达标
    const weakRounds = recentResults.filter((r) => {
      const d = r.detail as unknown as GameDetail | null
      const a = d?.axes?.find((x) => x.axis === w.axis)
      return a && a.total >= MIN_SAMPLES_PER_GAME && a.correct / a.total < PASS_RATE
    }).length

    const sample = detail.missed.find((m) => m.kind.startsWith('clue-')) ?? detail.missed[0]
    // 只有真正垫底的那条能说「最弱」，否则两条并列时每句都在自称最弱
    const ranking = w === weak[0] ? '，是这局最弱的一环。' : '，也低于及格线。'
    findings.push({
      axis: w.axis,
      kind: weakRounds >= 2 ? 'REPEATED' : 'SINGLE',
      text: `「${label}」本局 ${w.correct}/${w.total}（${rate}%）${ranking}`,
      evidence: sample ? `漏掉的是「${sample.label}」这类。` : '',
      crossCase:
        weakRounds >= 2
          ? `最近 ${recentResults.length} 局里有 ${weakRounds} 局这一项都不达标 —— 不是偶然。`
          : undefined,
    })
  }

  // ── R5 先肯定：只报忧是失败的产品 ──
  if (strong.length > 0) {
    const s = strong[0]
    findings.unshift({
      axis: s.axis,
      kind: 'STRENGTH',
      text: `「${ABILITY_LABELS[s.axis]}」${s.correct}/${s.total} 全对，这块你不用再花时间。`,
      evidence: '',
    })
  }

  // ── R4 跨模块呼应：把弱点接到具体资源上 ──
  const weakest = weak[0]?.axis ?? null

  // 取证类弱点 → 推同主题漫画。
  // 三篇漫画讲的都是"保留证据""及时求助"这类行为，是 EVIDENCE 的教材；
  // OBSERVE（找得到线索）和 EVIDENCE（判断得了证据）是同一族 —— 找不到的人
  // 往往也不会判断，所以两条轴都算。
  if ((weakest === 'EVIDENCE' || weakest === 'OBSERVE') && topic) {
    const comic = comicForTopic(topic)
    if (comic && !readIds.has(comic.id)) {
      recommendations.push({
        kind: 'COMIC',
        targetId: comic.id,
        label: `看《${comic.title}》`,
        reason: `它讲的就是「${topic}」，主角踩的坑和你这次很像`,
        to: `/play/comics/${comic.id}`,
      })
    }
  }

  // 还有一个主题下没玩过的另一个游戏 → 换个场景检验同一个能力
  if (topic) {
    const other = crossGameCaseForTopic(topic, gameType)
    const played = new Set(recentResults.map((r) => r.caseId))
    if (other && !played.has(other.id)) {
      recommendations.push({
        kind: other.gameType,
        targetId: other.id,
        label: `去「${other.title}」试试`,
        reason:
          gameType === 'DETECTIVE'
            ? '同样的能力，在法庭上会以另一种方式考你'
            : '同样的能力，在侦查现场会以另一种方式考你',
        to:
          other.gameType === 'DETECTIVE'
            ? `/play/detective/${other.id}`
            : '/app/games/court',
      })
    }
  }

  // 兜底：什么都没推的时候，至少给一个能点的地方，别让卡片是死的
  if (recommendations.length === 0 && topic) {
    const comic = comicForTopic(topic)
    if (comic && !readIds.has(comic.id)) {
      recommendations.push({
        kind: 'COMIC',
        targetId: comic.id,
        label: `看《${comic.title}》`,
        reason: `和这个案件同一个主题，几分钟就能读完`,
        to: `/play/comics/${comic.id}`,
      })
    }
  }

  const trimmed = findings.slice(0, MAX_FINDINGS)

  return {
    agent: '青知智能体',
    headline: buildHeadline(trimmed, weak.length, strong.length),
    findings: trimmed,
    recommendations: recommendations.slice(0, MAX_RECOMMENDATIONS),
    generatedBy: 'RULE',
  }
}

/**
 * 模板文案。P2 的 LLM 层只被允许改写这一句，且不得引入结构里没有的事实；
 * 模型不可用时原样返回 —— 闭环在任何情况下都成立。
 */
function buildHeadline(findings: Finding[], weakCount: number, strongCount: number): string {
  const pattern = findings.find((f) => f.kind === 'PATTERN')
  if (pattern) return '找到 1 个可以马上改的习惯'
  const repeated = findings.find((f) => f.kind === 'REPEATED')
  if (repeated) return '同一处卡了两局了，来看看'
  if (weakCount > 0 && strongCount > 0) return '有强项也有短板，看一眼短板在哪'
  if (weakCount > 0) return '这局有可以提升的地方'
  if (strongCount > 0) return '这局打得漂亮，没有明显短板'
  return '这局数据还不够给出结论，多玩一局试试'
}
