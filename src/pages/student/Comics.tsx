import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lightbulb,
  Scale,
  Sparkles,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import BannerCarousel from "@/components/ui/BannerCarousel";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/utils/api";

interface ComicPanel {
  image: string;
  caption?: string;
}

interface ComicStory {
  id: string;
  title: string;
  topic: string;
  tagColor: "blue" | "purple" | "orange" | "red" | "yellow" | "green";
  emoji: string;
  cover: string;
  description: string;
  panels: ComicPanel[];
  lawTip: string;
  relatedLaw: string;
}

const placeholderComics: ComicStory[] = [
  {
    id: "comic-bullying-1",
    title: "小明的烦恼",
    topic: "校园欺凌",
    tagColor: "blue",
    emoji: "🏫",
    cover: "/images/comics/bullying-1/01.png",
    description: "小明在放学路上被同学围堵索要零花钱，他该如何应对？",
    panels: [
      { image: "/images/comics/bullying-1/01.png", caption: "放学后的小明独自走在回家的路上..." },
      { image: "/images/comics/bullying-1/02.png", caption: "突然，几个高年级同学挡住了他的去路。" },
      { image: "/images/comics/bullying-1/03.png", caption: '"喂，把零花钱交出来！"' },
      { image: "/images/comics/bullying-1/04.png", caption: "小明想起了老师讲过的应对方法..." },
      { image: "/images/comics/bullying-1/05.png", caption: '"我不给，你们这样做是违法的！"' },
      { image: "/images/comics/bullying-1/06.png", caption: "小明勇敢地告诉了老师和家长，最终得到了保护。" },
    ],
    lawTip: "遇到校园欺凌，要勇敢说「不」！记住：告诉老师、家长或拨打 110 报警都是正确做法，沉默只会让欺凌者更加嚣张。",
    relatedLaw: "《未成年人保护法》第二十七条 · 学校不得对未成年人实施体罚、变相体罚或者其他侮辱人格尊严的行为。",
  },
  {
    id: "comic-online-1",
    title: "天上掉馅饼？",
    topic: "网络诈骗",
    tagColor: "purple",
    emoji: "🌐",
    cover: "/images/comics/online-1/01.png",
    description: "小红收到一条中奖短信，奖品丰厚，她需要怎么做？",
    panels: [
      { image: "/images/comics/online-1/01.png", caption: "周末，小红收到一条短信：" },
      { image: "/images/comics/online-1/02.png", caption: '"恭喜您被抽中一等奖！请点击链接领取..."' },
      { image: "/images/comics/online-1/03.png", caption: "小红有些心动，正准备点击链接..." },
      { image: "/images/comics/online-1/04.png", caption: "妈妈看到了，赶紧阻止了她。" },
      { image: "/images/comics/online-1/05.png", caption: '"这很可能是诈骗短信，千万别点！"' },
      { image: "/images/comics/online-1/06.png", caption: "小红学会了辨别诈骗信息，还把案例分享给了同学。" },
    ],
    lawTip: "收到「中奖」「免费领」等消息时，不要点击陌生链接，更不要输入个人信息或转账。遇到可疑情况，拨打 12377 举报网络不良信息。",
    relatedLaw: "《反电信网络诈骗法》第三十一条 · 任何单位和个人不得非法买卖、出租、出借电话卡、银行卡。",
  },
  {
    id: "comic-consumer-1",
    title: "买的球鞋是假货",
    topic: "消费者权益",
    tagColor: "orange",
    emoji: "🛍️",
    cover: "/images/comics/consumer-1/01.png",
    description: "小刚在网上买的限量球鞋到手后发现是假货，他该怎么维权？",
    panels: [
      { image: "/images/comics/consumer-1/01.png", caption: "小刚攒了很久的零花钱，终于买了心仪的限量球鞋。" },
      { image: "/images/comics/consumer-1/02.png", caption: "拆开快递后，他发现鞋子的做工很粗糙..." },
      { image: "/images/comics/consumer-1/03.png", caption: '"这不就是假货吗！"' },
      { image: "/images/comics/consumer-1/04.png", caption: "小刚保留了聊天记录、商品页面截图和实物照片。" },
      { image: "/images/comics/consumer-1/05.png", caption: "他先联系卖家要求退货退款，被拒绝后..." },
      { image: "/images/comics/consumer-1/06.png", caption: "小刚向平台投诉并拨打 12315，最终成功维权。" },
    ],
    lawTip: "网购维权关键：保留证据（聊天记录、商品截图、实物照片），先与商家协商，协商不成可向平台投诉或拨打 12315。",
    relatedLaw: "《消费者权益保护法》第五十五条 · 经营者提供商品有欺诈行为的，应当增加赔偿其受到的损失，增加赔偿的金额为价款的三倍。",
  },
];


