/**
 * 学生对话风险预警引擎
 *
 * 两级判定，各司其职：
 *
 * 1) quickScreen —— 同步窄规则，命中就在回复最前面强制插入求助卡片。
 *    这一步不调模型、不受 AI Key 是否配置影响。真正救命的部分必须确定，
 *    不能指望模型当天状态好。
 *
 * 2) classifyWithModel —— 异步模型判定，产出风险类型 / 等级 / 摘要 / 疏导建议给教师端。
 *    提示词里明确要求区分「学生真的在求助」和「学生只是在学法律」，
 *    这是普法场景特有的误报来源：内置快捷提问里 4 条有 3 条都带风险词。
 */

import { prisma } from './prisma.js'
import { env } from './env.js'
import { pushToTeacher } from './riskStream.js'

// ─────────────────────────── 1) 同步窄规则 ───────────────────────────

/**
 * A 类信号：本身就带自指性的危机表达，不可能出现在求知句里。
 * 命中即判高危，不再做求知句式排除——「我不想活了，我该怎么办」不能被当成提问放过去。
 */
const SELF_CRISIS_SIGNALS = [
  '不想活',
  '想死',
  '活不下去',
  '活着没意思',
  '活着没意义',
  '结束生命',
  '想不开',
  '轻生',
  '割腕',
  '自残',
  '跳楼',
]

/**
 * B 类信号：既可能是真实处境，也可能是法律学习（「自杀违法吗」「被打还手算正当防卫吗」）。
 * 必须同时满足第一人称自指、且不含求知句式，才算命中。
 */
const AMBIGUOUS_SIGNALS = [
  '自杀',
  '打我',
  '被打',
  '揍我',
  '欺负我',
  '霸凌我',
  '威胁我',
  '勒索我',
  '敲诈我',
  '强迫我',
  '猥亵',
  '性侵',
  '强暴',
  '伤害我',
  '不敢上学',
  '不敢回家',
]

const FIRST_PERSON = ['我', '自己', '咱']

const INQUIRY_PATTERNS = [
  '怎么办',
  '如何',
  '怎么',
  '该不该',
  '是否',
  '算不算',
  '是不是',
  '法律上',
  '判几年',
  '怎么判',
  '责任',
  '违法吗',
  '犯法吗',
  '有什么后果',
  '构成什么',
  '属于什么',
  '如果',
  '假如',
]

/** 同步窄规则：命中即认为需要立刻给出求助出口，不经过模型 */
export function quickScreen(message: string): boolean {
  if (SELF_CRISIS_SIGNALS.some((s) => message.includes(s))) return true
  if (!AMBIGUOUS_SIGNALS.some((s) => message.includes(s))) return false
  if (!FIRST_PERSON.some((s) => message.includes(s))) return false
  if (INQUIRY_PATTERNS.some((s) => message.includes(s))) return false
  return true
}

/**
 * 候选预筛：决定「这条消息值不值得花一次模型调用」。
 *
 * 与 quickScreen 的取向相反——这里要的是召回，宁可多捞一批交给模型去否掉。
 * 因为心理风险最主要的形态（持续低落、被孤立、家庭冲突）根本没有硬关键词，
 * 只靠上面的窄规则会让整个功能只剩「自伤自杀」一种能被发现。
 *
 * 成本调节就调这个列表，不要动 quickScreen：后者决定卡片出不出，误报代价高得多。
 */
