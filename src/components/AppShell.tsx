import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bot,
  GraduationCap,
  LogOut,
  Menu,
  Scale,
  Trophy,
  UserRound,
} from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuthStore } from "@/stores/auth";
import Sheet from "@/components/ui/Sheet";

type Props = {
  mode: "student" | "teacher";
};

function getLevelTitle(level: number) {
  if (level <= 2) return "法律小白";
  if (level <= 5) return "初级法律达人";
  if (level <= 10) return "法律知识进阶";
  if (level <= 20) return "法律小专家";
  return "法律小达人";
}

function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative shrink-0 overflow-hidden bg-gradient-to-br from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white shadow-md shadow-blue-100",
        compact ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl",
        className,
      )}
    >
      <div className="grid h-full w-full place-items-center rounded-[inherit]">
        <Scale className={clsx(compact ? "h-4 w-4" : "h-5 w-5")} strokeWidth={2.2} />
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/30" />
    </div>
  );
}

function StudentAvatar({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative h-11 w-11 overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-zinc-100 shadow-sm",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.95),rgba(255,255,255,0))]" />
      <div className="relative grid h-full w-full place-items-center">
        <div className="grid h-7 w-7 place-items-center rounded-full border border-sky-100/90 bg-white/95">
          <GraduationCap className="h-4 w-4 text-sky-600" strokeWidth={2.2} />
        </div>
      </div>
      <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
    </div>
  );
}

function TeacherAvatar({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative h-11 w-11 overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-zinc-100 shadow-sm",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.95),rgba(255,255,255,0))]" />
      <div className="relative grid h-full w-full place-items-center">
        <div className="grid h-7 w-7 place-items-center rounded-full border border-sky-100/90 bg-white/95">
          <UserRound className="h-4 w-4 text-sky-600" strokeWidth={2.2} />
        </div>
      </div>
      <span className="absolute bottom-1.5 right-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-white ring-1 ring-zinc-200">
        <Scale className="h-2.5 w-2.5 text-zinc-500" strokeWidth={2.2} />
      </span>
    </div>
  );
}

function RoleAvatar({
  mode,
  className,
}: {
  mode: Props["mode"];
  className?: string;
}) {
  if (mode === "student") return <StudentAvatar className={className} />;
  return <TeacherAvatar className={className} />;
}

