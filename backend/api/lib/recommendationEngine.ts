/**
 * 个性化推荐规则引擎
 *
 * 基于学生画像和学习数据，生成个性化的学习推荐。
 */

import { prisma } from './prisma.js'
import type { StudentProfileData } from './studentProfile.js'

export type Recommendation = {
  type: 'LEVEL' | 'REVIEW' | 'RESOURCE' | 'COMIC' | 'GAME'
  targetId: string
  title: string
  reason: string
  urgency: 'high' | 'medium' | 'low'
  xpReward?: number
}

export async function generateRecommendations(
  studentId: string,
  profile: StudentProfileData,
): Promise<Recommendation[]> {
  const recs: Recommendation[] = []

  // 1. 处理低掌握度主题 → 推荐关卡
  const lowMasteryTopics = profile.topicMasteries
    .filter((t) => t.mastery > 0 && t.mastery < 60)

  for (const topic of lowMasteryTopics) {
    const unitCategory = reverseTopicMap(topic.topic)
    if (!unitCategory) continue

    // 找到该主题下第一个未完成的关卡
    const units = await prisma.learningUnit.findMany({
      where: { category: unitCategory, isActive: true },
      select: { id: true },
    })

    const levels = await prisma.level.findMany({
      where: { unitId: { in: units.map((u) => u.id) }, isActive: true },
      orderBy: { orderNo: 'asc' },
      select: { id: true, title: true, xpReward: true },
    })

    const progress = await prisma.userProgress.findMany({
      where: { studentId, levelId: { in: levels.map((l) => l.id) } },
      select: { levelId: true, status: true },
    })
    const completedSet = new Set(progress.filter((p) => p.status === 'COMPLETED').map((p) => p.levelId))

    const firstIncomplete = levels.find((l) => !completedSet.has(l.id))
    if (firstIncomplete) {
      recs.push({
        type: 'LEVEL',
        targetId: firstIncomplete.id,
        title: firstIncomplete.title,
        reason: `你的「${topic.topic}」掌握度仅 ${topic.mastery}%，建议优先学习`,
        urgency: 'high',
        xpReward: firstIncomplete.xpReward,
      })
    }
  }

  // 2. 处理反复挑战但未通过的关卡
  const attempts = await prisma.attempt.findMany({
    where: { studentId },
    select: { levelId: true, score: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const levelAttempts = new Map<string, number>()
  const levelScores = new Map<string, number[]>()
  for (const a of attempts) {
    levelAttempts.set(a.levelId, (levelAttempts.get(a.levelId) ?? 0) + 1)
    const scores = levelScores.get(a.levelId) ?? []
    scores.push(a.score)
    levelScores.set(a.levelId, scores)
  }

  for (const [levelId, count] of levelAttempts.entries()) {
    if (count >= 3) {
      const scores = levelScores.get(levelId) ?? []
      const latestScore = scores[0] ?? 0
      if (latestScore < 100 && latestScore > 0) {
        const level = await prisma.level.findUnique({
          where: { id: levelId },
          select: { title: true, unit: { select: { title: true } } },
        })
        if (level) {
          recs.push({
            type: 'REVIEW',
            targetId: levelId,
            title: level.title,
            reason: `「${level.title}」挑战了 ${count} 次，建议先复习该主题资源再挑战`,
            urgency: 'high',
          })
        }
      }
    }
  }

  // 3. 学习节奏慢 → 鼓励性推荐
  if (profile.learningStyle.pace === 'slow' && profile.totalAttempts > 0) {
    recs.push({
      type: 'LEVEL',
      targetId: '',
      title: '每日一题',
      reason: '学习节奏还有提升空间，先从每天完成1关开始',
      urgency: 'medium',
    })
  }

  // 4. 强势领域 → 推荐挑战更高难度
  if (profile.strengths.length >= 2) {
    const strongTopic = profile.strengths[0].topic
    const unitCategory = reverseTopicMap(strongTopic)
    if (unitCategory) {
      const units = await prisma.learningUnit.findMany({
        where: { category: unitCategory, isActive: true },
        select: { id: true },
      })
      const higherLevels = await prisma.level.findMany({
        where: {
          unitId: { in: units.map((u) => u.id) },
          isActive: true,
          orderNo: { gte: 4 },
        },
        orderBy: { orderNo: 'asc' },
        select: { id: true, title: true, xpReward: true },
        take: 2,
      })
      for (const hl of higherLevels) {
        recs.push({
          type: 'LEVEL',
          targetId: hl.id,
          title: hl.title,
          reason: `你在「${strongTopic}」表现不错，挑战更高难度关卡`,
          urgency: 'medium',
          xpReward: hl.xpReward,
        })
      }
    }
  }

  // 5. 推荐法治游戏（如果近期没玩过）
  const recentAttempts = attempts.slice(0, 20)
  const hasCourtRecently = recentAttempts.some((a) => a.levelId.startsWith('court-'))
  if (!hasCourtRecently) {
    recs.push({
      type: 'GAME',
      targetId: 'court',
      title: '模拟法庭',
      reason: '试试模拟法庭游戏，在实战中运用法律知识',
      urgency: 'low',
    })
  }

  // 6. 推荐阅读漫画（如果弱项匹配）
  const weakTopics = profile.weakAreas
    .filter((w) => w.failCount >= 2)
    .slice(0, 2)
  const comicMap: Record<string, { id: string; title: string }> = {
    '校园安全': { id: 'campus', title: '「校园欺凌」普法漫画' },
    '网络安全': { id: 'network', title: '「网络诈骗」普法漫画' },
    '消费者权益': { id: 'consumer', title: '「消费者权益」普法漫画' },
  }
  for (const wt of weakTopics) {
    const comic = comicMap[wt.topic]
    if (comic) {
      // 检查是否已读过
      const read = await prisma.comicRead.findUnique({
        where: { studentId_storyId: { studentId, storyId: comic.id } },
      })
      if (!read) {
        recs.push({
          type: 'COMIC',
          targetId: comic.id,
          title: comic.title,
          reason: `你的「${wt.topic}」薄弱，建议阅读相关普法漫画`,
          urgency: 'medium',
        })
      }
    }
  }

  // 排序：urgency high 优先
  const urgencyOrder = { high: 0, medium: 1, low: 2 }
  recs.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

  // 去重：相同 targetId 只保留一条
  const seen = new Set<string>()
  return recs.filter((r) => {
    const key = `${r.type}-${r.targetId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 5)
}

const REVERSE_TOPIC_MAP: Record<string, string> = {
  '校园安全': '校园法律',
  '网络安全': '网络法律',
  '家庭权益': '家庭法律',
  '消费者权益': '消费法律',
  '交通安全': '交通安全',
  '禁毒教育': '禁毒法律',
}

function reverseTopicMap(topic: string): string | null {
  return REVERSE_TOPIC_MAP[topic] ?? null
}
