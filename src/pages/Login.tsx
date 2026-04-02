import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { apiFetch, errorMessage, setToken } from "@/utils/api";
import type { AuthUser } from "@/types";
import { useAuthStore } from "@/stores/auth";
import { Shield, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

type RoleTab = "student" | "teacher";
type ExpressionMode = "normal" | "surprised" | "funny" | "avoidPassword";

/* ── 鼠标位置 hook ── */
function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return pos;
}

/* ── 单个角色 ── */
interface CharProps {
  color: string;
  highlight: string;
  shadowColor: string;
  x: string;
  y: string;
  bodyShape: "tall" | "square" | "round" | "flat";
  baseScale: number;
  mouse: { x: number; y: number };
  mode: ExpressionMode;
  charIdx: number;
}

function Character({
  color,
  highlight,
  shadowColor,
  x,
  y,
  bodyShape,
  baseScale,
  mouse,
  mode,
  charIdx,
}: CharProps) {
  /* 回避密码时统一看左 */
  const mx = mode === "avoidPassword" ? -0.9 : mouse.x;
  const my = mode === "avoidPassword" ? 0.1 : mouse.y;

  /* ── 头部变换 ── */
  let headRotateDeg = mx * 10;
  let headTiltDeg = my * 6;
  let headOffsetX = mx * 4;
  let headOffsetY = my * 3;

  if (mode === "surprised") {
    headRotateDeg = mx * 4;
    headTiltDeg = -10 - charIdx * 2; // 后仰
    headOffsetY = -6;
  }
  if (mode === "funny") {
    // 每个角色倾斜方向不同
    headRotateDeg = charIdx % 2 === 0 ? 18 : -15;
    headTiltDeg = charIdx % 2 === 0 ? 6 : -6;
    headOffsetX = charIdx % 2 === 0 ? 5 : -5;
    headOffsetY = 2;
  }
  if (mode === "avoidPassword") {
    headRotateDeg = -25;
    headTiltDeg = 0;
    headOffsetX = -8;
    headOffsetY = 0;
  }

  /* ── 眼球偏移（幅度比头部更大） ── */
  const eyeMaxX = 3.5;
  const eyeMaxY = 2.5;
  let eyeOffX = mx * eyeMaxX;
  let eyeOffY = my * eyeMaxY;

  if (mode === "surprised") {
    eyeOffX = 0;
    eyeOffY = -1;
  }
  if (mode === "funny") {
    eyeOffX = charIdx % 2 === 0 ? 2 : -2;
    eyeOffY = 1.5;
  }
  if (mode === "avoidPassword") {
    eyeOffX = -3.5;
    eyeOffY = 0;
  }

  /* ── 眼睛形状 ── */
  /* normal: 椭圆眯眯眼 | surprised: 大圆眼 | funny: 细线眼 | avoidPassword: 侧视眼 */

  /* ── body 尺寸 ── */
  const bodyW =
    bodyShape === "tall"
      ? 54
      : bodyShape === "square"
        ? 42
        : bodyShape === "round"
          ? 58
          : 64;
  const bodyH =
    bodyShape === "tall"
      ? 72
      : bodyShape === "square"
        ? 42
        : bodyShape === "round"
          ? 52
          : 28;
  const bodyRx =
    bodyShape === "tall"
      ? 27
      : bodyShape === "square"
        ? 10
        : bodyShape === "round"
          ? 29
          : 14;

  /* 头部尺寸 */
  const headR =
    bodyShape === "tall"
      ? 28
      : bodyShape === "square"
        ? 22
        : bodyShape === "round"
          ? 30
          : 24;
  /* flat角色头是半个椭圆 */
  const isFlat = bodyShape === "flat";

  /* 嘴巴路径 */
  function getMouth(): JSX.Element {
    if (mode === "surprised") {
      // 大O嘴，每个角色O的大小略不同
      const or = 5 + charIdx;
      return <ellipse cx="0" cy="0" rx={or} ry={or + 1} fill="#1a1a1a" />;
    }
    if (mode === "funny") {
      if (charIdx === 0)
        return (
          <path
            d="M-9 0 Q0 10 9 0"
            stroke="#1a1a1a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        );
      if (charIdx === 1)
        return (
          <path
            d="M-7 -2 Q0 9 7 -2"
            stroke="#1a1a1a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        );
      if (charIdx === 2)
        return (
          <path
            d="M-10 0 Q0 12 10 0"
            stroke="#1a1a1a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        );
      return (
        <path
          d="M-8 0 Q0 8 8 0"
          stroke="#1a1a1a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    if (mode === "avoidPassword") {
      return (
        <path
          d="M-5 0 Q0 4 5 0"
          stroke="#1a1a1a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    /* normal: 撇嘴 / 豆豆嘴 各角色不同 */
    if (charIdx === 0)
      return (
        <path
          d="M-6 2 Q0 -2 6 2"
          stroke="#1a1a1a"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      );
    if (charIdx === 1) return <circle cx="0" cy="0" r="3" fill="#1a1a1a" />;
    if (charIdx === 2)
      return (
        <path
          d="M-5 1 Q0 -3 5 1"
          stroke="#1a1a1a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    return <circle cx="0" cy="0" r="2.5" fill="#1a1a1a" />;
  }

  /* 眼睛SVG（单只，传cx偏移） */
  function getEye(side: "L" | "R"): JSX.Element {
    const sx = side === "L" ? -1 : 1;
    if (mode === "surprised") {
      const er = 5.5 + charIdx * 0.4;
      return (
        <>
          <ellipse cx="0" cy="0" rx={er} ry={er} fill="white" />
          <circle
            cx={eyeOffX * 0.6 * sx}
            cy={eyeOffY * 0.6}
            r={2.2}
            fill="#1a1a1a"
          />
        </>
      );
    }
    if (mode === "funny") {
      return (
        <path
          d={`M-5 ${sx === -1 ? -1 : 1} L5 ${sx === -1 ? 1 : -1}`}
          stroke="#1a1a1a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
    }
    if (mode === "avoidPassword") {
      return (
        <>
          <ellipse cx="0" cy="0" rx="5" ry="4" fill="white" />
          <circle cx="-3" cy="0" r="2" fill="#1a1a1a" />
        </>
      );
    }
    /* normal: 不同角色眼型 */
    if (charIdx === 0) {
      /* 紫：咪咪眼 细横线 */
      return (
        <path
          d="M-4 0 Q0 -3 4 0"
          stroke="#1a1a1a"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    if (charIdx === 1) {
      /* 黑：小圆眼 */
      return (
        <>
          <circle cx="0" cy="0" r="4" fill="white" />
          <circle cx={eyeOffX} cy={eyeOffY} r="2" fill="#1a1a1a" />
        </>
      );
    }
    if (charIdx === 2) {
      /* 黄：撇眼 */
      return (
        <path
          d="M-4 -1 Q0 2 4 -1"
          stroke="#1a1a1a"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    /* 橙：豆豆眼 */
    return (
      <>
        <circle cx="0" cy="0" r="3.5" fill="white" />
        <circle cx={eyeOffX} cy={eyeOffY} r="1.8" fill="#1a1a1a" />
      </>
    );
  }

  /* ─ 总宽高（SVG viewport） ─ */
  const svgW = bodyW + 20;
  const svgH = bodyH + headR * 2 + 20;
  const bx = svgW / 2;
  const by = svgH - bodyH / 2 - 4;
  const hx = bx;
  const hy = by - bodyH / 2 - headR + (isFlat ? headR * 0.5 : 0);

  /* 眼睛基准位置（相对头部中心） */
  const eyeSpacingX = isFlat ? 7 : headR * 0.38;
  const eyeBaseY = isFlat ? -headR * 0.1 : -headR * 0.05;
  const mouthBaseY = isFlat ? headR * 0.35 : headR * 0.42;

  const transition = "transition-all duration-200 ease-out";

  return (
    <div
      className="absolute select-none"
      style={{
        left: x,
        top: y,
        transform: `scale(${baseScale})`,
        transformOrigin: "center bottom",
      }}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        overflow="visible"
      >
        {/* 投影 */}
        <ellipse
          cx={bx}
          cy={svgH - 2}
          rx={bodyW * 0.45}
          ry={5}
          fill={shadowColor}
          opacity={0.35}
        />

        {/* 身体 */}
        <rect
          x={bx - bodyW / 2}
          y={by - bodyH / 2}
          width={bodyW}
          height={bodyH}
          rx={bodyRx}
          fill={color}
        />
        {/* 身体高光 */}
        <ellipse
          cx={bx - bodyW * 0.15}
          cy={by - bodyH * 0.25}
          rx={bodyW * 0.18}
          ry={bodyH * 0.12}
          fill={highlight}
          opacity={0.35}
        />

        {/* 头部组（带跟随变换） */}
        <g
          className={transition}
          transform={`translate(${hx + headOffsetX}, ${hy + headOffsetY}) rotate(${headRotateDeg}) rotateX(${headTiltDeg})`}
          style={{
            transform: `translate(${hx + headOffsetX}px, ${hy + headOffsetY}px) rotate(${headRotateDeg}deg)`,
            transformOrigin: `${hx}px ${hy + headR}px`,
            transition: "transform 0.18s ease-out",
          }}
        >
          {/* 头形 */}
          {isFlat ? (
            <ellipse cx="0" cy="0" rx={headR} ry={headR * 0.72} fill={color} />
          ) : (
            <circle cx="0" cy="0" r={headR} fill={color} />
          )}
          {/* 头部高光 */}
          <ellipse
            cx={-headR * 0.25}
            cy={-headR * 0.3}
            rx={headR * 0.22}
            ry={headR * 0.15}
            fill={highlight}
            opacity={0.4}
          />

          {/* 面部组 */}
          <g>
            {/* 左眼 */}
            <g transform={`translate(${-eyeSpacingX}, ${eyeBaseY})`}>
              {getEye("L")}
            </g>
            {/* 右眼 */}
            <g transform={`translate(${eyeSpacingX}, ${eyeBaseY})`}>
              {getEye("R")}
            </g>
            {/* 嘴巴 */}
            <g transform={`translate(0, ${mouthBaseY})`}>{getMouth()}</g>
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   卡通角色区（左侧面板）
───────────────────────────────────────────── */
interface CartoonPanelProps {
  mode: ExpressionMode;
  mouse: { x: number; y: number };
}

function CartoonPanel({ mode, mouse }: CartoonPanelProps) {
  const chars: Omit<CharProps, "mouse" | "mode">[] = [
    /* 0 紫色高个 */
    {
      color: "#7c5cfc",
      highlight: "#bba8ff",
      shadowColor: "#5a3db8",
      x: "12%",
      y: "8%",
      bodyShape: "tall",
      baseScale: 1.15,
      charIdx: 0,
    },
    /* 1 黑色方块 */
    {
      color: "#2d2d2d",
      highlight: "#888",
      shadowColor: "#111",
      x: "46%",
      y: "42%",
      bodyShape: "square",
      baseScale: 0.9,
      charIdx: 1,
    },
    /* 2 黄色圆润 */
    {
      color: "#f5c518",
      highlight: "#ffe97a",
      shadowColor: "#c49a00",
      x: "54%",
      y: "18%",
      bodyShape: "round",
      baseScale: 1.05,
      charIdx: 2,
    },
    /* 3 橙色半图 */
    {
      color: "#f07030",
      highlight: "#ffaa6a",
      shadowColor: "#b84e10",
      x: "18%",
      y: "62%",
      bodyShape: "flat",
      baseScale: 1.0,
      charIdx: 3,
    },
  ];

  return (
    <div className="relative w-full h-full">
      {chars.map((c) => (
        <Character key={c.charIdx} {...c} mouse={mouse} mode={mode} />
      ))}

      {/* 底部标语 */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <div
          className="inline-block text-zinc-500 text-sm font-semibold tracking-wide"
          style={{ fontFamily: "'Segoe UI', sans-serif" }}
        >
          用闯关的方式，掌握法律知识 ⚖️
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   主页面
───────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const { setAuth, clear } = useAuthStore();
  const mouse = useMouse();

  const [tab, setTab] = useState<RoleTab>("student");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* 表情状态 */
  const [expression, setExpression] = useState<ExpressionMode>("normal");
  const expressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setExprTemp = useCallback((m: ExpressionMode, ms = 2200) => {
    setExpression(m);
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    expressionTimerRef.current = setTimeout(() => setExpression("normal"), ms);
  }, []);

  const sample = {
    student: { email: "student@example.com", password: "Student123!" },
    teacher: { email: "teacher@example.com", password: "Teacher123!" },
  }[tab];

  async function onSubmit() {
    setError(null);
    setLoading(true);
    setExprTemp("funny", 3000);
    try {
      if (mode === "login") {
        const data = await apiFetch<{
          success: true;
          token: string;
          user: AuthUser;
        }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setAuth(data.token, data.user);
        navigate(
          data.user.role === "TEACHER" ? "/teacher/dashboard" : "/app/learn",
          { replace: true },
        );
      } else {
        const data = await apiFetch<{
          success: true;
          token: string;
          user: AuthUser;
        }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            role: tab,
            nickname,
            grade: tab === "student" ? grade : undefined,
          }),
        });
        setAuth(data.token, data.user);
        navigate(
          data.user.role === "TEACHER" ? "/teacher/dashboard" : "/app/learn",
          { replace: true },
        );
      }
    } catch (e: unknown) {
      setError(errorMessage(e));
      clear();
      setToken(null);
      setExpression("normal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── 左侧卡通区（桌面端） ── */}
      <div
        className="hidden lg:block relative shrink-0 overflow-hidden"
        style={{
          width: "48%",
          background: "#f4f4f6",
        }}
      >
        <CartoonPanel mode={expression} mouse={mouse} />
      </div>

      {/* ── 右侧登录区 ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-10 bg-white min-h-screen">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white flex items-center justify-center shadow-md shadow-blue-100">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div
                className="text-lg font-extrabold text-zinc-900 leading-tight"
                style={{
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                青少年普法互动平台
              </div>
              <div className="text-xs text-zinc-400 mt-0.5 tracking-wide">
                像打游戏一样学法律 🎮
              </div>
            </div>
          </div>

          {/* 角色切换 */}
          <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 p-1.5 mb-6">
            <button
              className={clsx(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                tab === "student"
                  ? "bg-white shadow-sm text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
              onClick={() => setTab("student")}
              type="button"
            >
              🎒 我是学生
            </button>
            <button
              className={clsx(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                tab === "teacher"
                  ? "bg-white shadow-sm text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
              onClick={() => setTab("teacher")}
              type="button"
            >
              👨‍🏫 我是老师
            </button>
          </div>

          {/* 标题 */}
          <div className="flex items-center justify-between mb-5">
            <div
              className="text-2xl font-extrabold text-zinc-900"
              style={{ letterSpacing: "-0.03em" }}
            >
              {mode === "login" ? "欢迎回来 👋" : "创建账号 🎉"}
            </div>
            <button
              className="text-sm font-bold text-[var(--p-accent)] hover:underline"
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "没账号？注册" : "去登录"}
            </button>
          </div>

          {/* 表单 */}
          <div className="grid gap-4">
            <div>
              <div className="text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-widest">
                邮箱
              </div>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                onFocus={() => setExprTemp("surprised", 99999)}
                onBlur={() => setExpression("normal")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSubmit();
                }}
              />
            </div>

            <div>
              <div className="text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-widest">
                密码
              </div>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少8位"
                type="password"
                onFocus={() => setExpression("avoidPassword")}
                onBlur={() => setExpression("normal")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSubmit();
                }}
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <div className="text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-widest">
                    昵称
                  </div>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="例如：小法同学"
                    onFocus={() => setExprTemp("surprised", 99999)}
                    onBlur={() => setExpression("normal")}
                  />
                </div>
                {tab === "student" && (
                  <div>
                    <div className="text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-widest">
                      年级（可选）
                    </div>
                    <Input
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="例如：初二 / 高一"
                      onFocus={() => setExprTemp("surprised", 99999)}
                      onBlur={() => setExpression("normal")}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* 演示账号 */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2">
            <div className="text-xs text-zinc-400 truncate">
              演示：
              <span className="font-semibold text-zinc-600 ml-1">
                {sample.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail(sample.email);
                setPassword(sample.password);
              }}
              className="text-xs font-bold text-[var(--p-primary)] hover:underline flex items-center gap-0.5 shrink-0 ml-2"
            >
              一键填充 <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* 错误 */}
          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-slide-up">
              ⚠️ {error}
            </div>
          )}

          {/* 提交 */}
          <div className="mt-5">
            <Button
              size="lg"
              className="w-full text-base font-extrabold tracking-wide"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading
                ? "⏳ 处理中..."
                : mode === "login"
                  ? "🚀 开始学习"
                  : "🎉 注册并进入"}
            </Button>

            <p className="mt-4 text-center text-xs text-zinc-400 leading-relaxed">
              本平台仅用于普法学习，不构成法律意见。
              <br />
              遇紧急情况请拨打{" "}
              <span className="font-bold text-zinc-600">110</span> /{" "}
              <span className="font-bold text-zinc-600">12348</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