export default function AppShell({ mode }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clear } = useAuthStore();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (mode === "student" && user.role !== "STUDENT")
      navigate("/teacher", { replace: true });
    if (mode === "teacher" && user.role !== "TEACHER")
      navigate("/app", { replace: true });
  }, [mode, user, navigate]);

  const levelPct = user ? user.xp % 100 : 0;

  const studentNav = [
    { to: "/app/learn", label: "学习闯关", emoji: "🧠" },
    { to: "/app/growth", label: "成长中心", emoji: "🌱" },
    { to: "/app/resources", label: "资源中心", emoji: "📚" },
    { to: "/app/tasks", label: "老师任务", emoji: "📝" },
  ];

  const teacherNav = [
    { to: "/teacher/dashboard", label: "进度看板", emoji: "📊" },
    { to: "/teacher/classes", label: "班级管理", emoji: "🏫" },
    { to: "/teacher/assignments", label: "任务布置", emoji: "📌" },
    { to: "/teacher/resources", label: "资源发布", emoji: "📢" },
  ];

  const nav = mode === "student" ? studentNav : teacherNav;

  const title = useMemo(() => {
    const match = nav.find((n) => location.pathname.startsWith(n.to));
    return match ? `${match.emoji} ${match.label}` : mode === "student" ? "学习" : "教师后台";
  }, [location.pathname, mode, nav]);

  function logout() {
    clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex flex-col w-72 shrink-0 h-screen sticky top-0 overflow-hidden bg-gradient-to-b from-white to-zinc-50/80 border-r border-zinc-200/70 shadow-sm">
        <Link
          to={mode === "student" ? "/app/learn" : "/teacher/dashboard"}
          className="flex items-center gap-2.5 px-5 py-5 group border-b border-zinc-100/80"
        >
          <BrandMark className="group-hover:shadow-blue-300 transition-shadow" />
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-zinc-900 leading-tight">
              青少年普法平台
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              像打游戏一样学法律
            </div>
          </div>
        </Link>

        <div className="px-4 pt-5">
          <div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-3.5 shadow-sm shadow-zinc-100/70">
            <div className="flex items-center gap-3">
              <RoleAvatar mode={mode} />
              <div className="min-w-0">
                <div className="text-sm font-bold text-zinc-900 truncate">
                  {user?.nickname ?? "未登录"}
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {user?.email ?? ""}
                </div>
              </div>
            </div>
          </div>

          {mode === "student" && user && (
            <div className="mt-3 rounded-3xl bg-gradient-to-br from-sky-50 to-blue-50 border border-blue-100 p-3.5 shadow-sm shadow-blue-100/70">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-blue-800">
                  {getLevelTitle(user.level)}
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-extrabold text-zinc-800">
                    {user.xp} XP
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <ProgressBar value={levelPct} size="md" color="blue" animated />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
                <span>Lv {user.level}</span>
                <span>升级还需 {100 - levelPct} XP</span>
              </div>
            </div>
          )}
        </div>

        <nav className="px-3 pt-5 pb-2 grid gap-1 content-start flex-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-400">
            Menu
          </div>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                clsx(
                  "group flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white shadow-md shadow-blue-100"
                    : "text-zinc-700 hover:bg-zinc-100/80",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      "grid h-8 w-8 place-items-center rounded-xl text-base transition-colors",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200",
                    )}
                  >
                    {n.emoji}
                  </span>
                  <span className="truncate">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5 pt-3 border-t border-zinc-100 mt-auto grid gap-1">
          {mode === "student" && (
            <button
              type="button"
              onClick={() => navigate("/assistant")}
              className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold text-[var(--p-accent)] hover:bg-blue-50 transition-all"
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-blue-100/80 text-[var(--p-accent)]">
                <Bot className="h-4 w-4 shrink-0" />
              </span>
              AI普法助手
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-100 sticky top-0 z-30">
          <Link
            to={mode === "student" ? "/app/learn" : "/teacher/dashboard"}
            className="flex items-center gap-2"
          >
            <BrandMark compact />
            <span className="text-sm font-extrabold text-zinc-900">
              {title}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {mode === "student" && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => navigate("/assistant")}
              >
                <Bot className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setNavOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {mode === "student" && (
        <button
          type="button"
          onClick={() => navigate("/assistant")}
          className="lg:hidden fixed bottom-6 right-5 rounded-full bg-gradient-to-br from-[var(--p-accent)] to-[var(--p-accent-dark)] text-white shadow-xl shadow-blue-200 px-5 py-3.5 text-sm font-extrabold animate-pulse-ring z-40"
        >
          <span className="inline-flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI助手
          </span>
        </button>
      )}

      <Sheet open={navOpen} title="菜单" onClose={() => setNavOpen(false)}>
        <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/70 p-3.5">
          <div className="flex items-center gap-3">
            <RoleAvatar mode={mode} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">
                {user?.nickname ?? "未登录"}
              </div>
              <div className="text-xs text-zinc-400 truncate">
                {user?.email ?? ""}
              </div>
            </div>
          </div>
        </div>

        {mode === "student" && user && (
          <div className="mt-4 rounded-3xl bg-gradient-to-br from-sky-50 to-blue-50 border border-blue-100 p-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-blue-800">
                {getLevelTitle(user.level)}
              </div>
              <span className="text-xs font-extrabold text-zinc-800">
                {user.xp} XP
              </span>
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
                  "group flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white shadow-sm"
                    : "text-zinc-700 hover:bg-zinc-50",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      "grid h-8 w-8 place-items-center rounded-xl text-base transition-colors",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200",
                    )}
                  >
                    {n.emoji}
                  </span>
                  <span className="truncate">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          {mode === "student" && (
            <Button
              variant="accent"
              onClick={() => {
                setNavOpen(false);
                navigate("/assistant");
              }}
            >
              <Bot className="h-4 w-4 mr-1.5" />
              AI普法助手
            </Button>
          )}
          <Button variant="ghost" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1.5" />
            退出登录
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
