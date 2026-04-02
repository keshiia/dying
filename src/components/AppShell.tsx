import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Bot, LogOut, Menu, Shield, Trophy } from "lucide-react";
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
  if (level <= 2) return "法律小白 🌱";
  if (level <= 5) return "初级法律达人 ⭐";
  if (level <= 10) return "法律知识通 🌟";
  if (level <= 20) return "法律小专家 🏆";
  return "法律小达人 👑";
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
    { to: "/app/learn", label: "学习闯关", emoji: "⚔️" },
    { to: "/app/growth", label: "成长中心", emoji: "🌟" },
    { to: "/app/resources", label: "资源中心", emoji: "📚" },
    { to: "/app/tasks", label: "老师任务", emoji: "📋" },
  ];

  const teacherNav = [
    { to: "/teacher/dashboard", label: "进度看板", emoji: "📊" },
    { to: "/teacher/classes", label: "班级管理", emoji: "🏫" },
    { to: "/teacher/assignments", label: "任务布置", emoji: "📝" },
    { to: "/teacher/resources", label: "资源发布", emoji: "📤" },
  ];

  const nav = mode === "student" ? studentNav : teacherNav;

  const title = useMemo(() => {
    const match = nav.find((n) => location.pathname.startsWith(n.to));
    return match
      ? `${match.emoji} ${match.label}`
      : mode === "student"
        ? "学习"
        : "教师后台";
  }, [location.pathname, mode, nav]);

  function logout() {
    clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* ── 左侧固定侧边栏（仅桌面端） ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 min-h-screen bg-white border-r border-zinc-100 shadow-sm">
        {/* Logo */}
        <Link
          to={mode === "student" ? "/app/learn" : "/teacher/dashboard"}
          className="flex items-center gap-2.5 px-5 py-5 group border-b border-zinc-100"
        >
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#58cc02] to-[#46a302] text-white flex items-center justify-center shadow-md shadow-green-200 group-hover:shadow-green-300 transition-shadow shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-zinc-900 leading-tight">
              青少年普法平台
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              像打游戏一样学法律 🎮
            </div>
          </div>
        </Link>

        {/* 用户信息 + XP */}
        <div className="px-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center text-xl select-none shrink-0">
              {mode === "student" ? "🎒" : "👨‍🏫"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">
                {user?.nickname ?? "未登录"}
              </div>
              <div className="text-xs text-zinc-400 truncate">
                {user?.email ?? ""}
              </div>
            </div>
          </div>

          {mode === "student" && user && (
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-green-800">
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
                <ProgressBar value={levelPct} size="md" animated />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
                <span>Lv {user.level}</span>
                <span>升级还需 {100 - levelPct} XP</span>
              </div>
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="px-3 pt-4 grid gap-0.5 content-start">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[#58cc02] to-[#46a302] text-white shadow-md shadow-green-200"
                    : "text-zinc-700 hover:bg-zinc-50",
                )
              }
            >
              <span className="text-base">{n.emoji}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* 底部操作 */}
        <div className="px-3 pb-5 pt-2 border-t border-zinc-100 mt-2 grid gap-0.5">
          {mode === "student" && (
            <button
              type="button"
              onClick={() => navigate("/assistant")}
              className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold text-[var(--p-accent)] hover:bg-blue-50 transition-all"
            >
              <Bot className="h-4 w-4 shrink-0" />
              💬 AI普法助手
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-zinc-50 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            退出登录
          </button>
        </div>
      </aside>

      {/* ── 右侧主内容区 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 移动端顶部栏 */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-100 sticky top-0 z-30">
          <Link
            to={mode === "student" ? "/app/learn" : "/teacher/dashboard"}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#58cc02] to-[#46a302] text-white flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
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

        {/* 页面内容 */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* 移动端 AI 悬浮按钮 */}
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

      {/* 移动端侧边菜单 Sheet */}
      <Sheet open={navOpen} title="菜单" onClose={() => setNavOpen(false)}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center text-xl">
            {mode === "student" ? "🎒" : "👨‍🏫"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-zinc-900 truncate">
              {user?.nickname ?? "未登录"}
            </div>
            <div className="text-xs text-zinc-400 truncate">
              {user?.email ?? ""}
            </div>
          </div>
        </div>

        {mode === "student" && user && (
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-green-800">
                {getLevelTitle(user.level)}
              </div>
              <span className="text-xs font-extrabold text-zinc-800">
                {user.xp} XP
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={levelPct} animated />
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
                  "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[#58cc02] to-[#46a302] text-white shadow-sm"
                    : "text-zinc-700 hover:bg-zinc-50",
                )
              }
            >
              <span className="text-base">{n.emoji}</span>
              {n.label}
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
