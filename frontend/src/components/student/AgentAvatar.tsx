import { Bot } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * 青知智能体的头像。
 *
 * 抽成组件是为了让"同一个智能体"这件事在视觉上成立 —— 之前在侧边栏、悬浮球、
 * 抽屉菜单、AI 助手页各写各的（还都叫「AI咨询助手」），而成长中心那套画像/
 * 推荐又是完全没有身份的报表。学生面对的是两个互不相干的 AI。
 *
 * 现在结算页的复盘卡、侧边栏入口、助手页共用这一张脸，心智才统一成
 * 「有一个老师一直跟着我」。
 */

const SIZES = {
  sm: { box: 'h-7 w-7 rounded-xl', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-9 w-9 rounded-2xl', icon: 'h-4 w-4' },
  lg: { box: 'h-11 w-11 rounded-2xl', icon: 'h-5 w-5' },
} as const

export default function AgentAvatar({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZES
  className?: string
}) {
  const s = SIZES[size]
  return (
    <span
      className={clsx(
        // 白底 + 细描边。做成深色实心块会在浅色页面上压出一个很重的黑点，
        // 而且与应用其余部分的浅色组件不是一套语言。
        'relative grid shrink-0 place-items-center overflow-hidden',
        'border border-zinc-200 bg-white text-slate-600 shadow-sm',
        s.box,
        className,
      )}
    >
      <Bot className={s.icon} strokeWidth={2.2} />
    </span>
  )
}

/** 智能体的名字。与后端 Intervention.agent 保持一致 */
export const AGENT_NAME = '青知智能体'
