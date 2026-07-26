import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  color?: "zinc" | "green" | "blue" | "purple" | "orange" | "red" | "yellow";
};

export default function Tag({ className, color = "zinc", ...props }: Props) {
  const colors = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "border border-slate-200/80 bg-slate-100 text-slate-600",
    blue: "border border-slate-200/80 bg-slate-100 text-slate-600",
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
