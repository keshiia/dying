import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import ChallengeModal from "@/components/student/ChallengeModal";
import { apiFetch, errorMessage } from "@/utils/api";
import type { LearningUnit, ResourceListItem } from "@/types";
import { useAuthStore } from "@/stores/auth";

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
    emoji: "🛍️",
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
  emoji: "📘",
  color: "text-zinc-700",
  bg: "bg-zinc-50",
  border: "border-zinc-200",
  tagColor: "zinc" as const,
};

function getCategoryMeta(cat: string) {
  return categoryMeta[cat] ?? fallbackMeta;
}

const legalTips = [
  {
    tip: "未成年人依法享有受教育权和人格尊严，任何组织和个人不得侵害。",
    law: "《未成年人保护法》第3条、第27条",
  },
  {
    tip: "校园欺凌不是“玩笑”，遇到持续侮辱、排挤、威胁时要及时求助。",
    law: "《未成年人保护法》第39条",
  },
  {
    tip: "个人信息受法律保护，验证码、身份证照片、家庭住址不要随意提供。",
    law: "《个人信息保护法》第4条、第10条",
  },
  {
    tip: "网络造谣、网暴、恶意传播隐私内容，可能侵犯名誉权和隐私权。",
    law: "《民法典》人格权编",
  },
  {
    tip: "网购纠纷要先留证据再维权：订单、支付记录、聊天记录都很关键。",
    law: "《消费者权益保护法》",
  },
  {
    tip: "面对“中奖链接”“退款客服”“先转账后处理”等说法，要提高警惕。",
    law: "反诈普法常识",
  },
  {
    tip: "交通规则的本质是保护生命，拒绝无证驾驶、醉驾和危险骑行。",
    law: "《道路交通安全法》",
  },
  {
    tip: "遇到高风险场景，先保证安全，再向老师、家长或警方求助。",
    law: "110 / 12348 求助渠道",
  },
];

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
        apiFetch<{ success: true; units: LearningUnit[] }>("/api/student/units"),
        apiFetch<{ success: true; resources: ResourceListItem[] }>(
          "/api/resources?type=LAW_SUMMARY",
        ),
      ]);
      setUnits(u.units);
      setCards(r.resources.slice(0, 8));
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

  const nextLevel = useMemo(() => {
    for (const u of units) {
      for (const l of u.levels) {
        if (l.progress?.status !== "COMPLETED") {
          return { unit: u, level: l };
        }
      }
    }
    return null;
  }, [units]);

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-[#58cc02] via-[#4ab800] to-[#3a9600] p-6 text-white relative">
        <div className="absolute right-0 top-0 bottom-0 w-56 pointer-events-none bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.12)_0%,transparent_70%)]" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold leading-tight">
              学习闯关中心 ⚖️
            </div>
            <div className="mt-1 text-white/80 text-base">刷关卡、攒经验、复盘错题</div>
            {user && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                  <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                  Lv {user.level} · {user.xp} XP
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                  <Flame className="h-3.5 w-3.5 text-orange-300" />
                  连续学习 3 天
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 text-yellow-200" />
                  已完成 {completedLevels} 关
                </div>
              </div>
            )}
          </div>

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

      <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4 flex items-start gap-3 border border-zinc-100">
        <div className="h-9 w-9 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-lg select-none">
          ⚖️
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
            今日法律知识
          </div>
          <div className="text-sm font-bold leading-snug text-zinc-800">
            {todayTip.tip}
          </div>
          <div className="mt-1 text-xs text-zinc-500">— {todayTip.law}</div>
        </div>
      </div>

      {!loading && nextLevel && (
        <button
          type="button"
          className="rounded-3xl border-2 border-[var(--p-primary)] bg-green-50 px-5 py-4 flex items-center justify-between gap-4 hover:bg-green-100 transition-colors text-left"
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
                继续上次 · 下一关
              </div>
              <div className="text-base font-extrabold text-zinc-900 truncate mt-0.5">
                {nextLevel.level.title}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {nextLevel.unit.title} · 奖励 {nextLevel.level.xpReward} XP
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-green-700 font-bold text-sm">
            <Zap className="h-4 w-4" />
            开始挑战
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      )}

      {!loading && !error && cards.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-base font-extrabold text-zinc-900">今日法律知识卡</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                先看知识卡，再闯关，更容易拿高分
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
                className="text-left rounded-2xl border border-zinc-100 bg-zinc-50 p-4 hover:bg-zinc-100 transition-all"
              >
                <div className="text-sm font-bold text-zinc-900 leading-snug">
                  {c.title}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="inline-block rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5"
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

      {!loading && !error && categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
              >
                {meta && <span>{meta.emoji}</span>}
                {c}
              </button>
            );
          })}
        </div>
      )}

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
              <div className={clsx("px-5 py-4 border-b border-zinc-100", meta.bg)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {meta.emoji}
                    </div>
                    <div>
                      <div className={clsx("text-base font-extrabold", meta.color)}>
                        {u.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <Tag color={meta.tagColor}>{u.category}</Tag>
                        <Tag color="zinc">{u.gradeRange}</Tag>
                      </div>
                    </div>
                  </div>

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
                          {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-zinc-900 truncate">
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

                      <Button
                        className="shrink-0"
                        size="sm"
                        variant={done ? "secondary" : isNext ? "primary" : "secondary"}
                        onClick={() =>
                          setOpenLevel({
                            id: l.id,
                            title: l.title,
                            xpReward: l.xpReward,
                          })
                        }
                      >
                        {done ? "再来一局" : isNext ? "开始🔥" : "开始"}
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
