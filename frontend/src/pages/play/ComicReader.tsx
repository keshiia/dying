import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Lightbulb, Scale, X } from "lucide-react";
import { clsx } from "clsx";
import { useToast } from "@/components/ui/toastContext";
import { apiFetch, errorMessage } from "@/utils/api";
import { useAuthStore } from "@/stores/auth";
import { getComicById, type ComicStory } from "@/data/comics";
import { readComicIds, writeComicIds } from "@/utils/comicReads";

/** 图片原始比例。容器锁这个比例，翻页时画面不会跳动 */
const FRAME_ASPECT = "970 / 672";
/** 图片实际宽度。全屏的意义是把干扰拿掉，不是把 970px 的图拉到 1440px 去糊 */
const FRAME_MAX_W = "min(100%, 970px)";

type QuizState = {
  /** 学生选中的选项，未作答为 null */
  chosen: string | null;
  /** 是否答对，未作答为 null */
  correct: boolean | null;
};

export default function ComicReader() {
  const { storyId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const story = useMemo(() => getComicById(storyId), [storyId]);

  const [panel, setPanel] = useState(0);
  const [readDone, setReadDone] = useState(false);
  const [xpAnim, setXpAnim] = useState(false);
  // 初始必须是 0：这是一篇已经读过的漫画时 markRead 会提前返回，lastXpGain
  // 不会被赋值。留 10 的话小结屏会谎报「阅读完成！获得 10 XP」。
  const [lastXpGain, setLastXpGain] = useState(0);
  const [quiz, setQuiz] = useState<QuizState>({ chosen: null, correct: null });
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  const totalPanels = story?.panels.length ?? 0;
  /** 走到 panels.length 表示已经翻到最后一屏（法律小课堂 + 总结题） */
  const onSummary = panel >= totalPanels;
  const progress = totalPanels === 0 ? 0 : Math.min(panel, totalPanels) / totalPanels;

  const exit = useCallback(() => navigate("/app/comics"), [navigate]);

  // storyId 非法（手敲 URL 或旧链接）→ 回列表，而不是白屏
  useEffect(() => {
    if (!story) navigate("/app/comics", { replace: true });
  }, [story, navigate]);

  // 载入已读状态与既有作答，避免重复发 XP、也避免把答过的题显示成没答
  useEffect(() => {
    if (!userId || !story) return;
    apiFetch<{
      success: true;
      storyIds: string[];
      quizResults?: Record<string, { optionId: string; correct: boolean }>;
    }>("/api/student/comic-reads")
      .then((res) => {
        setReadDone(res.storyIds.includes(story.id));
        const prev = res.quizResults?.[story.id];
        if (prev) setQuiz({ chosen: prev.optionId, correct: prev.correct });
      })
      .catch(() => {
        setReadDone(readComicIds(userId).includes(story.id));
      });
  }, [userId, story]);

  /** 记录阅读完成。服务端没记上就回滚本地状态 —— 不伪造「阅读完成」 */
  const markRead = useCallback(
    (target: string) => {
      if (readDone) return;
      setReadDone(true);
      setXpAnim(true);
      if (userId) {
        const next = new Set(readComicIds(userId));
        next.add(target);
        writeComicIds(userId, next);
      }
      apiFetch<{ success: true; xpGain: number; user: { id: string; xp: number; level: number } }>(
        "/api/student/comic-read",
        { method: "POST", body: JSON.stringify({ storyId: target }) },
      )
        .then((res) => {
          setLastXpGain(res.xpGain);
          toast(`阅读完成，+${res.xpGain} XP`, "success");
          if (res.xpGain > 0) {
            const store = useAuthStore.getState();
            if (store.token && store.user) {
              store.setAuth(store.token, { ...store.user, xp: res.user.xp, level: res.user.level });
            }
          }
        })
        .catch(() => {
          setReadDone(false);
          setXpAnim(false);
          if (userId) {
            const rolled = new Set(readComicIds(userId));
            rolled.delete(target);
            writeComicIds(userId, rolled);
          }
          toast("阅读记录同步失败，请稍后重试", "warning");
        })
        .finally(() => setTimeout(() => setXpAnim(false), 2000));
    },
    [readDone, userId, toast],
  );

  const revealSummary = useCallback(() => {
    if (!story) return;
    setPanel(totalPanels);
    markRead(story.id);
  }, [story, totalPanels, markRead]);

  const goNext = useCallback(() => {
    if (panel < totalPanels - 1) setPanel((p) => p + 1);
    else if (panel === totalPanels - 1) revealSummary();
  }, [panel, totalPanels, revealSummary]);

  const goPrev = useCallback(() => {
    if (panel > 0) setPanel((p) => p - 1);
  }, [panel]);

  const answerQuiz = useCallback(
    async (optionId: string) => {
      if (!story || quizSubmitting || quiz.chosen) return;
      const option = story.quiz.options.find((o) => o.id === optionId);
      if (!option) return;
      setQuizSubmitting(true);
      try {
        const res = await apiFetch<{
          success: true;
          correct: boolean;
          xpGain: number;
          user: { id: string; xp: number; level: number };
        }>("/api/student/comic-quiz", {
          method: "POST",
          body: JSON.stringify({ storyId: story.id, optionId }),
        });
        setQuiz({ chosen: optionId, correct: res.correct });
        if (res.xpGain > 0) {
          toast(`答对了，+${res.xpGain} XP`, "success");
          const store = useAuthStore.getState();
          if (store.token && store.user) {
            store.setAuth(store.token, { ...store.user, xp: res.user.xp, level: res.user.level });
          }
        }
      } catch (e: unknown) {
        // 作答没能保存时不要假装答过了 —— 允许重试
        toast(`作答未能保存：${errorMessage(e)}`, "warning");
      } finally {
        setQuizSubmitting(false);
      }
    },
    [story, quiz.chosen, quizSubmitting, toast],
  );

  // 键盘：与改造前保持一致，读者不用重新学
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (panel < totalPanels - 1) goNext();
        else if (panel === totalPanels - 1) revealSummary();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "Escape") {
        exit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, totalPanels, goNext, goPrev, revealSummary, exit]);

  const touchStartX = useRef(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) < 50) return;
      if (diff < 0) {
        if (panel < totalPanels - 1) goNext();
        else if (panel === totalPanels - 1) revealSummary();
      } else {
        goPrev();
      }
    },
    [panel, totalPanels, goNext, goPrev, revealSummary],
  );

  if (!story) return <div className="min-h-screen bg-zinc-950" />;

  const current = story.panels[panel];
  // 小结屏没有当前格，沿用最后一格当环境光，翻过去时背景不跳
  const backdrop = story.panels[Math.min(panel, totalPanels - 1)]?.image;

  return (
    <div
      // 底色仍然是深的 —— 漫画图在深底上才跳出来，这是阅读器与浅色工作台分工的理由。
      // 但**纯黑不行**：画面是暖橙的，四周冷黑，两者打架，看起来像没做完。
      // 解法是给整页铺一层「环境光」（下面那张放大模糊的图），四周的颜色跟着画面走。
      // 这一格是暖阳，周围就是暖光；换一格偏冷的，周围自动变冷。
      className="relative flex h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 环境光 */}
      {backdrop && (
        <>
          <img
            key={backdrop}
            src={backdrop}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-55 blur-3xl"
          />
          {/* 压暗 + 中心留亮，保证文字与画面都有对比 */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(9,9,11,0.28),rgba(9,9,11,0.82))]" />
        </>
      )}

      {/* 顶栏 */}
      <header className="relative z-10 flex shrink-0 items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={exit}
          aria-label="返回漫画列表"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">
            {story.emoji} {story.title}
          </div>
          {/* 细进度条：全屏下 7 个圆点太寒酸 */}
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[var(--p-primary)] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/70 backdrop-blur">
          {onSummary ? "小结" : `${panel + 1} / ${totalPanels}`}
        </span>
      </header>

      {/* 舞台 */}
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {!onSummary && current ? (
          <figure className="mx-auto flex h-full max-w-[970px] flex-col justify-center gap-3">
            <div
              className="relative w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/15 shadow-[0_28px_70px_rgba(0,0,0,0.6)]"
              style={{ aspectRatio: FRAME_ASPECT, maxWidth: FRAME_MAX_W, margin: "0 auto" }}
            >
              {/* 原始比例 + contain：改造前是 aspect-[4/3] + cover，每张图被裁掉约 7.6% 宽度 */}
              <img
                src={current.image}
                alt={current.caption ?? `第 ${panel + 1} 格`}
                className="h-full w-full object-contain"
              />
              {xpAnim && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40">
                  <div className="animate-[xpPop_2s_ease-out_forwards] text-center">
                    <div className="text-4xl">🎉</div>
                    <div className="text-2xl font-black drop-shadow-lg">
                      {lastXpGain > 0 ? `+${lastXpGain} XP` : "已阅读过"}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {current.caption && (
              <figcaption className="mx-auto w-full max-w-[970px] rounded-2xl bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white/90 ring-1 ring-white/10 backdrop-blur">
                {current.caption}
              </figcaption>
            )}
          </figure>
        ) : (
          <SummaryScreen
            story={story}
            readDone={readDone}
            lastXpGain={lastXpGain}
            quiz={quiz}
            submitting={quizSubmitting}
            onAnswer={answerQuiz}
            onJumpToPanel={(idx) => setPanel(idx)}
            onExit={exit}
          />
        )}
      </main>

      {/* 底栏 */}
      <footer className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={panel === 0}
          className={clsx(
            "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition-colors",
            panel === 0
              ? "text-white/20"
              : "bg-white/10 text-white/90 backdrop-blur hover:bg-white/20",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          上一页
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={onSummary}
          className={clsx(
            "flex items-center gap-1 rounded-full px-5 py-2 text-sm font-bold transition-all",
            onSummary
              ? "text-white/20"
              : "bg-[var(--p-primary)] text-white shadow-lg shadow-black/30 hover:opacity-90",
          )}
        >
          {panel === totalPanels - 1 ? "看小结" : "下一页"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}

/** 尾屏：法律小课堂 + 相关法律 + 总结题，合成一屏（改造前是翻过头的附加页） */
function SummaryScreen({
  story,
  readDone,
  lastXpGain,
  quiz,
  submitting,
  onAnswer,
  onJumpToPanel,
  onExit,
}: {
  story: ComicStory;
  readDone: boolean;
  lastXpGain: number;
  quiz: QuizState;
  submitting: boolean;
  onAnswer: (optionId: string) => void;
  /** 跳回故事里支撑答案的那一格（0 基） */
  onJumpToPanel: (index: number) => void;
  onExit: () => void;
}) {
  const answered = quiz.chosen !== null;
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4 py-2">
      {readDone && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/15 px-4 py-3 ring-1 ring-amber-400/30 backdrop-blur-md">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="text-sm font-extrabold text-amber-200">
              {lastXpGain > 0 ? `阅读完成！获得 ${lastXpGain} XP` : "已阅读过本漫画"}
            </div>
            <div className="text-xs text-amber-200/70">答对下面的总结题可再得 5 XP</div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-emerald-500/10 p-5 ring-1 ring-emerald-400/25 backdrop-blur-md">
        <div className="flex items-center gap-2 text-base font-extrabold text-emerald-200">
          <Lightbulb className="h-5 w-5" />
          法律小课堂
        </div>
        <div className="mt-3 text-sm font-semibold leading-relaxed text-emerald-50/90">
          {story.lawTip}
        </div>
      </div>

      <div className="rounded-2xl bg-sky-500/10 p-5 ring-1 ring-sky-400/25 backdrop-blur-md">
        <div className="flex items-center gap-2 text-base font-extrabold text-sky-200">
          <Scale className="h-5 w-5" />
          相关法律
        </div>
        <div className="mt-3 text-sm font-semibold leading-relaxed text-sky-50/90">
          {story.relatedLaw}
        </div>
      </div>

      {/* 总结题 —— 从故事上升到一般规则，答案必须能指回具体某一格 */}
      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-md">
        <div className="text-xs font-bold uppercase tracking-wide text-white/50">总结一下</div>
        <div className="mt-2 text-base font-extrabold">{story.quiz.question}</div>
        <div className="mt-4 grid gap-2">
          {story.quiz.options.map((opt, i) => {
            const selected = quiz.chosen === opt.id;
            const showCorrect = answered && opt.isCorrect;
            const showWrongPick = answered && selected && !opt.isCorrect;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={answered || submitting}
                onClick={() => onAnswer(opt.id)}
                className={clsx(
                  "flex items-start gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all ring-1",
                  showCorrect
                    ? "bg-emerald-500/20 ring-emerald-400/50"
                    : showWrongPick
                      ? "bg-rose-500/15 ring-rose-400/40"
                      : selected
                        ? "bg-white/15 ring-white/30"
                        : "bg-white/5 ring-white/10 hover:bg-white/10",
                  (answered || submitting) && "cursor-default",
                )}
              >
                <span
                  className={clsx(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold",
                    showCorrect
                      ? "bg-emerald-500 text-white"
                      : showWrongPick
                        ? "bg-rose-500 text-white"
                        : "bg-white/10 text-white/60",
                  )}
                >
                  {showCorrect ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : showWrongPick ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="font-semibold leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={clsx(
              "mt-4 rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1",
              quiz.correct
                ? "bg-emerald-500/10 text-emerald-50/90 ring-emerald-400/25"
                : "bg-white/5 text-white/80 ring-white/10",
            )}
          >
            <div className="mb-1 font-extrabold">
              {quiz.correct ? `✅ 答对了，+5 XP` : "再看一眼故事里的这一步"}
            </div>
            {story.quiz.explanation}

            {/* 护栏：这道题的答案必须能指回故事里具体一格。
                答错时先让学生回去看那一步，比直接告诉他答案更有效。 */}
            <button
              type="button"
              onClick={() => onJumpToPanel(story.quiz.evidencePanel - 1)}
              className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 transition-colors hover:bg-white/20"
            >
              ← 回到第 {story.quiz.evidencePanel} 格看看
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onExit}
        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85 backdrop-blur-md hover:bg-white/15 transition-colors"
      >
        返回漫画列表
      </button>
    </div>
  );
}
