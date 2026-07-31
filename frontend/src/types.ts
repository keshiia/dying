export type UserRole = 'STUDENT' | 'TEACHER'

export type AuthUser = {
  id: string
  role: UserRole
  nickname: string
  email: string
  grade: string | null
  xp: number
  level: number
}

export type LearningLevel = {
  id: string
  title: string
  orderNo: number
  difficulty?: '基础' | '进阶' | '挑战' | '实战'
  xpReward: number
  progress: null | {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    bestScore: number
    updatedAt: string
  }
}

export type LearningUnit = {
  id: string
  title: string
  category: string
  gradeRange: string
  orderNo: number
  levels: LearningLevel[]
}

export type Question = {
  id: string
  type: 'SINGLE' | 'TRUE_FALSE' | 'SCENARIO'
  prompt: string
  optionsJson: string | null
  orderNo: number
}

export type ResourceType = 'CASE' | 'LAW_SUMMARY' | 'VIDEO' | 'ARTICLE'

export type ResourceListItem = {
  id: string
  title: string
  type: ResourceType
  tags: string[]
  excerpt?: string
  contentUrl: string | null
  createdAt: string
}

export type ResourceDetail = ResourceListItem & {
  contentMd: string | null
  author: string
}

export type StudentTask = {
  id: string
  classId: string
  targetType: 'LEVEL' | 'RESOURCE'
  targetId: string
  dueAt: string | null
  createdAt: string
  status: 'todo' | 'done'
  submittedAt: string | null
}

export type ReviewLevel = {
  levelId: string
  title: string
  unitTitle: string
  xpReward: number
  latestScore: number
  attemptedAt: string
}

export type TeacherClass = {
  id: string
  name: string
  joinCode: string
  createdAt: string
}

export type TeacherAssignment = {
  id: string
  classId: string
  targetType: 'LEVEL' | 'RESOURCE'
  targetId: string
  dueAt: string | null
  createdAt: string
  doneCount: number
}

export type AiCitation = {
  type: 'resource' | 'level'
  id: string
  label: string
}

// ── 个性化相关类型 ──

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

export type StudentProfile = {
  topicMasteries: TopicMastery[]
  weakAreas: WeakArea[]
  strengths: Strength[]
  learningStyle: LearningStyle
  totalAttempts: number
  totalCorrect: number
  totalQuestions: number
  overallAccuracy: number
}

export type Recommendation = {
  type: 'LEVEL' | 'REVIEW' | 'RESOURCE' | 'COMIC' | 'GAME'
  targetId: string
  title: string
  reason: string
  urgency: 'high' | 'medium' | 'low'
  xpReward?: number
}

export type StudentGoal = {
  id: string
  title: string
  description: string | null
  targetType: string
  targetCount: number
  progress: number
  completed: boolean
  weekStart: string
}

export type ErrorAnalysis = {
  totalErrors: number
  totalQuestions: number
  overallAccuracy: number
  byTopic: Array<{ topic: string; total: number; errors: number; accuracy: number; avgScore: number }>
  byType: Array<{ type: string; total: number; errors: number; accuracy: number }>
  patterns: string[]
  suggestions: string[]
}
