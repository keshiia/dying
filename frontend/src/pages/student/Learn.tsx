import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CircleHelp,
  CheckCircle2,
  ChevronRight,
  Flame,
  RotateCcw,
  Scale,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import ChallengeModal from "@/components/student/ChallengeModal";
import BannerCarousel from "@/components/ui/BannerCarousel";
import { apiFetch, errorMessage } from "@/utils/api";
import type { LearningUnit } from "@/types";
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
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
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
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
    tagColor: "blue",
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

function barColor(cat: string): "green" | "blue" | "purple" | "orange" {
  if (cat === "网络安全") return "purple";
  if (cat === "消费者权益") return "orange";
  if (cat === "校园安全") return "blue";
  return "green";
}

function levelDifficulty(orderNo: number): "基础" | "进阶" | "挑战" | "实战" {
  if (orderNo <= 1) return "基础";
  if (orderNo === 2) return "进阶";
  if (orderNo === 3) return "挑战";
  return "实战";
}

const unitLearningGuide: Record<string, { goal: string; law: string }> = {
  "unit-campus": {
    goal: "本单元重点：识别欺凌、保留证据、及时求助。",
    law: "依据：《未成年人保护法》",
  },
  "unit-network": {
    goal: "本单元重点：防诈骗、护隐私、理性表达。",
    law: "依据：《个人信息保护法》",
  },
  "unit-family": {
    goal: "本单元重点：监护沟通、隐私边界、求助链路。",
    law: "依据：《未成年人保护法》",
  },
  "unit-consumer": {
    goal: "本单元重点：留凭证、看规则、依法维权。",
    law: "依据：《消费者权益保护法》",
  },
  "unit-traffic": {
    goal: "本单元重点：守规则、避风险、先安全后处置。",
    law: "依据：《道路交通安全法》",
  },
  "unit-drug": {
    goal: "本单元重点：识别诱导、明确拒绝、及时求助。",
    law: "依据：《禁毒法》",
  },
};

