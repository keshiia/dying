type Props = {
  /** 顶层路由（Shell 之外）用 fullscreen，Shell 内只需要撑起内容区 */
  fullscreen?: boolean;
};

export default function RouteFallback({ fullscreen = false }: Props) {
  return (
    <div
      className={
        fullscreen
          ? "grid min-h-screen place-items-center"
          : "grid min-h-[60vh] place-items-center"
      }
    >
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-zinc-200 border-t-sky-500" />
    </div>
  );
}
