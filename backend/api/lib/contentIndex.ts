/**
 * 服务端的内容索引：只需要知道「每个案件/每篇漫画属于哪个主题」。
 *
 * 为什么服务端要单独留一份：案件的判分逻辑和完整数据都在前端（1975 行的
 * detectiveCases.ts 之类），服务端无从复算成绩，也不该把那份数据复制过来。
 * 但「推荐哪篇漫画」这个路由决策必须是服务端说了算，不能听客户端的。
 * 所以只保留这一个 13 条的索引，而不是整份内容。
 *
 * 与前端 `src/data/topics.ts` 的 `Topic` 必须保持一致。前端有 `topics.ts`
 * 作为单一事实源，这边是它的镜像 —— 新增案件/漫画时两边都要改。
 * （跨 FE/BE 没有共享包，这是当前工程结构下的取舍。）
 */

export const TOPICS = [
  '校园安全',
  '网络安全',
  '家庭权益',
  '消费者权益',
  '交通安全',
  '禁毒教育',
] as const

export type Topic = (typeof TOPICS)[number]

export const ABILITY_AXES = [
  'OBSERVE',
  'INTERVIEW',
  'EVIDENCE',
  'REASONING',
  'LAW',
  'ARGUE',
] as const

export type AbilityAxis = (typeof ABILITY_AXES)[number]

export const ABILITY_LABELS: Record<AbilityAxis, string> = {
  OBSERVE: '观察取证',
  INTERVIEW: '信息获取',
  EVIDENCE: '证据审查',
  REASONING: '逻辑推理',
  LAW: '法律适用',
  ARGUE: '表达论辩',
}

/** 少于这个样本量时不出诊断 —— 见 SkillAxis 模型上的注释 */
export const MIN_SAMPLES_FOR_DIAGNOSIS = 3

export type GameType = 'COURT' | 'DETECTIVE'

/** 案件 → 主题 + 标题 + 所属游戏。id 与前端 `detectiveCases.ts` / `courtCases.ts` 一致 */
export const GAME_CASE_INDEX: Record<
  string,
  { topic: Topic; title: string; gameType: GameType }
> = {
  // 案件侦查
  'detective-art-1': { topic: '校园安全', title: '画室的神秘涂鸦', gameType: 'DETECTIVE' },
  'detective-canteen-1': { topic: '校园安全', title: '食堂的幽灵窃贼', gameType: 'DETECTIVE' },
  'detective-rumor-1': { topic: '网络安全', title: '朋友圈的谣言风暴', gameType: 'DETECTIVE' },
  'detective-gym-1': { topic: '校园安全', title: '体育器材室的黑影', gameType: 'DETECTIVE' },
  'detective-ghost-1': { topic: '网络安全', title: '班级群里的幽灵', gameType: 'DETECTIVE' },
  // 模拟法庭
  'case-campus-1': { topic: '校园安全', title: '走廊里的阴影', gameType: 'COURT' },
  'case-network-1': { topic: '网络安全', title: '刷单的陷阱', gameType: 'COURT' },
  'case-consumer-1': { topic: '消费者权益', title: '648 元的秘密', gameType: 'COURT' },
  'case-traffic-1': { topic: '交通安全', title: '十字路口的抉择', gameType: 'COURT' },
  'case-drug-1': { topic: '禁毒教育', title: '提神糖的秘密', gameType: 'COURT' },
}

export function caseTopic(caseId: string): Topic | null {
  return GAME_CASE_INDEX[caseId]?.topic ?? null
}

/**
 * 找同主题下另一个游戏的案件 —— 用于「在侦查里发现问题，去法庭检验」。
 * 注意 6 大主题里 `家庭权益` 没有任何游戏案件，`交通安全`/`禁毒教育` 只有法庭，
 * 所以这里可能返回 null，调用方必须处理。
 */
export function crossGameCaseForTopic(
  topic: Topic,
  exclude: GameType,
): { id: string; title: string; gameType: GameType } | null {
  for (const [id, meta] of Object.entries(GAME_CASE_INDEX)) {
    if (meta.topic === topic && meta.gameType !== exclude) {
      return { id, title: meta.title, gameType: meta.gameType }
    }
  }
  return null
}

/**
 * 漫画 → 主题 + 标题 + 总结题答案。
 *
 * 标题用于推荐文案，不再让前端拼字符串（原先服务端用的是 'campus' 这类
 * 编号，和前端上报的 'comic-bullying-1' 完全对不上，导致"已读"检查永远
 * 不命中、反复推荐学生读过的漫画）。
 *
 * 答案留在服务端判：漫画总结题的 +5 XP 是一次直接发放，不像游戏成绩那样
 * 受"最好成绩差额"保护，交给客户端自报对错等于白送。
 */
export const COMIC_INDEX: Record<
  string,
  { topic: Topic; title: string; quizCorrectId: string }
> = {
  'comic-bullying-1': { topic: '校园安全', title: '小明的烦恼', quizCorrectId: 'b' },
  'comic-online-1': { topic: '网络安全', title: '天上掉馅饼？', quizCorrectId: 'c' },
  'comic-consumer-1': { topic: '消费者权益', title: '买的球鞋是假货', quizCorrectId: 'd' },
}

/** 主题 → 该主题下的漫画（用于「弱项主题 → 推荐漫画」） */
export function comicForTopic(topic: Topic): { id: string; title: string } | null {
  for (const [id, meta] of Object.entries(COMIC_INDEX)) {
    if (meta.topic === topic) return { id, title: meta.title }
  }
  return null
}
