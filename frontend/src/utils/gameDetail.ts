import type { AbilityAxis } from '@/data/topics'

/**
 * 上报给服务端的单局明细。形状必须与后端 `DetailSchema` 一致
 * （backend/api/routes/student.ts）—— 那边用 zod 卡了同样的上限，对不上会 400。
 *
 * 服务端无法复算这两个游戏的成绩（判分逻辑和案件数据都在前端），所以这份
 * 数据是「被信任」的。它只用于诊断，不参与 XP 结算 —— XP 仍只由 score/maxScore
 * 决定，那条路上原有的 clamp 和「最好成绩差额」防护一个都没动。
 */

export type MissedKind =
  | 'clue-physical'
  | 'clue-digital'
  | 'clue-testimony'
  | 'clue-observation'
  | 'evidence'
  | 'debate'
  | 'law'
  | 'verdict'

export type AxisScore = { axis: AbilityAxis; correct: number; total: number }

export type GameDetail = {
  v: 1
  axes: AxisScore[]
  missed: { label: string; kind: MissedKind }[]
  durationMs: number
}

/** 与服务端 zod 的 `.max()` 对齐，客户端先裁掉，免得白跑一次 400 */
export const MISSED_LIMIT = 40
const LABEL_MAX = 40

/** 线索标题/题干可能很长，服务端只收 40 字 */
export function clipLabel(text: string): string {
  const t = text.trim()
  return t.length <= LABEL_MAX ? t : `${t.slice(0, LABEL_MAX - 1)}…`
}

/** 案件线索类型 → 明细里的分类 */
export function clueKind(type: string): MissedKind {
  switch (type) {
    case 'physical':
      return 'clue-physical'
    case 'digital':
      return 'clue-digital'
    case 'testimony':
      return 'clue-testimony'
    default:
      return 'clue-observation'
  }
}