const CANDIDATE_KEYWORDS = [
  // 情绪与心理。用单个词而不是「被孤立」这类短语——学生写的是「我被同学孤立了」，
  // 短语会因为中间插了别的字而匹配不上，这类漏召回正是心理风险的主要来源。
  '难受',
  '难过',
  '抑郁',
  '不开心',
  '高兴不起来',
  '崩溃',
  '焦虑',
  '压力',
  '绝望',
  '没意思',
  '孤独',
  '孤单',
  '孤立',
  '排挤',
  '冷落',
  '讨厌自己',
  '睡不着',
  '想哭',
  // 自伤与危机
  ...SELF_CRISIS_SIGNALS,
  ...AMBIGUOUS_SIGNALS,
  '伤害自己',
  // 被侵害与欺凌
  '欺负',
  '霸凌',
  '打我',
  '骂我',
  '侮辱',
  '嘲笑',
  '取笑',
  '造谣',
  '威胁',
  '勒索',
  '敲诈',
  '强迫',
  '跟踪',
  '堵我',
  '抢我',
  // 家庭
  '家暴',
  '吵架',
  '离婚',
  '打我',
  '骂我',
  '赶我',
  '离家出走',
  '不想回家',
  // 网络。用「照片」而不是「发我照片」：学生写的是「拍了我的照片，说不给钱就发出去」，
  // 短语匹配会因为措辞变化整个漏掉，而这正是最需要被发现的一类。
  '照片',
  '裸照',
  '私密照',
  '人肉',
  '网暴',
  '不给钱',
  '发出去',
  '拍我',
]

export function isRiskCandidate(message: string): boolean {
  return CANDIDATE_KEYWORDS.some((k) => message.includes(k))
}

/**
 * 高危时拼在回复最前面的求助卡片。
 * 由代码层拼接而不是让模型生成，保证它一定出现。
 */
export const CRISIS_CARD =
  '> **你现在说的这件事很重要，先别急着看后面的内容。**\n' +
  '>\n' +
  '> 请现在就找一个能立刻帮到你的人说一声：信任的家长、老师，或者直接拨打 **110**。\n' +
  '> 需要法律帮助可以打 **12348**，未成年人保护热线是 **12345**。\n' +
  '>\n' +
  '> 如果此刻你有伤害自己的念头，请先不要一个人待着。\n\n' +
  '---\n\n'

// ─────────────────────────── 2) 模型异步判定 ───────────────────────────

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export type RiskVerdict = {
  risky: boolean
  kind: string
  level: RiskLevel
  summary: string
  suggestion: string
}

const LEVELS: RiskLevel[] = ['HIGH', 'MEDIUM', 'LOW']

const CLASSIFY_SYSTEM_PROMPT =
  '你在帮助一位中学老师判断学生是否需要被关心。下面是学生与校园咨询助手的一段对话。\n' +
  '请判断【最后那条学生发言】是否透露出需要成年人介入的风险。\n' +
  '\n' +
  '只输出一个 JSON 对象，不要任何其它文字、不要代码块标记：\n' +
  '{"risky": true或false, "kind": "自伤风险|遭受侵害|校园欺凌|家庭风险|网络风险|情绪困扰|无", ' +
  '"level": "HIGH|MEDIUM|LOW", "summary": "用一句话向老师说明这个学生的情况", ' +
  '"suggestion": "给老师的一条具体沟通建议"}\n' +
  '\n' +
  '判定标准：\n' +
  '- HIGH：出现自伤或自杀念头、正在遭受暴力或性侵害、被勒索威胁恐吓\n' +
  '- MEDIUM：持续的情绪低落、被孤立排挤、家庭冲突或家暴线索\n' +
  '- LOW：一般的负面情绪吐槽，不需要立刻介入\n' +
  '\n' +
  '这个应用是普法学习平台，学生经常在学法律知识、问法条、做假设推演。\n' +
  '【判断依据必须是最后那条发言本身】：此前的发言只作背景，不要因为它而抬高最后这条的判定。\n' +
  '当学生在了解法律规定、询问他人案例、做假设推演，而不是在描述自己的亲身处境时，' +
  'risky 必须为 false，kind 填 "无"。\n' +
  '\n' +
  '示例：\n' +
  '「自杀违法吗？」→ 在学法律，risky=false，kind="无"\n' +
  '「正当防卫把人打伤算犯法吗？」→ 在学法律，risky=false，kind="无"\n' +
  '「同学被霸凌了我该怎么帮他？」→ 是他人处境，risky=false，kind="无"\n' +
  '「我不想活了」→ risky=true，kind="自伤风险"，level="HIGH"\n' +
  '「同学天天在班里骂我，我不想上学了」→ risky=true，kind="校园欺凌"，level="MEDIUM"\n' +
  '「有人拍了我的照片，说不给钱就发出去」→ risky=true，kind="网络风险"，level="HIGH"\n' +
  '「我最近总是睡不着，觉得什么都没意思」→ risky=true，kind="情绪困扰"，level="MEDIUM"\n' +
  '\n' +
  'summary 和 suggestion 面向老师，用词要客观，不要复述学生的原话。'

