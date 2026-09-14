import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle2, ChevronRight, Eye, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import BannerCarousel from "@/components/ui/BannerCarousel";
import { apiFetch } from "@/utils/api";
import { useAuthStore } from "@/stores/auth";
import { comicStories } from "@/data/comics";
import { readComicIds } from "@/utils/comicReads";

/**
 * 漫画列表页。
 *
 * 阅读器已经搬到 `/play/comics/:storyId`（独立路由、独立整页），
 * 这里的职责只剩下「列出故事 + 显示已读状态 + 跳转」。
 */
export default function Comics() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    apiFetch<{ success: true; storyIds: string[] }>("/api/student/comic-reads")
      .then((res) => setReadSet(new Set(res.storyIds)))
      .catch(() => {
        // 接口不可用时退回本地缓存，至少不把已读显示成未读
        setReadSet(new Set(readComicIds(userId)));
      });
  }, [userId]);

  return (
    <div className="grid gap-5">
      <BannerCarousel
        slides={[{ src: "/images/banners/comics/banner-1.webp", alt: "漫画学法" }]}
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
            {comicStories.length} 个故事连载中
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700">
            <Eye className="h-3.5 w-3.5 text-amber-500" />
            真实案例改编
          </div>
        </div>
      </div>

      {/* Comic Gallery */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comicStories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => navigate(`/play/comics/${story.id}`)}
            className="group rounded-3xl border border-zinc-200 bg-white overflow-hidden text-left transition-all hover:shadow-lg hover:border-zinc-300 hover:-translate-y-0.5"
          >
            {/* Cover */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center overflow-hidden">
              <img src={story.cover} alt={story.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <Tag color={story.tagColor}>{story.topicLabel}</Tag>
                {readSet.has(story.id) && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
                    <CheckCircle2 className="h-3 w-3" />
                    已读
                  </span>
                )}
              </div>
              <div className="absolute bottom-3 right-3 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
                {story.panels.length} 页
              </div>
              {!readSet.has(story.id) && (
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
              <div className="mt-1 text-sm text-zinc-500 line-clamp-2">{story.description}</div>
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover:text-zinc-500 transition-colors">
                <BookOpen className="h-3.5 w-3.5" />
                点击阅读
                <ChevronRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {comicStories.length === 0 && (
        <Card className="p-8 text-center">
          <span className="text-5xl">📖</span>
          <div className="mt-3 text-base font-extrabold text-zinc-900">漫画正在制作中</div>
          <div className="mt-1 text-sm text-zinc-500">敬请期待精彩的法律漫画故事</div>
        </Card>
      )}
    </div>
  );
}
