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

