import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import Tag from '@/components/ui/Tag'
import { apiFetch } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

export default function Growth() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<{ attemptCount: number; avgScore: number; completedLevels: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      const data = await apiFetch<{ success: true; stats: { attemptCount: number; avgScore: number; completedLevels: number } }>(
        '/api/student/summary',
      )
      setStats(data.stats)
    })()
  }, [])

  const pct = user ? (user.xp % 100) : 0

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-lg font-extrabold text-zinc-900">个人成长中心</div>
        <div className="mt-1 text-sm text-zinc-600">你的每一次学习和闯关都会转化为XP与等级。</div>

        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-7 rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-900">等级</div>
                <div className="mt-1 text-3xl font-extrabold text-zinc-900">Lv {user?.level ?? 1}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-900">累计XP</div>
                <div className="mt-1 text-3xl font-extrabold text-zinc-900">{user?.xp ?? 0}</div>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={pct} />
              <div className="mt-2 text-xs text-zinc-500">再获得 {100 - pct} XP 升级</div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 rounded-2xl bg-white border border-zinc-100 p-4">
            <div className="text-sm font-semibold text-zinc-900">徽章墙（MVP）</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Tag>学习新手</Tag>
              <Tag>勇闯第一关</Tag>
              <Tag>持续进步</Tag>
            </div>
            <div className="mt-3 text-xs text-zinc-500">后续可扩展：连续学习天数、分享徽章、主题徽章。</div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-extrabold text-zinc-900">学习数据</div>
        <div className="mt-4 grid grid-cols-12 gap-3">
          <Stat title="闯关次数" value={stats?.attemptCount ?? 0} />
          <Stat title="平均正确率" value={(stats?.avgScore ?? 0) + '%'} />
          <Stat title="已完成关卡" value={stats?.completedLevels ?? 0} />
        </div>
      </Card>
    </div>
  )
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="col-span-12 sm:col-span-4 rounded-2xl border border-zinc-100 bg-white p-4">
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-zinc-900">{value}</div>
    </div>
  )
}