/** 调用模型做一次风险判定；未配置 AI Key 或调用失败时返回 null（由调用方降级） */
export async function classifyWithModel(
  message: string,
  recentMessages: string[],
): Promise<RiskVerdict | null> {
  if (!env.OPENAI_API_KEY || !env.OPENAI_BASE_URL) return null

  const context = recentMessages.length
    ? `此前该学生的发言：\n${recentMessages.map((m) => `- ${m}`).join('\n')}\n\n`
    : ''

  const body = {
    model: env.OPENAI_MODEL,
    messages: [
      { role: 'system', content: CLASSIFY_SYSTEM_PROMPT },
      { role: 'user', content: `${context}最后这条学生发言：\n${message}` },
    ],
    temperature: 0,
  }

  try {
    const r = await fetch(`${env.OPENAI_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!r.ok) return null

    const data = (await r.json()) as unknown
    const raw = readContent(data)
    if (!raw) return null

    const parsed = parseVerdict(raw)
    return parsed
  } catch {
    return null
  }
}

function readContent(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null
  const choices = (data as Record<string, unknown>).choices
  if (!Array.isArray(choices) || choices.length === 0) return null
  const first = choices[0]
  if (typeof first !== 'object' || first === null) return null
  const msg = (first as Record<string, unknown>).message
  if (typeof msg !== 'object' || msg === null) return null
  const content = (msg as Record<string, unknown>).content
  return typeof content === 'string' ? content : null
}

/** 模型偶尔会把 JSON 包在 ```json 里或前后带解释，这里做一次宽松提取 */
function parseVerdict(raw: string): RiskVerdict | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }

  const level = LEVELS.includes(obj.level as RiskLevel) ? (obj.level as RiskLevel) : 'LOW'
  const kind = typeof obj.kind === 'string' && obj.kind.trim() ? obj.kind.trim() : '情绪困扰'

  return {
    risky: obj.risky === true,
    kind,
    level,
    summary: typeof obj.summary === 'string' ? obj.summary.slice(0, 500) : '',
    suggestion: typeof obj.suggestion === 'string' ? obj.suggestion.slice(0, 500) : '',
  }
}

// ─────────────────────────── 3) 落库 + 推送 ───────────────────────────

const AGGREGATE_WINDOW_MS = 24 * 60 * 60 * 1000
const SNIPPET_MAX = 200

const LEVEL_RANK: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 }

function higherLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b
}

export type RiskEventInput = {
  studentId: string
  kind: string
  level: RiskLevel
  snippet: string
  summary?: string
  suggestion?: string
}

/**
 * 写入一条风险事件。
 *
 * 同一学生、同一类型、24 小时内且仍未处理的事件不新建记录，而是累加 triggerCount——
 * 否则学生连发几条就会被记成几条预警，教师端会被同一个人的名字刷满而直接忽略整个面板。
 */
