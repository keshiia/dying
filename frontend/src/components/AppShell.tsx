import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bot, ChevronLeft, ChevronRight, Fingerprint, Gavel, GraduationCap, LogOut, Menu, Scale, ShieldAlert, UserRound, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import RouteFallback from '@/components/ui/RouteFallback'
import { apiFetch } from '@/utils/api'
import { useRiskStream } from '@/hooks/useRiskStream'
import { useAuthStore } from '@/stores/auth'
import Sheet from '@/components/ui/Sheet'
import AgentAvatar, { AGENT_NAME } from '@/components/student/AgentAvatar'

type Props = {
  mode: 'student' | 'teacher'
}

type NavItem = {
  to: string
  label: string
  emoji?: string
  icon?: LucideIcon
  game?: boolean
  /** 需要提醒的未读数量，大于 0 时在导航项右侧显示角标 */
  badge?: number
}

function getLevelTitle(level: number) {
  if (level <= 2) return '法律小白'
  if (level <= 5) return '初级法律达人'
  if (level <= 10) return '法律知识进阶'
  if (level <= 20) return '法律小专家'
  return '法律小达人'
}

function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={clsx(
        'relative shrink-0 overflow-hidden bg-gradient-to-br from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white shadow-md shadow-blue-100',
        compact ? 'h-8 w-8 rounded-xl' : 'h-10 w-10 rounded-2xl',
        className,
      )}
    >
      <div className="grid h-full w-full place-items-center rounded-[inherit]">
        <Scale className={clsx(compact ? 'h-4 w-4' : 'h-5 w-5')} strokeWidth={2.2} />
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/30" />
    </div>
  )
}

function StudentAvatar({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'relative h-11 w-11 overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-zinc-100 shadow-sm',
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.95),rgba(255,255,255,0))]" />
      <div className="relative grid h-full w-full place-items-center">
        <div className="grid h-7 w-7 place-items-center rounded-full border border-slate-200/90 bg-white/95">
          <GraduationCap className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
        </div>
      </div>
      <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-slate-500 ring-2 ring-white" />
    </div>
  )
}

function TeacherAvatar({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'relative h-11 w-11 overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-zinc-100 shadow-sm',
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.95),rgba(255,255,255,0))]" />
      <div className="relative grid h-full w-full place-items-center">
        <div className="grid h-7 w-7 place-items-center rounded-full border border-slate-200/90 bg-white/95">
          <UserRound className="h-4 w-4 text-slate-600" strokeWidth={2.2} />
        </div>
      </div>
      <span className="absolute bottom-1.5 right-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-white ring-1 ring-zinc-200">
        <Scale className="h-2.5 w-2.5 text-zinc-500" strokeWidth={2.2} />
      </span>
    </div>
  )
}

function RoleAvatar({
  mode,
  className,
}: {
  mode: Props['mode']
  className?: string
}) {
  if (mode === 'student') return <StudentAvatar className={className} />
  return <TeacherAvatar className={className} />
}

