/**
 * 学生画像雷达图组件
 * 使用纯 SVG 实现 6 维雷达图，无第三方依赖
 */
import { useMemo } from 'react'
import { clsx } from 'clsx'
import Card from '@/components/ui/Card'
import type { StudentProfile } from '@/types'

type Props = {
  profile: StudentProfile | null
  loading?: boolean
  /** 加载失败。与「还没有画像数据」是两回事，失败时不能静默消失 */
  failed?: boolean
  className?: string
}

const TOPIC_COLORS = [
  { fill: 'rgba(59,130,246,0.15)', stroke: '#3B82F6' },  // 校园安全 - blue
  { fill: 'rgba(139,92,246,0.15)', stroke: '#8B5CF6' },  // 网络安全 - purple
  { fill: 'rgba(245,158,11,0.15)', stroke: '#F59E0B' },  // 家庭权益 - amber
  { fill: 'rgba(249,115,22,0.15)', stroke: '#F97316' },  // 消费者权益 - orange
  { fill: 'rgba(16,185,129,0.15)', stroke: '#10B981' },  // 交通安全 - green
  { fill: 'rgba(239,68,68,0.15)', stroke: '#EF4444' },   // 禁毒教育 - red
]

export default function ProfileRadar({ profile, loading, failed, className }: Props) {
  const { points, labels, center } = useMemo(() => {
    if (!profile || profile.topicMasteries.length === 0) {
      return { points: [], labels: [], center: { x: 120, y: 120 } }
    }

    const cx = 120
    const cy = 120
    const r = 95
    const count = profile.topicMasteries.length
    const angleStep = (2 * Math.PI) / count
    const offset = -Math.PI / 2 // 从顶部开始

    const pts = profile.topicMasteries.map((m, i) => {
      const angle = offset + i * angleStep
      const value = m.mastery / 100
      const dist = r * value
      return {
        x: cx + dist * Math.cos(angle),
        y: cy + dist * Math.sin(angle),
        mastery: m.mastery,
        topic: m.topic,
      }
    })

    const lbls = profile.topicMasteries.map((m, i) => {
      const angle = offset + i * angleStep
      const labelR = r + 18
      return {
        x: cx + labelR * Math.cos(angle),
        y: cy + labelR * Math.sin(angle),
        topic: m.topic,
        mastery: m.mastery,
      }
    })

    return { points: pts, labels: lbls, center: { x: cx, y: cy } }
  }, [profile])

  if (loading) {
    return (
      <Card className={clsx('p-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-32 bg-zinc-100 rounded-full" />
          <div className="h-52 bg-zinc-100 rounded-2xl" />
        </div>
      </Card>
    )
  }

  // 与「还没有画像数据」区分开：加载失败时不能静默消失，
  // 否则学生看到的是一个缺了几块的页面，而且没有任何解释
  if (failed && !profile) {
    return (
      <Card className={clsx('p-5 border-red-100 bg-red-50', className)}>
        <div role="alert" className="text-sm text-red-700">
          学习画像加载失败，刷新页面可重试。
        </div>
      </Card>
    )
  }

  if (!profile || profile.topicMasteries.length === 0) {
    return null
  }

  const hasData = profile.topicMasteries.some((t) => t.questionsTotal > 0)
  if (!hasData) return null

  return (
    <Card className={clsx('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-extrabold text-zinc-900">学习画像</div>
          <div className="text-xs text-zinc-500 mt-0.5">各主题掌握度</div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-zinc-600 bg-zinc-100 rounded-full px-3 py-1">
          综合 {profile.overallAccuracy}%
        </div>
      </div>

      <div className="flex justify-center">
        <svg width="280" height="260" viewBox="0 0 280 260" className="overflow-visible">
          {/* 网格：3 层同心多边形 */}
          {[0.33, 0.66, 1.0].map((scale, si) => {
            const count = profile.topicMasteries.length
            const angleStep = (2 * Math.PI) / count
            const offset = -Math.PI / 2
            const pts = Array.from({ length: count }, (_, i) => {
              const angle = offset + i * angleStep
              const dist = 95 * scale
              return `${120 + dist * Math.cos(angle)},${120 + dist * Math.sin(angle)}`
            }).join(' ')
            return (
              <polygon
                key={si}
                points={pts}
                fill="none"
                stroke="#E4E4E7"
                strokeWidth={1}
                className="transition-all"
              />
            )
          })}

          {/* 轴线 */}
          {profile.topicMasteries.map((_, i) => {
            const angle = -Math.PI / 2 + i * ((2 * Math.PI) / profile.topicMasteries.length)
            return (
              <line
                key={i}
                x1={120}
                y1={120}
                x2={120 + 95 * Math.cos(angle)}
                y2={120 + 95 * Math.sin(angle)}
                stroke="#E4E4E7"
                strokeWidth={1}
              />
            )
          })}

          {/* 数据多边形 */}
          {points.length > 0 && (
            <polygon
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="rgba(59,130,246,0.12)"
              stroke="#3B82F6"
              strokeWidth={2}
              className="transition-all"
            />
          )}

          {/* 数据点 */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={TOPIC_COLORS[i % TOPIC_COLORS.length].stroke}
              className="transition-all"
            />
          ))}

          {/* 标签 */}
          {labels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] fill-zinc-700 font-semibold"
            >
              {l.topic.slice(0, 4)}
            </text>
          ))}

          {/* 掌握度数值 */}
          {points.map((p, i) => (
            <text
              key={`val-${i}`}
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-zinc-500 font-semibold"
            >
              {p.mastery > 0 && `${p.mastery}%`}
            </text>
          ))}
        </svg>
      </div>

      {/* 图例 */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {profile.topicMasteries.map((t, i) => (
          <div key={t.topic} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length].stroke }}
            />
            <span className="text-[11px] font-semibold text-zinc-600">{t.topic}</span>
            <span className="text-[11px] font-bold text-zinc-800">{t.mastery}%</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
