import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { Scale, ChevronRight } from "lucide-react";
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
  const [grade, setGrade] = useState("");
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
          data.user.role === "TEACHER" ? "/teacher/dashboard" : "/app/learn",
          { replace: true },
        );
        return;
      }

      const trimmedGrade = grade.trim();
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
          grade: tab === "student" && trimmedGrade ? trimmedGrade : undefined,
        }),
      });

      setAuth(data.token, data.user);
      navigate(
        data.user.role === "TEACHER" ? "/teacher/dashboard" : "/app/learn",
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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(165deg,#f7f9fc_0%,#eef2f7_100%)]">
      <div className="pointer-events-none absolute -left-24 top-[-120px] h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-[-120px] h-80 w-80 rounded-full bg-slate-200/45 blur-3xl" />

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px] rounded-[24px] border border-white/70 bg-white/88 px-6 py-7 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-7 sm:py-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/35 bg-[linear-gradient(145deg,#4bb5e5,#2f90c8)] text-white shadow-[0_14px_26px_-16px_rgba(10,85,125,0.8)]">
              <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0))]" />
              <Scale className="relative h-5 w-5" strokeWidth={2.1} />
            </div>
            <div>
              <div
                className="text-xl font-extrabold leading-tight text-zinc-900"
                style={{
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                青少年普法互动平台
              </div>
              <div className="mt-0.5 text-xs tracking-wide text-zinc-500">
                像打游戏一样学法律
              </div>
            </div>
          </div>

          <div className="mb-7 flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/85 p-1">
            <button
              className={clsx(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                tab === "student"
                  ? "bg-white text-zinc-900 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.55)]"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
              onClick={() => setTab("student")}
              type="button"
            >
              我是学生
            </button>
            <button
              className={clsx(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                tab === "teacher"
                  ? "bg-white text-zinc-900 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.55)]"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
              onClick={() => setTab("teacher")}
              type="button"
            >
              我是老师
            </button>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div
              className="text-[34px] font-extrabold leading-none text-zinc-900"
              style={{ letterSpacing: "-0.025em" }}
            >
              {mode === "login" ? "欢迎回来" : "创建账号"}
            </div>
            <button
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-800"
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "没有账号？注册" : "返回登录"}
            </button>
          </div>

          <div className="grid gap-4.5">
            <div>
              <div className="mb-2 text-[12px] font-semibold text-zinc-500">
                邮箱
              </div>
              <Input
                className="h-12 rounded-xl border-zinc-200 bg-white/90 px-4 text-[15px] placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSubmit();
                }}
              />
            </div>

            <div>
              <div className="mb-2 text-[12px] font-semibold text-zinc-500">
                密码
              </div>
              <Input
                className="h-12 rounded-xl border-zinc-200 bg-white/90 px-4 text-[15px] placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少8位"
                type="password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSubmit();
                }}
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <div className="mb-2 text-[12px] font-semibold text-zinc-500">
                    昵称
                  </div>
                  <Input
                    className="h-12 rounded-xl border-zinc-200 bg-white/90 px-4 text-[15px] placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="例如：小法同学"
                  />
                </div>

                {tab === "student" && (
                  <div>
                    <div className="mb-2 text-[12px] font-semibold text-zinc-500">
                      年级（可选）
                    </div>
                    <Input
                      className="h-12 rounded-xl border-zinc-200 bg-white/90 px-4 text-[15px] placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="例如：初二 / 高一"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3.5 py-2.5">
            <div className="truncate text-xs text-zinc-500">
              演示：
              <span className="ml-1 font-semibold text-zinc-600">
                {sample.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail(sample.email);
                setPassword(sample.password);
              }}
              className="ml-2 flex shrink-0 items-center gap-0.5 text-xs font-semibold text-sky-600 transition-colors hover:text-sky-700"
            >
              一键填充 <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200/90 bg-red-50/85 px-4 py-3 text-sm text-red-600 animate-slide-up">
              {error}
            </div>
          )}

          <div className="mt-6">
            <Button
              size="lg"
              className="w-full rounded-xl text-base font-semibold tracking-[0.01em] !bg-[#3ba7d8] !shadow-[0_14px_28px_-18px_rgba(14,116,144,0.8)] hover:!bg-[#329ccc]"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading
                ? "处理中..."
                : mode === "login"
                  ? "开始学习"
                  : "注册并进入"}
            </Button>

            <p className="mt-5 text-center text-xs leading-relaxed text-zinc-500">
              本平台仅用于普法学习，不构成法律意见。
              <br />
              遇紧急情况请拨打 <span className="font-bold text-zinc-600">110</span>{" "}
              / <span className="font-bold text-zinc-600">12348</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
