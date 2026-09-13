type Props = {
  /** 顶层路由（Shell 之外）用 fullscreen，Shell 内只需要撑起内容区 */
  fullscreen?: boolean;
};

export default function RouteFallback({ fullscreen = false }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        fullscreen
          ? "grid min-h-screen place-items-center"
          : "grid min-h-[60vh] place-items-center"
      }
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-zinc-200 border-t-sky-500" />
        {/* 原来只有一个转圈 div：长时间等待时用户既看不懂在等什么，
            读屏用户也收不到任何提示 */}
        <span className="text-sm text-zinc-500">加载中…</span>
      </div>
    </div>
  );
}