export default function AppShell({ mode }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clear } = useAuthStore()
  const [navOpen, setNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [riskOpenCount, setRiskOpenCount] = useState(0)

  useEffect(() => {
    if (!user) return
    if (mode === 'student' && user.role !== 'STUDENT') navigate('/teacher', { replace: true })
    if (mode === 'teacher' && user.role !== 'TEACHER') navigate('/app', { replace: true })
  }, [mode, user, navigate])

  const loadRiskCount = useCallback(async () => {
    try {
      const data = await apiFetch<{ success: true; openCount: number }>('/api/teacher/risk-events/count')
      setRiskOpenCount(data.openCount)
    } catch {
      // 角标拉取失败不影响导航本身
    }
  }, [])

  useEffect(() => {
    if (mode !== 'teacher' || user?.role !== 'TEACHER') return
    void loadRiskCount()
  }, [mode, user, loadRiskCount])

  // 教师在任意页面都能第一时间看到角标变化，不必先点进预警页
  useRiskStream(() => {
    void loadRiskCount()
  }, mode === 'teacher' && user?.role === 'TEACHER')

  const levelPct = user ? user.xp % 100 : 0

  const studentNav: NavItem[] = [
    { to: '/app/comics', label: '漫画学法', emoji: '📖' },
    { to: '/app/games/detective', label: '案件侦查', icon: Fingerprint, game: true },
    { to: '/app/games/court', label: '模拟法庭', icon: Gavel, game: true },
    { to: '/app/learn', label: '学习闯关', emoji: '🧒' },
    { to: '/app/resources', label: '案例中心', emoji: '📚' },
    { to: '/app/tasks', label: '任务中心', emoji: '📝' },
    { to: '/app/growth', label: '成长中心', emoji: '🌱' },
  ]

  const teacherNav: NavItem[] = [
    { to: '/teacher/dashboard', label: '进度看板', emoji: '📊' },
    { to: '/teacher/classes', label: '班级管理', emoji: '🏫' },
    { to: '/teacher/risk-alerts', label: '风险预警', icon: ShieldAlert, badge: riskOpenCount },
    { to: '/teacher/assignments', label: '任务布置', emoji: '🗂️' },
    { to: '/teacher/resources', label: '资源发布', emoji: '📤' },
  ]

  const nav = mode === 'student' ? studentNav : teacherNav

  const title = useMemo(() => {
    const match = nav.find((n) => location.pathname.startsWith(n.to))
    if (match) return `${match.icon ? '🎮 ' : `${match.emoji} `}${match.label}`
    return mode === 'student' ? '学习中心' : '教师后台'
  }, [location.pathname, mode, nav])

  function logout() {
    clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex">
      {/* Floating sidebar toggle - always visible on desktop */}
      <button
        type="button"
        onClick={() => setSidebarCollapsed((v) => !v)}
        className={clsx(
          'hidden lg:grid place-items-center z-30',
          'h-8 w-8 rounded-full border border-zinc-200/80 bg-white shadow-md',
          'text-zinc-400 hover:text-zinc-600 hover:shadow-lg hover:border-zinc-300',
          'fixed top-[72px] transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'left-3' : 'left-[276px]',
        )}
        title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {!sidebarCollapsed && (
        <aside className="hidden lg:flex flex-col w-72 shrink-0 h-screen sticky top-0 overflow-hidden bg-gradient-to-b from-white to-zinc-50/80 border-r border-zinc-200/70 shadow-sm">
          <Link
            to={mode === 'student' ? '/app/comics' : '/teacher/dashboard'}
            className="flex items-center gap-2.5 px-5 py-5 group border-b border-zinc-100/80"
          >
            <BrandMark className="group-hover:shadow-blue-200 transition-shadow" />
            <div className="min-w-0">
              {/* 品牌名统一为「青知法苑」，与登录页一致；「青少年普法智能体」
                  是品类描述，作为副标题。原先侧边栏把品类当主名，
                  导致登录后产品名看起来变了。 */}
              <div className="text-base font-extrabold text-zinc-900 leading-tight">青知法苑</div>
              <div className="text-xs text-zinc-400 mt-0.5">青少年普法智能体</div>
            </div>
          </Link>

          <div className="px-4 pt-5">
            <div className="rounded-3xl border border-[#d8eaed] bg-[#ecf6f7] p-3.5 shadow-sm shadow-zinc-100/70">
              <div className="flex items-center gap-3">
                <RoleAvatar mode={mode} />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-zinc-900 truncate">{user?.nickname ?? '未登录'}</div>
                  <div className="text-xs text-zinc-400 truncate">{user?.email ?? ''}</div>
                </div>
              </div>
            </div>
          </div>

          <nav className="px-3 pt-5 pb-2 grid gap-1 content-start flex-1 overflow-y-auto">
            <div className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-400">导航</div>
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[15px] font-bold transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-[#84d8ee] via-[#72cde8] to-[#63c0df] text-white/95 shadow-sm shadow-sky-100'
                      : 'text-zinc-700 hover:bg-zinc-100/80',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={clsx(
                        'grid h-8 w-8 place-items-center rounded-xl transition-colors',
                        n.icon ? '' : 'text-base',
                        isActive
                          ? 'bg-white/25 text-white/95'
                          : n.game
                            ? 'bg-sky-100 text-sky-600 group-hover:bg-sky-200'
                            : 'bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200',
                      )}
                    >
                      {n.icon ? <n.icon className="h-[18px] w-[18px]" strokeWidth={2.1} /> : n.emoji}
                    </span>
                    <span className="truncate">{n.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="px-3 pb-5 pt-3 border-t border-zinc-100 mt-auto grid gap-1">
            {mode === 'student' && (
              <button
                type="button"
                onClick={() => navigate('/assistant')}
                className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100/80 transition-all"
              >
                <AgentAvatar size="sm" />
                {AGENT_NAME}
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-100/80 transition-all"
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
                <LogOut className="h-4 w-4 shrink-0" />
              </span>
              退出登录
            </button>
          </div>
        </aside>
      )}


      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-zinc-100 sticky top-0 z-30">
          <Link to={mode === 'student' ? '/app/comics' : '/teacher/dashboard'} className="flex items-center gap-2">
            <BrandMark compact />
            <span className="text-sm font-extrabold text-zinc-900">{title}</span>
          </Link>
          <div className="flex items-center gap-2">
            {mode === 'student' && (
              <Button variant="accent" size="sm" onClick={() => navigate('/assistant')}>
                <Bot className="h-4 w-4" />
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setNavOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className={clsx('flex-1 p-4 lg:p-6', mode === 'student' ? 'pb-28 lg:pb-6' : 'pb-6')}>
          {/* 内层 Suspense：切换懒加载页面时只有内容区转圈，侧边栏/顶栏不卸载 */}
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {mode === 'student' && !navOpen && (
        <button
          type="button"
          onClick={() => navigate('/assistant')}
          className="lg:hidden fixed right-4 rounded-full bg-gradient-to-br from-[var(--p-accent)] to-[var(--p-accent-dark)] text-white shadow-xl shadow-blue-100 px-5 py-3.5 text-sm font-extrabold animate-pulse-ring z-40"
          style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <span className="inline-flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {AGENT_NAME}
          </span>
        </button>
      )}

      <Sheet open={navOpen} title="菜单" onClose={() => setNavOpen(false)}>
        <div className="rounded-3xl border border-[#d8eaed] bg-[#ecf6f7] p-3.5">
          <div className="flex items-center gap-3">
            <RoleAvatar mode={mode} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">{user?.nickname ?? '未登录'}</div>
              <div className="text-xs text-zinc-400 truncate">{user?.email ?? ''}</div>
            </div>
          </div>
        </div>

        {mode === 'student' && user && (
          <div className="mt-4 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700">{getLevelTitle(user.level)}</div>
              <span className="text-xs font-extrabold text-zinc-800">{user.xp} XP</span>
            </div>
            <div className="mt-2">
              <ProgressBar value={levelPct} color="blue" animated />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
              <span>Lv {user.level}</span>
              <span>升级还需 {100 - levelPct} XP</span>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[15px] font-bold transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-[#84d8ee] via-[#72cde8] to-[#63c0df] text-white/95 shadow-sm shadow-sky-100'
                    : 'text-zinc-700 hover:bg-zinc-50',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'grid h-8 w-8 place-items-center rounded-xl transition-colors',
                      n.icon ? '' : 'text-base',
                      isActive
                        ? 'bg-white/25 text-white/95'
                        : n.game
                          ? 'bg-sky-100 text-sky-600 group-hover:bg-sky-200'
                          : 'bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200',
                    )}
                  >
                    {n.icon ? <n.icon className="h-[18px] w-[18px]" strokeWidth={2.1} /> : n.emoji}
                  </span>
                  <span className="truncate">{n.label}</span>
                  {n.badge ? (
                    <span className="ml-auto grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                      {n.badge > 99 ? '99+' : n.badge}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          {mode === 'student' && (
            <Button
              variant="accent"
              onClick={() => {
                setNavOpen(false)
                navigate('/assistant')
              }}
            >
              <Bot className="h-4 w-4 mr-1.5" />
              {AGENT_NAME}
            </Button>
          )}
          <Button variant="ghost" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1.5" />
            退出登录
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