export async function recordRiskEvent(input: RiskEventInput) {
  const membership = await prisma.classMember.findFirst({
    where: { studentId: input.studentId },
    select: { classId: true },
  })
  const classId = membership?.classId ?? null

  const snippet = input.snippet.slice(0, SNIPPET_MAX)
  const since = new Date(Date.now() - AGGREGATE_WINDOW_MS)

  const existing = await prisma.riskEvent.findFirst({
    where: {
      studentId: input.studentId,
      kind: input.kind,
      status: 'OPEN',
      lastSeenAt: { gte: since },
    },
    orderBy: { lastSeenAt: 'desc' },
  })

  // 聚合时原句的处理规则：只有新触发的等级【严格更高】才替换。
  //
  // 两个方向都踩过坑：
  // - 无条件覆盖 → 一条轻量误报会把真实高危的原句顶掉，教师看到的证据被污染；
  // - 永远保留第一条 → 先来一条较弱的，后来的真正高危反而被藏起来。
  // 取「更严重的那个」，平级时保留先出现的，两种失效都避开了。
  const isMoreSevere =
    existing && LEVEL_RANK[input.level] > LEVEL_RANK[existing.level as RiskLevel]

  const event = existing
    ? await prisma.riskEvent.update({
        where: { id: existing.id },
        data: {
          triggerCount: { increment: 1 },
          lastSeenAt: new Date(),
          level: higherLevel(existing.level as RiskLevel, input.level),
          ...(isMoreSevere
            ? { snippet, summary: input.summary || existing.summary, suggestion: input.suggestion || existing.suggestion }
            : {}),
        },
      })
    : await prisma.riskEvent.create({
        data: {
          studentId: input.studentId,
          classId,
          kind: input.kind,
          level: input.level,
          snippet,
          summary: input.summary || null,
          suggestion: input.suggestion || null,
          lastSeenAt: new Date(),
        },
      })

  await notifyTeacher(classId, event.id)

  return event
}

/** 推送给该学生所在班级的班主任（收紧为单一班级后只会有一条归属） */
async function notifyTeacher(classId: string | null, eventId: string) {
  if (!classId) return
  try {
    const clazz = await prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    })
    if (!clazz) return
    pushToTeacher(clazz.teacherId, 'risk-event', { id: eventId })
  } catch {
    // 推送失败不影响落库：教师下次进页面拉列表仍然能看到
  }
}

/**
 * 完整的异步检测流程：拉最近几条上下文 → 模型判定 → 落库 → 推送。
 * 由路由层 fire-and-forget 调用，绝不 await，避免拖慢学生那边的回复。
 *
 * @param crisis 同步窄规则的判定结果，用于模型不可用时降级
 */
export async function runRiskDetection(
  studentId: string,
  message: string,
  sessionId: string,
  crisis: boolean,
) {
  try {
    const recent = await prisma.aiChatMessage.findMany({
      where: { studentId, sessionId, role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { content: true },
    })
    // 去掉刚存进去的当前这条，只保留真正的上文
    const context = recent.map((m) => m.content).filter((c) => c !== message).reverse()

    const verdict = await classifyWithModel(message, context)
    const modelSaysRisky = verdict?.risky === true && verdict.level !== 'LOW'

    // 窄规则命中时级别下限锁死 HIGH：模型可以补充描述，但没有权力把规则判定压下去。
    // 反过来，模型单独判出的中高危也成立——「我最近很难受，没人理我」这类
    // 没有硬关键词的情绪风险，只能靠模型捞出来。
    //
    // 模型不可用时（未配置 Key / 调用失败，verdict 为 null）只信窄规则，
    // 否则「没配 Key 时核心能力依然可用」在这个功能上就不成立。
    if (!crisis && !modelSaysRisky) return

    await recordRiskEvent({
      studentId,
      kind: modelSaysRisky && verdict ? verdict.kind : '疑似自伤或受侵害',
      level: crisis ? 'HIGH' : (verdict as RiskVerdict).level,
      snippet: message,
      summary: verdict?.summary || '系统在学生与助手的对话中识别到需要关注的风险表述。',
      suggestion:
        verdict?.suggestion ||
        '建议私下、单独地关心这位学生最近的状况，避免在班级里点名询问。',
    })
  } catch {
    // 检测链路任何一步失败都不能影响学生正常使用
  }
}