export default function Comics() {
  const [readingStory, setReadingStory] = useState<ComicStory | null>(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [xpAnim, setXpAnim] = useState(false);
  const rewardedRef = useRef<Set<string>>(new Set(JSON.parse(localStorage.getItem("comic_read") ?? "[]")));
  const { toast } = useToast();

  function markRead(storyId: string) {
    if (rewardedRef.current.has(storyId)) return;
    rewardedRef.current.add(storyId);
    localStorage.setItem("comic_read", JSON.stringify([...rewardedRef.current]));
    toast("阅读完成，+10 XP", "success");
    setXpAnim(true);
    setTimeout(() => setXpAnim(false), 2000);
    apiFetch("/api/student/comic-read", { method: "POST", body: JSON.stringify({ storyId }) }).catch(() => {});
  }

  function openStory(story: ComicStory) {
    setReadingStory(story);
    setCurrentPanel(0);
  }

  function closeReader() {
    setReadingStory(null);
    setCurrentPanel(0);
  }

  function goNext() {
    if (!readingStory) return;
    if (currentPanel < readingStory.panels.length - 1) {
      setCurrentPanel((p) => p + 1);
    }
  }

  function goPrev() {
    if (currentPanel > 0) {
      setCurrentPanel((p) => p - 1);
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!readingStory) return;
      if (e.key === "ArrowRight") {
        if (currentPanel < readingStory.panels.length - 1) goNext();
        else if (currentPanel === readingStory.panels.length - 1) {
          setCurrentPanel(readingStory.panels.length);
          markRead(readingStory.id);
        }
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "Escape") {
        closeReader();
      }
    },
    [readingStory, currentPanel],
  );

  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!readingStory) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) < 50) return;
      if (diff < 0) {
        if (currentPanel < readingStory.panels.length - 1) goNext();
        else if (currentPanel === readingStory.panels.length - 1) {
          setCurrentPanel(readingStory.panels.length);
          markRead(readingStory.id);
        }
      } else {
        goPrev();
      }
    },
    [readingStory, currentPanel],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="grid gap-5">
      <BannerCarousel
        slides={[
          { src: '/images/banners/comics/法律23.jpg', alt: '漫画学法' },
        ]}
      />

      {/* Info bar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 backdrop-blur-sm px-5 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-sm shadow-amber-100">
            <BookOpen className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-sm font-extrabold text-zinc-900">漫画学法</div>
            <div className="text-xs text-zinc-500">看漫画故事，学法律知识，做知法守法的好少年</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {placeholderComics.length} 个故事连载中
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700">
            <Eye className="h-3.5 w-3.5 text-amber-500" />
            真实案例改编
          </div>
        </div>
      </div>

      {/* Comic Gallery */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderComics.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => openStory(story)}
            className="group rounded-3xl border border-zinc-200 bg-white overflow-hidden text-left transition-all hover:shadow-lg hover:border-zinc-300 hover:-translate-y-0.5"
          >
            {/* Cover */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center overflow-hidden">
              <img
                src={story.cover}
                alt={story.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <Tag color={story.tagColor}>{story.topic}</Tag>
                {rewardedRef.current.has(story.id) && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
                    <CheckCircle2 className="h-3 w-3" />
                    已读
                  </span>
                )}
              </div>
              <div className="absolute bottom-3 right-3 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
                {story.panels.length} 页
              </div>
              {!rewardedRef.current.has(story.id) && (
                <div className="absolute bottom-3 left-3 rounded-full bg-amber-500/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  +10 XP
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="text-base font-extrabold text-zinc-900 group-hover:text-[var(--p-primary)] transition-colors">
                {story.title}
              </div>
              <div className="mt-1 text-sm text-zinc-500 line-clamp-2">
                {story.description}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover:text-zinc-500 transition-colors">
                <BookOpen className="h-3.5 w-3.5" />
                点击阅读
                <ChevronRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Coming Soon placeholder if no comics */}
      {placeholderComics.length === 0 && (
        <Card className="p-8 text-center">
          <span className="text-5xl">📖</span>
          <div className="mt-3 text-base font-extrabold text-zinc-900">漫画正在制作中</div>
          <div className="mt-1 text-sm text-zinc-500">敬请期待精彩的法律漫画故事</div>
        </Card>
      )}

      {/* Comic Reader Modal */}
      {readingStory && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* XP Reward Animation Overlay */}
            {xpAnim && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-black/20 backdrop-blur-[2px] pointer-events-none">
                <div className="animate-[xpPop_2s_ease-out_forwards] text-center">
                  <div className="text-5xl mb-2">🎉</div>
                  <div className="text-3xl font-black text-white drop-shadow-lg">+10 XP</div>
                  <div className="mt-1 text-sm font-bold text-white/80">阅读完成！</div>
                </div>
              </div>
            )}
            {/* Reader Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{readingStory.emoji}</span>
                <span className="text-sm font-extrabold text-zinc-900 truncate">{readingStory.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-zinc-400">
                  {currentPanel < readingStory.panels.length
                    ? `${currentPanel + 1} / ${readingStory.panels.length}`
                    : "法律小课堂"}
                </span>
                <button
                  type="button"
                  onClick={closeReader}
                  className="grid h-7 w-7 place-items-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Reader Body */}
            <div className="flex-1 overflow-y-auto">
              {currentPanel < readingStory.panels.length ? (
                <div className="p-4 grid gap-3">
                  {/* Panel Image */}
                  <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-50 aspect-[4/3] flex items-center justify-center">
                    <img
                      src={readingStory.panels[currentPanel].image}
                      alt={readingStory.panels[currentPanel].caption ?? ""}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Caption */}
                  {readingStory.panels[currentPanel].caption && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
                      {readingStory.panels[currentPanel].caption}
                    </div>
                  )}
                </div>
              ) : (
                /* Law Tip Summary (shown after last panel) */
                <div className="p-4 grid gap-3">
                  {rewardedRef.current.has(readingStory.id) && (
                    <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-4 py-3 flex items-center gap-2.5">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <div className="text-sm font-extrabold text-amber-800">阅读完成！获得 10 XP</div>
                        <div className="text-xs text-amber-600">继续阅读其他漫画可获取更多经验</div>
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-5">
                    <div className="flex items-center gap-2 text-base font-extrabold text-green-800">
                      <Lightbulb className="h-5 w-5 text-green-600" />
                      法律小课堂
                    </div>
                    <div className="mt-3 text-sm font-semibold text-green-900 leading-relaxed">
                      {readingStory.lawTip}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 p-5">
                    <div className="flex items-center gap-2 text-base font-extrabold text-blue-800">
                      <Scale className="h-5 w-5 text-blue-600" />
                      相关法律
                    </div>
                    <div className="mt-3 text-sm font-semibold text-blue-900 leading-relaxed">
                      {readingStory.relatedLaw}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeReader}
                    className="w-full rounded-2xl bg-zinc-100 hover:bg-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 transition-colors"
                  >
                    返回列表
                  </button>
                </div>
              )}
            </div>

            {/* Reader Footer - Navigation */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 shrink-0 bg-zinc-50/50">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentPanel === 0}
                className={clsx(
                  "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  currentPanel === 0
                    ? "text-zinc-300 cursor-not-allowed"
                    : "text-zinc-700 hover:bg-zinc-200",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </button>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {readingStory.panels.map((_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "h-1.5 rounded-full transition-all",
                      i === currentPanel
                        ? "w-5 bg-[var(--p-primary)]"
                        : i < currentPanel
                        ? "w-1.5 bg-[var(--p-primary)]/40"
                        : "w-1.5 bg-zinc-200",
                    )}
                  />
                ))}
                {/* Extra dot for law tip page */}
                <div
                  className={clsx(
                    "h-1.5 rounded-full transition-all",
                    currentPanel >= readingStory.panels.length
                      ? "w-5 bg-green-500"
                      : "w-1.5 bg-zinc-200",
                  )}
                />
              </div>

              <button
                type="button"
                onClick={currentPanel < readingStory.panels.length - 1 ? goNext : () => {
                  setCurrentPanel(readingStory.panels.length);
                  markRead(readingStory.id);
                }}
                className={clsx(
                  "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  currentPanel >= readingStory.panels.length
                    ? "text-zinc-300 cursor-not-allowed"
                    : "bg-[var(--p-primary)] text-white hover:opacity-90 shadow-sm",
                )}
              >
                {currentPanel === readingStory.panels.length - 1 ? "看解析" : "下一页"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
