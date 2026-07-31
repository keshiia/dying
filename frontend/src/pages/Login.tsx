import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import {
  Scale,
  ChevronRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { apiFetch, errorMessage, setToken } from "@/utils/api";
import type { AuthUser } from "@/types";
import { useAuthStore } from "@/stores/auth";

type RoleTab = "student" | "teacher";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth, clear } = useAuthStore();

  const [tab, setTab] = useState<RoleTab>("student");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sample = {
    student: { email: "student@example.com", password: "Student123!" },
    teacher: { email: "teacher@example.com", password: "Teacher123!" },
  }[tab];

  async function onSubmit() {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const data = await apiFetch<{
          success: true;
          token: string;
          user: AuthUser;
        }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        setAuth(data.token, data.user);
        navigate(
          data.user.role === "TEACHER" ? "/teacher/dashboard" : "/app/comics",
          { replace: true },
        );
        return;
      }

      const data = await apiFetch<{
        success: true;
        token: string;
        user: AuthUser;
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: tab,
          nickname: nickname.trim(),
        }),
      });

      setAuth(data.token, data.user);
      navigate(
        data.user.role === "TEACHER" ? "/teacher/dashboard" : "/app/comics",
        { replace: true },
      );
    } catch (e: unknown) {
      setError(errorMessage(e));
      clear();
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef5ff]">
      {/* ── 背景装饰 ── */}
      <div className="pointer-events-none absolute -left-32 top-[-160px] h-[440px] w-[440px] rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-[-140px] h-[480px] w-[480px] rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[-200px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-5xl items-stretch gap-0 overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_40px_90px_-50px_rgba(30,90,160,0.5)] backdrop-blur-2xl lg:grid-cols-[1.15fr_1fr]">
          {/* ══════════ 左侧品牌区（桌面端显示 · 苹果极简风格） ══════════ */}
          <aside className="relative hidden overflow-hidden bg-[#0f1f3d] p-12 text-white lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">
            {/* 极其克制的背景：一处柔和光晕，近乎隐形 */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#1e88e5]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#26a69a]/10 blur-3xl" />

            {/* 顶部品牌：仅一个干净的标志 + 名字 */}
            <div className="relative flex items-center gap-2.5">
              <Scale className="h-5 w-5 text-white/85" strokeWidth={1.8} />
              <span className="text-[15px] font-medium tracking-wide text-white/85">
                青知法苑
              </span>
            </div>

            {/* 中部文案：大标题 + 一行说明，大量留白 */}
            <div className="relative my-16">
              <h2 className="max-w-[16rem] text-[32px] font-light leading-[1.3] tracking-tight">
                让法治成为
                <br />
                青春的底色
              </h2>
              <p className="mt-5 max-w-[15rem] text-[15px] font-normal leading-relaxed text-white/45">
                在规则与自由之间，找到自己的答案。
              </p>
            </div>

            {/* 底部：一行极淡的小字 */}
            <div className="relative text-[13px] text-white/30">
              青少年普法智能体
            </div>
          </aside>

          {/* ══════════ 右侧表单区 ══════════ */}
          <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
            <div className="w-full max-w-[400px]">
              {/* 移动端品牌（lg 隐藏） */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#61cbef] to-[#39b4e0] text-white shadow-lg shadow-sky-200/60">
                  <Scale className="h-6 w-6" strokeWidth={2.1} />
                </div>
                <div>
                  <div className="text-lg font-extrabold leading-tight tracking-tight text-zinc-900">
                    青知法苑
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    让法治成为青春的底色
                  </div>
                </div>
              </div>

              {/* 角色切换 */}
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-zinc-200/80 bg-zinc-100/80 p-1">
                {(
                  [
                    { value: "student", label: "我是学生", icon: GraduationCap },
                    { value: "teacher", label: "我是老师", icon: ShieldCheck },
                  ] as const
                ).map((r) => {
                  const active = tab === r.value;
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setTab(r.value)}
                      className={clsx(
                        "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                        active
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {r.label}
                    </button>
                  );
                })}
              </div>

              {/* 标题 */}
              <div className="mb-6 flex items-baseline justify-between">
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                  {mode === "login" ? "欢迎回来 👋" : "创建新账号"}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError(null);
                  }}
                  className="shrink-0 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700"
                >
                  {mode === "login" ? "去注册" : "返回登录"}
                </button>
              </div>

              {/* 表单 */}
              <div className="grid gap-4">
                {/* 邮箱 */}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" />
                  <Input
                    className="h-12 rounded-2xl border-zinc-200 bg-white pl-11 pr-4 text-[15px] placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="邮箱 name@example.com"
                    type="email"
                    autoComplete="email"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void onSubmit();
                    }}
                  />
                </div>

                {/* 密码 */}
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" />
                  <Input
                    className="h-12 rounded-2xl border-zinc-200 bg-white pl-11 pr-12 text-[15px] placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="密码（至少8位）"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void onSubmit();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>

                {/* 昵称（仅注册） */}
                {mode === "register" && (
                  <div className="relative animate-slide-up">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" />
                    <Input
                      className="h-12 rounded-2xl border-zinc-200 bg-white pl-11 pr-4 text-[15px] placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="昵称，例如：小法同学"
                    />
                  </div>
                )}
              </div>

              {/* 登录模式附加行：一键填充演示账号（仅登录模式显示） */}
              {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setEmail(sample.email);
                  setPassword(sample.password);
                }}
                className="mt-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-4 py-3 text-left transition-colors hover:bg-sky-50 hover:border-sky-300"
              >
                <span className="truncate text-xs text-zinc-500">
                  试用演示账号
                  <span className="ml-2 font-semibold text-zinc-700">{sample.email}</span>
                </span>
                <span className="ml-2 flex shrink-0 items-center gap-0.5 text-xs font-semibold text-sky-600">
                  一键填充 <ChevronRight className="h-3 w-3" />
                </span>
              </button>
              )}

              {error && (
                <div className="mt-4 animate-slide-up rounded-2xl border border-red-200/90 bg-red-50/85 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* 主按钮 */}
              <Button
                size="lg"
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#61cbef] to-[#2fa3d8] text-base font-extrabold !shadow-[0_16px_32px_-16px_rgba(47,163,216,0.9)] transition-all hover:from-[#55c0e6] hover:to-[#2b95c8] hover:!shadow-[0_20px_40px_-18px_rgba(47,163,216,1)]"
                onClick={onSubmit}
                disabled={loading}
              >
                {loading
                  ? "处理中..."
                  : mode === "login"
                    ? "开始学习"
                    : "注册并进入"}
              </Button>

              {/* 底部声明 */}
              <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
                本平台仅用于普法学习，不构成法律意见。
                <br />
                遇紧急情况请拨打{" "}
                <span className="font-bold text-zinc-700">110</span> /{" "}
                <span className="font-bold text-zinc-700">12348</span>
              </p>
            </div>
          </main>
        </div>
      </div>

    </div>
  );
}
