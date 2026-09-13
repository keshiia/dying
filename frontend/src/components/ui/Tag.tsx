import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  color?: "zinc" | "green" | "blue" | "purple" | "orange" | "red" | "yellow";
};

export default function Tag({ className, color = "zinc", ...props }: Props) {
  const colors = {
    zinc: "bg-zinc-100 text-zinc-700",
    // green 与 blue 原先都写成了同一个 slate 灰，与其它 5 个颜色的写法不一致，
    // 调用方按语义传 green / blue 时实际看不出区别。
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
  }[color];

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        colors,
        className,
      )}
      {...props}
    />
  );
}
