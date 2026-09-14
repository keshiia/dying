/**
 * 全平台共用的两套坐标轴。
 *
 * 在此之前，三个模块各说各话：闯关用 `unit.category`（校园法律/网络法律/…），
 * 漫画用自由文本（校园欺凌/网络诈骗/…），侦查和法庭干脆没有主题字段。
 * 结果是连「你在网络安全上弱，去读网络诈骗漫画」这句推荐都拼不出来 ——
 * 两个字段对不上。
 *
 * 这里立成单一事实源，任何新增的漫画/案件/关卡都必须挂到 `Topic` 上。
 */

/** 6 大法律主题 —— 与后端 `studentProfile.ts` 的 TOPIC_MAP 输出值保持一致 */
export const TOPICS = [
  '校园安全',
  '网络安全',
  '家庭权益',
  '消费者权益',
  '交通安全',
  '禁毒教育',
] as const

export type Topic = (typeof TOPICS)[number]

/**
 * 6 条能力轴 —— 不是新造的，而是从两个游戏已有的评分维度收敛而来：
 *
 * - OBSERVE   侦查「🔍 线索搜集」＋ 法庭「🔍 现场搜证」
 * - INTERVIEW 侦查「💬 询问证人」
 * - EVIDENCE  法庭「⚖️ 证据审查」＋ 漫画总结题
 * - REASONING 侦查「🧩 推理答题」
 * - LAW       法庭「📜 法条适用」＋「⚖️ 裁决」＋「📋 处分措施」
 * - ARGUE     法庭「💬 法庭辩论」
 *
 * 注意几条轴是「空心」的：INTERVIEW 只有侦查贡献，ARGUE 与 LAW 只有法庭贡献。
 * 诊断时必须把「样本不足」和「掌握度低」分开，否则会给只玩过侦查的学生报
 * 「你的表达论辩能力 0 分」—— 既错误又打击人。
 */
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

/** 判定某条能力轴是否「样本足够」—— 少于这个样本量时不出诊断 */
export const MIN_SAMPLES_FOR_DIAGNOSIS = 3
