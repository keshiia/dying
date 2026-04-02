import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import { apiFetch, errorMessage } from "@/utils/api";
import type { LearningUnit, ResourceListItem } from "@/types";
import ChallengeModal from "@/components/student/ChallengeModal";
import {
  BookOpen,
  Flame,
  Zap,
  Trophy,
  Star,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { clsx } from "clsx";

/* ── 主题配色 ── */
const categoryMeta: Record<
  string,
  {
    emoji: string;
    color: string;
    bg: string;
    border: string;
    tagColor:
      | "zinc"
      | "green"
      | "blue"
      | "purple"
      | "orange"
      | "red"
      | "yellow";
  }
> = {
  校园安全: {
    emoji: "🏫",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    tagColor: "blue",
  },
  网络安全: {
    emoji: "🌐",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    tagColor: "purple",
  },
  消费者权益: {
    emoji: "🛒",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    tagColor: "orange",
  },
  交通安全: {
    emoji: "🚦",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    tagColor: "green",
  },
  禁毒教育: {
    emoji: "🚫",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    tagColor: "red",
  },
  家庭权益: {
    emoji: "🏠",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    tagColor: "yellow",
  },
};
const fallbackMeta = {
  emoji: "📖",
  color: "text-zinc-700",
  bg: "bg-zinc-50",
  border: "border-zinc-200",
  tagColor: "zinc" as const,
};
function getCategoryMeta(cat: string) {
  return categoryMeta[cat] ?? fallbackMeta;
}

/* ── 每日法律金句 ── */
const legalTips = [
  {
    tip: "未成年人享有受教育权，任何组织和个人不得侵害。",
    law: "《未成年人保护法》第 27 条",
  },
  {
    tip: "网络暴力是违法行为，截图保存证据是维权第一步。",
    law: "《网络安全法》第 46 条",
  },
  {
    tip: "个人信息受法律保护，未经同意不得泄露或买卖。",
    law: "《个人信息保护法》第 13 条",
  },
  {
    tip: "消费者有权要求退换货，七天无理由退货是基本权利。",
    law: "《消费者权益保护法》第 25 条",
  },
  {
    tip: "校园欺凌不是小事，受害者有权向学校和警方求助。",
    law: "《未成年人保护法》第 39 条",
  },
];

/* ── 进度条颜色映射── */
function barColor(cat: string): "green" | "blue" | "purple" | "orange" {
  if (cat === "网络安全") return "purple";
  if (cat === "消费者权益") return "orange";
  if (cat === "校园安全") return "blue";
  return "green";
}

export default function Learn() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [units, setUnits] = useState<LearningUnit[]>([]);
  const [cards, setCards] = useState<ResourceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("全部");
  const [openLevel, setOpenLevel] = useState<null | {
    id: string;
    title: string;
    xpReward: number;
  }>(null);

  const todayTip = legalTips[new Date().getDate() % legalTips.length];

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [u, r] = await Promise.all([
        apiFetch<{ success: true; units: LearningUnit[] }>(
          "/api/student/units",
        ),
        apiFetch<{ success: true; resources: ResourceListItem[] }>(
          "/api/resources?type=LAW_SUMMARY",
        ),
      ]);
      setUnits(u.units);
      setCards(r.resources.slice(0, 6));
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totalLevels = useMemo(
    () => units.reduce((acc, u) => acc + u.levels.length, 0),
    [units],
  );
  const completedLevels = useMemo(
    () =>
      units.reduce(
        (acc, u) =>
          acc +
          u.levels.filter((l) => l.progress?.status === "COMPLETED").length,
        0,
      ),
    [units],
  );
  const pct = totalLevels
    ? Math.round((completedLevels / totalLevels) * 100)
    : 0;

  const categories = useMemo(() => {
    const set = new Set(units.map((u) => u.category));
    return ["全部", ...Array.from(set)];
  }, [units]);

  const filteredUnits = useMemo(() => {
    if (filter === "全部") return units;
    return units.filter((u) => u.category === filter);
  }, [filter, units]);

  /* 推荐下一个未完成关卡 */
  const nextLevel = useMemo(() => {
    for (const u of units) {
      for (const l of u.levels) {
        if (l.progress?.status !== "COMPLETED") return { unit: u, level: l };
      }
    }
    return null;
  }, [units]);

  return (
    <div className="grid gap-5">
      {/* ── Hero Banner ── */}
      <div
        className="rounded-3xl overflow-hidden bg-gradient-to-r from-[#58cc02] via-[#4ab800] to-[#3a9600] p-6 text-white relative"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-56 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div
              className="text-2xl font-extrabold leading-tight"
              style={{
                fontFamily: "system-ui,-apple-system,sans-serif",
                letterSpacing: "-0.03em",
              }}
            >
              学习闯关中心 ⚔️
            </div>
            <div className="mt-1 text-white/80" style={{ fontSize: "16px" }}>
              刷关卡·攒经验·复盘错题
            </div>
            {user && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                  <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                  Lv {user.level} · {user.xp} XP
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                  <Flame className="h-3.5 w-3.5 text-orange-300" />
                  连续学习 3 天{" "}
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 text-yellow-200" />
                  {completedLevels} 关已完成
                </div>
              </div>
            )}
          </div>

          {/* 进度环 */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-white leading-none">
                  {pct}%
                </span>
                <span className="text-xs text-white/70">完成</span>
              </div>
            </div>
            <div className="text-xs text-white/80 font-semibold">
              {completedLevels}/{totalLevels} 关卡
            </div>
          </div>
        </div>
      </div>

      {/* ── 每日法律金句 ── */}
      <div
        className="rounded-3xl bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4 flex items-start gap-3"
        style={{
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div className="h-9 w-9 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-lg select-none">
          ⚖️
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
            今日法律知识
          </div>
          <div
            className="text-sm font-bold leading-snug"
            style={{ color: "#333" }}
          >
            "{todayTip.tip}"
          </div>
          <div className="mt-1 text-xs text-zinc-500">—{todayTip.law}</div>
        </div>
      </div>

      {/* ── 推荐继续学习 ── */}
      {!loading && nextLevel && (
        <div
          className="rounded-3xl border-2 border-[var(--p-primary)] bg-green-50 px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() =>
            setOpenLevel({
              id: nextLevel.level.id,
              title: nextLevel.level.title,
              xpReward: nextLevel.level.xpReward,
            })
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-[var(--p-primary)] text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-green-200">
              {getCategoryMeta(nextLevel.unit.category).emoji}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-green-700 uppercase tracking-widest">
                继续上次 · 下一关{" "}
              </div>
              <div
                className="text-base font-extrabold text-zinc-900 truncate mt-0.5"
                style={{ letterSpacing: "-0.02em" }}
              >
                {nextLevel.level.title}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {nextLevel.unit.title} · 奖励 {nextLevel.level.xpReward} XP
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="flex items-center gap-1 text-white rounded-full px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                background: "#58cc02",
                boxShadow: "0 2px 6px rgba(16,185,129,0.15)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#10b981";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 4px 12px rgba(16,185,129,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#58cc02";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 2px 6px rgba(16,185,129,0.15)";
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              开始挑战{" "}
            </div>
            <ChevronRight className="h-5 w-5 text-green-600" />
          </div>
        </div>
      )}

      {/* ── 今日知识卡── */}
      {!loading && !error && cards.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div
                className="text-base font-extrabold text-zinc-900"
                style={{ letterSpacing: "-0.02em" }}
              >
                📇 今日法律知识卡{" "}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                先看卡片再闯关，更容易拿高分
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/app/resources")}
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              全部资源
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {cards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate("/app/resources")}
                className="text-left rounded-2xl p-4 transition-all group"
                style={{ border: "1px solid #f0f0f0", background: "#fafafa" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#f0f0f0";
                  (e.currentTarget as HTMLButtonElement).style.border =
                    "1px solid #e0e0e0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#fafafa";
                  (e.currentTarget as HTMLButtonElement).style.border =
                    "1px solid #f0f0f0";
                }}
              >
                <div
                  className="text-sm font-bold text-zinc-900 leading-snug group-hover:text-[var(--p-primary)] transition-colors"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {c.title}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      style={{
                        background: "#e6f7ef",
                        color: "#10b981",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        borderRadius: "9999px",
                        padding: "2px 10px",
                        display: "inline-block",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ── 主题分类筛选── */}
      {!loading && !error && categories.length > 1 && (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {categories.map((c) => {
            const meta = c === "全部" ? null : getCategoryMeta(c);
            const isActive = filter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={clsx(
                  "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all",
                  isActive
                    ? "bg-[var(--p-primary)] text-white shadow-md shadow-green-200"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                )}
                style={
                  isActive
                    ? {
                        borderBottom: "2px solid #10b981",
                        paddingBottom: "calc(0.5rem - 2px)",
                      }
                    : {}
                }
              >
                {meta && <span>{meta.emoji}</span>}
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 骨架屏── */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-40 bg-zinc-100 rounded-full" />
                <div className="h-3 w-24 bg-zinc-100 rounded-full" />
                <div className="mt-3 grid gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-16 bg-zinc-100 rounded-2xl" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="p-5 text-sm text-red-700 bg-red-50 border-red-100">
          ⚠️ {error}
        </Card>
      )}

      {/* ── 关卡单元列表 ── */}
      {!loading &&
        !error &&
        filteredUnits.map((u) => {
          const meta = getCategoryMeta(u.category);
          const unitCompleted = u.levels.filter(
            (l) => l.progress?.status === "COMPLETED",
          ).length;
          const unitTotal = u.levels.length;
          const unitPct = unitTotal
            ? Math.round((unitCompleted / unitTotal) * 100)
            : 0;

          return (
            <Card key={u.id} className="overflow-hidden">
              {/* 单元头部 */}
              <div
                className={clsx("px-5 py-4 border-b border-zinc-100", meta.bg)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {meta.emoji}
                    </div>
                    <div>
                      <div
                        className={clsx("text-base font-extrabold", meta.color)}
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {u.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <Tag color={meta.tagColor}>{u.category}</Tag>
                        <Tag color="zinc">{u.gradeRange}</Tag>
                      </div>
                    </div>
                  </div>

                  {/* 单元进度 */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <div className="text-xs font-bold text-zinc-500 mb-1.5">
                      {unitCompleted}/{unitTotal} 完成
                    </div>
                    <div className="w-28">
                      <ProgressBar
                        value={unitPct}
                        size="sm"
                        color={barColor(u.category)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 关卡列表 · 统一高度 */}
              <div className="p-4 grid gap-2">
                {u.levels.map((l, idx) => {
                  const done = l.progress?.status === "COMPLETED";
                  const best = l.progress?.bestScore ?? 0;
                  const isNext =
                    !done &&
                    u.levels
                      .slice(0, idx)
                      .every((prev) => prev.progress?.status === "COMPLETED");

                  return (
                    <div
                      key={l.id}
                      className={clsx(
                        "h-[72px] flex items-center justify-between gap-3 rounded-2xl border px-4 transition-all",
                        done
                          ? "border-green-200 bg-green-50"
                          : isNext
                            ? "border-[var(--p-primary)] bg-green-50/60"
                            : "border-zinc-100 bg-white hover:border-zinc-200",
                      )}
                    >
                      {/* 左侧：序号 + 标题 */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={clsx(
                            "h-8 w-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0",
                            done
                              ? "bg-green-500 text-white"
                              : isNext
                                ? "bg-[var(--p-primary)] text-white"
                                : "bg-zinc-100 text-zinc-500",
                          )}
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="text-sm font-bold text-zinc-900 truncate"
                            style={{ letterSpacing: "-0.01em" }}
                          >
                            {l.title}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            +{l.xpReward} XP
                            {done
                              ? ` · 最佳${best}分`
                              : isNext
                                ? " · 推荐挑战"
                                : ""}
                          </div>
                        </div>
                      </div>

                      {/* 右侧：按钮*/}
                      <Button
                        className="shrink-0"
                        size="sm"
                        variant={
                          done ? "secondary" : isNext ? "primary" : "secondary"
                        }
                        onClick={() =>
                          setOpenLevel({
                            id: l.id,
                            title: l.title,
                            xpReward: l.xpReward,
                          })
                        }
                      >
                        {done ? "再来一局" : isNext ? "开始🚀" : "开始"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}

      <ChallengeModal
        openLevel={openLevel}
        onClose={() => setOpenLevel(null)}
        onCompleted={load}
      />
    </div>
  );
}
