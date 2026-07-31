/**
 * 学生画像分析引擎
 *
 * 基于学生的答题数据、学习行为，生成多维画像：
 * - topicMasteries: 6 大主题掌握度
 * - weakAreas: 薄弱点识别
 * - strengths: 优势领域
 * - learningStyle: 学习风格
 */

import { prisma } from './prisma.js'

export type TopicMastery = {
  topic: string
  mastery: number
  questionsTotal: number
  questionsCorrect: number
  trend: 'up' | 'down' | 'stable'
}

export type WeakArea = {
  topic: string
  questionType: string
  failCount: number
  failRate: number
  suggestion: string
}

export type Strength = {
  topic: string
  accuracy: number
  questionType: string
}

export type LearningStyle = {
  preferredTypes: string[]
  activePattern: 'morning' | 'afternoon' | 'evening' | 'irregular'
  pace: 'fast' | 'steady' | 'slow'
  weeklyAvgAttempts: number
}

export type StudentProfileData = {
  topicMasteries: TopicMastery[]
  weakAreas: WeakArea[]
  strengths: Strength[]
  learningStyle: LearningStyle
  totalAttempts: number
  totalCorrect: number
  totalQuestions: number
  overallAccuracy: number
}

const TOPIC_MAP: Record<string, string> = {
  '校园法律': '校园安全',
  '网络法律': '网络安全',
  '家庭法律': '家庭权益',
  '消费法律': '消费者权益',
  '交通安全': '交通安全',
  '禁毒法律': '禁毒教育',
}

const SUGGESTION_MAP: Record<string, string> = {
  '校园安全': '建议重看「校园欺凌」主题漫画，复习相关关卡',
  '网络安全': '建议学习「识别网络诈骗」和「个人信息保护」关卡',
  '家庭权益': '建议了解「监护责任与求助渠道」相关关卡',
  '消费者权益': '建议学习「消费维权」相关关卡和案例',
  '交通安全': '建议复习「交通规则与出行安全」关卡',
  '禁毒教育': '建议重看「毒品识别与拒绝技巧」关卡',
}

