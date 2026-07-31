/**
 * 智能错题复盘面板
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { AlertTriangle, Lightbulb, TrendingDown, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import Tag from '@/components/ui/Tag'
import { apiFetch } from '@/utils/api'
import type { ErrorAnalysis } from '@/types'

type Props = {
  className?: string
}

export default function ErrorAnalysisPanel({ className }: Props) {
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<ErrorAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ success: true; analysis: ErrorAnalysis }>('/api/student/error-analysis')
        setAnalysis(data.analysis)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <Card className={clsx('p-5 animate-pulse', className)}>
        <div className="h-5 w-32 bg-zinc-100 rounded-full" />
        <div className="mt-3 space-y-2">
          <div className="h-16 bg-zinc-100 rounded-2xl" />
          <div className="h-16 bg-zinc-100 rounded-2xl" />
        </div>
      </Card>
    )
  }

  if (!analysis || analysis.totalErrors === 0) {
    return (
      <Card className={clsx('p-5 border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50', className)}>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-emerald-500" />
          <div className="text-sm font-bold text-emerald-800">暂无错题记录</div>
        </div>
        <div className="mt-1 text-xs text-emerald-700">
          继续保持当前学习状态，建议尝试更高难度的关卡。
        </div>
      </Card>
    )
  }

  const worstTopic = analysis.byTopic[0]
  const worstType = analysis.byType[0]
  const showAnalysis = analysis.totalErrors > 0

  return (
    <Card className={clsx('p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-red-50 text-red-500">
            <TrendingDown className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-extrabold text-zinc-900">智能错题分析</div>
            <div className="text-[11px] text-zinc-500">
              共 {analysis.totalErrors} 道错题 · 正确率 {analysis.overallAccuracy}%
            </div>
          </div>
        </div>
        <Tag color="red">{analysis.overallAccuracy}%</Tag>
      </div>

      {/* 总体进度 */}
      {analysis.totalQuestions > 0 && (
        <div className="mb-3">
          <ProgressBar
            value={analysis.overallAccuracy}
            size="sm"
            color={analysis.overallAccuracy >= 80 ? 'green' : analysis.overallAccuracy >= 60 ? 'blue' : 'red'}
          />
        </div>
      )}

      {/* 错题分布 */}
      {analysis.byTopic.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-bold text-zinc-700 mb-2">按主题分布</div>
          <div className="grid gap-1.5">
            {analysis.byTopic.slice(0, 4).map((t) => (
              <div key={t.topic} className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-zinc-600 w-16 truncate shrink-0">{t.topic}</span>
                <div className="flex-1 h-5 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all',
                      t.accuracy >= 80 ? 'bg-emerald-400' : t.accuracy >= 60 ? 'bg-sky-400' : 'bg-red-400',
                    )}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-zinc-700 w-10 text-right shrink-0">{t.accuracy}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 错误模式 */}
      {analysis.patterns.length > 0 && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            识别到的模式
          </div>
          <ul className="space-y-1">
            {analysis.patterns.map((p, i) => (
              <li key={i} className="text-xs text-amber-900 flex gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 改进建议 */}
      {analysis.suggestions.length > 0 && (
        <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 mb-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            改进建议
          </div>
          <ul className="space-y-1">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="text-xs text-sky-900 flex gap-2">
                <span className="text-sky-500 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => navigate('/app/tasks')}>
          去错题复盘 <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigate('/app/learn')}>
          继续闯关
        </Button>
      </div>
    </Card>
  )
}