export default function Learn() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [units, setUnits] = useState<LearningUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [filter, setFilter] = useState<string>("全部");
  const [showPendingOnly, setShowPendingOnly] = useState(true);
  const [openLevel, setOpenLevel] = useState<null | {
    id: string;
    title: string;
    xpReward: number;
  }>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [u, summary] = await Promise.all([
        apiFetch<{ success: true; units: LearningUnit[] }>("/api/student/units"),
        apiFetch<{
          success: true;
          stats: {
            attemptCount: number;
            avgScore: number;
            completedLevels: number;
            streakDays: number;
          };
        }>("/api/student/summary"),
      ]);
      setUnits(u.units);
      setStreakDays(summary.stats.streakDays ?? 0);
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

  const filteredTotalLevels = useMemo(
    () => filteredUnits.reduce((acc, u) => acc + u.levels.length, 0),
    [filteredUnits],
  );

  const filteredPendingLevels = useMemo(
    () =>
      filteredUnits.reduce(
        (acc, u) =>
          acc + u.levels.filter((l) => l.progress?.status !== "COMPLETED").length,
        0,
      ),
    [filteredUnits],
  );

  const displayUnits = useMemo(() => {
    return filteredUnits
      .map((u) => ({
        ...u,
        pendingLevels: u.levels.filter((l) => l.progress?.status !== "COMPLETED"),
        visibleLevels:
          showPendingOnly
            ? u.levels.filter((l) => l.progress?.status !== "COMPLETED")
            : u.levels,
      }))
      .filter((u) => u.visibleLevels.length > 0);
  }, [filteredUnits, showPendingOnly]);

  function challengeActionLabel(done: boolean, isNext: boolean) {
    if (done) return "再次练习";
    if (isNext) return "继续挑战";
    return "开始挑战";
  }

  return (
    <div className="grid gap-5">
      <BannerCarousel
        slides={[
          { src: '/images/banners/learn/banner-1.jpg', alt: '学习闯关' },
          { src: '/images/banners/learn/banner-2.png', alt: '学习闯关' },
          { src: '/images/banners/learn/banner-3.jpg', alt: '学习闯关' },
        ]}
      />

      {/* Stats bar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 backdrop-blur-sm px-5 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[var(--p-primary)] to-[var(--p-primary-dark)] text-white shadow-sm shadow-blue-100">
            <Scale className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-sm font-extrabold text-zinc-900">学习闯关中心</div>
            <div className="text-xs text-zinc-500">刷关卡、攒经验、复盘错题</div>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Lv {user.level} · {user.xp} XP
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700">
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              {streakDays > 0 ? `连续学习 ${streakDays} 天` : "今日待打卡"}
            </div>
          </div>
        )}
      </div>

      {!loading && !error && (
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate("/app/tasks")}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <CircleHelp className="h-4 w-4 text-slate-600" />
              今日1题
            </div>
            <div className="mt-1 text-xs text-zinc-500">30 秒快速热身</div>
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/tasks")}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <RotateCcw className="h-4 w-4 text-slate-600" />
              错题复盘
            </div>
            <div className="mt-1 text-xs text-zinc-500">查漏补缺更高效</div>
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/resources")}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <BookOpen className="h-4 w-4 text-slate-600" />
              法条速查
            </div>
            <div className="mt-1 text-xs text-zinc-500">按主题快速查依据</div>
          </button>
        </div>
      )}

      {!loading && !error && categories.length > 1 && (
        <div className="sticky top-[68px] lg:top-2 z-20">
          <div className="rounded-2xl border border-zinc-100/80 bg-white/80 backdrop-blur-sm px-3 py-2 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
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
                        ? "bg-[var(--p-primary)] text-white shadow-md shadow-slate-200"
                        : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                    )}
                  >
                    {meta && <span>{meta.emoji}</span>}
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-3 py-3 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[11px] font-bold tracking-wide text-sky-700">
                    闯关显示模式
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    未完成 {filteredPendingLevels} / 共 {filteredTotalLevels}
                  </div>
                </div>
                <div className="inline-flex rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowPendingOnly(false)}
                    className={clsx(
                      "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
                      !showPendingOnly
                        ? "bg-slate-700 text-white"
                        : "text-zinc-600 hover:bg-zinc-50",
                    )}
                  >
                    全部关卡
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPendingOnly(true)}
                    className={clsx(
                      "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
                      showPendingOnly
                        ? "bg-[var(--p-primary)] text-white"
                        : "text-zinc-600 hover:bg-zinc-50",
                    )}
                  >
                    只看未完成
                  </button>
                </div>
              </div>
              {showPendingOnly && (
                <div className="mt-2 text-xs font-medium text-sky-700">
                  已开启专注模式，仅展示未完成关卡。
                </div>
              )}
            </div>
          </div>
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

      {!loading && !error && displayUnits.length === 0 && (
        <Card className="p-5">
          <div className="text-sm text-zinc-600">
            当前筛选下暂无关卡，试试切换分类或关闭“只看未完成”。
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {showPendingOnly && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPendingOnly(false)}
              >
                查看全部关卡
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/app/tasks")}
            >
              去错题复盘
            </Button>
          </div>
        </Card>
      )}

      {!loading &&
        !error &&
        displayUnits.map((u) => {
          const meta = getCategoryMeta(u.category);
          const guide =
            unitLearningGuide[u.id] ?? {
              goal: "本单元重点：场景判断、风险识别和合规求助。",
              law: "依据：青少年普法通识",
            };
          const unitCompleted = u.levels.filter(
            (l) => l.progress?.status === "COMPLETED",
          ).length;
          const unitTotal = u.levels.length;
          const unitPct = unitTotal
            ? Math.round((unitCompleted / unitTotal) * 100)
            : 0;
          const firstIncompleteId = u.levels.find(
            (level) => level.progress?.status !== "COMPLETED",
          )?.id;

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
                      <div className="mt-1 text-xs font-medium text-zinc-600">
                        {guide.goal}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <Tag color={meta.tagColor}>{u.category}</Tag>
                        <Tag color="zinc">{u.gradeRange}</Tag>
                        <Tag color="zinc">{guide.law}</Tag>
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
                {u.visibleLevels.map((l) => {
                  const done = l.progress?.status === "COMPLETED";
                  const best = l.progress?.bestScore ?? 0;
                  const isNext = !done && l.id === firstIncompleteId;
                  const isLocked = !done && !isNext;

                  return (
                    <div
                      key={l.id}
                      className={clsx(
                        "h-[72px] flex items-center justify-between gap-3 rounded-2xl border px-4 transition-all",
                        done
                          ? "border-slate-200 bg-slate-100"
                          : isNext
                          ? "border-[var(--p-primary)] bg-slate-100/85"
                          : "border-zinc-100 bg-zinc-50",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={clsx(
                            "h-8 w-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0",
                            done
                              ? "bg-slate-500 text-white"
                              : isNext
                              ? "bg-[var(--p-primary)] text-white"
                              : "bg-zinc-200 text-zinc-500",
                          )}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : l.orderNo}
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
                                : " · 完成上一关后解锁"}
                          </div>
                          <div className="mt-1">
                            <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                              难度：{l.difficulty ?? levelDifficulty(l.orderNo)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="shrink-0"
                        size="sm"
                        variant={done ? "secondary" : isNext ? "primary" : "secondary"}
                        disabled={isLocked}
                        onClick={() =>
                          setOpenLevel({
                            id: l.id,
                            title: l.title,
                            xpReward: l.xpReward,
                          })
                        }
                      >
                        {isLocked ? "未解锁" : challengeActionLabel(done, isNext)}
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
        onCompleted={async (data) => {
          if (data.user) {
            const store = useAuthStore.getState()
            if (store.token && store.user) {
              store.setAuth(store.token, { ...store.user, xp: data.user.xp, level: data.user.level })
            }
          }
          await load()
        }}
      />
    </div>
  );
}