function getShanghaiWeekStart(): Date {
  const now = new Date()
  const shanghai = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
  const day = shanghai.getDay()
  const diff = shanghai.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(shanghai)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getHourBucket(date: Date): number {
  return date.getHours()
}

function getTrend(
  recentCorrect: number,
  recentTotal: number,
  olderCorrect: number,
  olderTotal: number,
): 'up' | 'down' | 'stable' {
  if (recentTotal === 0 || olderTotal === 0) return 'stable'
  const recentRate = recentCorrect / recentTotal
  const olderRate = olderCorrect / olderTotal
  if (recentRate - olderRate > 0.05) return 'up'
  if (olderRate - recentRate > 0.05) return 'down'
  return 'stable'
}

export async function analyzeStudentProfile(studentId: string, userId: string): Promise<StudentProfileData> {
  // 1. 获取该生的所有答题记录
  const attempts = await prisma.attempt.findMany({
    where: { studentId },
    include: {
      level: {
        include: {
          unit: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  // 2. 获取所有题目的正确答案（用于推断对错分布）
  const levelIds = [...new Set(attempts.map((a) => a.levelId))]
  const questions = await prisma.question.findMany({
    where: { levelId: { in: levelIds } },
    select: { id: true, levelId: true, type: true },
  })

  // 按题目类型分组
  const questionsByLevel = new Map<string, { id: string; type: string }[]>()
  for (const q of questions) {
    const list = questionsByLevel.get(q.levelId) ?? []
    list.push({ id: q.id, type: q.type })
    questionsByLevel.set(q.levelId, list)
  }

  // 3. 按主题聚合
  const topicStats = new Map<
    string,
    {
      total: number
      correct: number
      byType: Map<string, { total: number; correct: number }>
      recentCorrect: number
      recentTotal: number
      olderCorrect: number
      olderTotal: number
    }
  >()

  // 初始化 6 大主题
  for (const topic of Object.values(TOPIC_MAP)) {
    topicStats.set(topic, {
      total: 0,
      correct: 0,
      byType: new Map(),
      recentCorrect: 0,
      recentTotal: 0,
      olderCorrect: 0,
      olderTotal: 0,
    })
  }

  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  for (const attempt of attempts) {
    const category = attempt.level.unit.category
    const topic = TOPIC_MAP[category]
    if (!topic) continue

    const stats = topicStats.get(topic)!
    const levelQuestions = questionsByLevel.get(attempt.levelId) ?? []

    stats.total += attempt.totalCount
    stats.correct += attempt.correctCount

    // 按题型统计
    const correctPerType = distributeCorrectByType(attempt.totalCount, attempt.correctCount, levelQuestions)
    for (const [type, { total, correct }] of Object.entries(correctPerType)) {
      const ts = stats.byType.get(type) ?? { total: 0, correct: 0 }
      ts.total += total
      ts.correct += correct
      stats.byType.set(type, ts)
    }

    // 趋势：近3个月 vs 更早
    if (attempt.createdAt >= threeMonthsAgo) {
      stats.recentTotal += attempt.totalCount
      stats.recentCorrect += attempt.correctCount
    } else {
      stats.olderTotal += attempt.totalCount
      stats.olderCorrect += attempt.correctCount
    }
  }

  // 4. 构建画像
  const topicMasteries: TopicMastery[] = []
  const weakAreas: WeakArea[] = []
  const strengths: Strength[] = []
  let totalQ = 0
  let totalC = 0

  for (const [topic, stats] of topicStats.entries()) {
    if (stats.total === 0) {
      topicMasteries.push({ topic, mastery: 0, questionsTotal: 0, questionsCorrect: 0, trend: 'stable' })
      continue
    }

    const mastery = Math.round((stats.correct / stats.total) * 100)
    const trend = getTrend(stats.recentCorrect, stats.recentTotal, stats.olderCorrect, stats.olderTotal)

    topicMasteries.push({
      topic,
      mastery,
      questionsTotal: stats.total,
      questionsCorrect: stats.correct,
      trend,
    })

    totalQ += stats.total
    totalC += stats.correct

    // 识别薄弱点 (掌握度 < 60%)
    if (mastery < 60) {
      weakAreas.push({
        topic,
        questionType: '综合',
        failCount: stats.total - stats.correct,
        failRate: Math.round(((stats.total - stats.correct) / stats.total) * 100),
        suggestion: SUGGESTION_MAP[topic] ?? '建议复习该主题相关关卡',
      })
    }

    // 按题型识别薄弱点
    for (const [type, ts] of stats.byType.entries()) {
      const typeAccuracy = Math.round((ts.correct / ts.total) * 100)
      if (typeAccuracy < 60 && ts.total >= 2) {
        weakAreas.push({
          topic,
          questionType: type,
          failCount: ts.total - ts.correct,
          failRate: Math.round(((ts.total - ts.correct) / ts.total) * 100),
          suggestion: `${SUGGESTION_MAP[topic] ?? '建议复习该主题'}，特别留意${type === 'SCENARIO' ? '情境分析' : type === 'TRUE_FALSE' ? '判断' : '选择'}题型`,
        })
      }
      // 识别优势 (准确率 > 85%)
      if (typeAccuracy >= 85 && ts.total >= 3) {
        strengths.push({
          topic,
          accuracy: typeAccuracy,
          questionType: type,
        })
      }
    }
  }

  // 5. 学习风格分析
  const attemptTimes = attempts.map((a) => a.createdAt)
  const hourlyBuckets = attemptTimes.map((t) => getHourBucket(t))
  const morning = hourlyBuckets.filter((h) => h >= 6 && h < 12).length
  const afternoon = hourlyBuckets.filter((h) => h >= 12 && h < 18).length
  const evening = hourlyBuckets.filter((h) => h >= 18 || h < 6).length

  let activePattern: LearningStyle['activePattern'] = 'irregular'
  if (morning > afternoon && morning > evening) activePattern = 'morning'
  else if (afternoon > morning && afternoon > evening) activePattern = 'afternoon'
  else if (evening > morning && evening > afternoon) activePattern = 'evening'

  // 学习节奏
  const weekStart = getShanghaiWeekStart()
  const recentWeekAttempts = attempts.filter((a) => a.createdAt >= weekStart).length
  const pace: LearningStyle['pace'] = recentWeekAttempts >= 5 ? 'fast' : recentWeekAttempts >= 2 ? 'steady' : 'slow'

  // 偏好题型
  const typeCount = new Map<string, number>()
  for (const [, stats] of topicStats.entries()) {
    for (const [type, ts] of stats.byType.entries()) {
      typeCount.set(type, (typeCount.get(type) ?? 0) + ts.total)
    }
  }
  const preferredTypes = [...typeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type)

  // 周均做题数
  const oldestDate = attempts.length > 0 ? attempts[attempts.length - 1].createdAt : now
  const weeksSinceStart = Math.max(1, Math.ceil((now.getTime() - oldestDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
  const weeklyAvgAttempts = Math.round((totalQ / weeksSinceStart) * 10) / 10

  const overallAccuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0

  const profile: StudentProfileData = {
    topicMasteries,
    weakAreas: weakAreas.slice(0, 8), // 最多8条
    strengths: strengths.slice(0, 5),
    learningStyle: {
      preferredTypes,
      activePattern,
      pace,
      weeklyAvgAttempts,
    },
    totalAttempts: attempts.length,
    totalCorrect: totalC,
    totalQuestions: totalQ,
    overallAccuracy,
  }

  // 持久化到数据库
  await prisma.studentProfile.upsert({
    where: { studentId },
    update: {
      topicMasteries: profile.topicMasteries,
      weakAreas: profile.weakAreas,
      strengths: profile.strengths,
      learningStyle: profile.learningStyle,
      lastAnalyzed: new Date(),
    },
    create: {
      studentId,
      topicMasteries: profile.topicMasteries,
      weakAreas: profile.weakAreas,
      strengths: profile.strengths,
      learningStyle: profile.learningStyle,
    },
  })

  return profile
}

/**
 * 根据题目的题型分布，将 total/correct 按比例分配到各题型
 */
function distributeCorrectByType(
  totalCount: number,
  correctCount: number,
  levelQuestions: { id: string; type: string }[],
): Record<string, { total: number; correct: number }> {
  const typeCounts = new Map<string, number>()
  for (const q of levelQuestions) {
    typeCounts.set(q.type, (typeCounts.get(q.type) ?? 0) + 1)
  }

  if (typeCounts.size === 0) return {}

  const result: Record<string, { total: number; correct: number }> = {}
  let distributedTotal = 0
  let distributedCorrect = 0

  const entries = [...typeCounts.entries()]
  for (let i = 0; i < entries.length; i++) {
    const [type, count] = entries[i]
    // 最后一种类型用余数法
    if (i === entries.length - 1) {
      result[type] = {
        total: totalCount - distributedTotal,
        correct: correctCount - distributedCorrect,
      }
    } else {
      // 按比例分配
      const ratio = count / levelQuestions.length
      const typeTotal = Math.round(totalCount * ratio)
      const typeCorrect = Math.round(correctCount * ratio)
      result[type] = { total: typeTotal, correct: typeCorrect }
      distributedTotal += typeTotal
      distributedCorrect += typeCorrect
    }
  }

  // 确保非负
  for (const type of Object.keys(result)) {
    result[type].total = Math.max(0, result[type].total)
    result[type].correct = Math.max(0, Math.min(result[type].correct, result[type].total))
  }

  return result
}

export async function getStudentProfile(studentId: string, userId: string): Promise<StudentProfileData> {
  // 惰性更新：检查是否已有画像且不过期（5分钟内）
  const existing = await prisma.studentProfile.findUnique({ where: { studentId } })
  if (existing) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (existing.lastAnalyzed >= fiveMinAgo) {
      return {
        topicMasteries: existing.topicMasteries as unknown as TopicMastery[],
        weakAreas: existing.weakAreas as unknown as WeakArea[],
        strengths: existing.strengths as unknown as Strength[],
        learningStyle: existing.learningStyle as unknown as LearningStyle,
        totalAttempts: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        overallAccuracy: 0,
      }
    }
  }

  return analyzeStudentProfile(studentId, userId)
}
