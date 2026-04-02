import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  glow?: "green" | "blue" | "purple" | "orange" | "none";
  hover?: boolean;
};

export default function Card({
  className,
  glow = "none",
  hover = false,
  ...props
}: Props) {
  const glowMap = {
    none: "",
    green: "shadow-[0_4px_24px_rgba(28,176,246,0.18)] border-blue-200",
    blue: "shadow-[0_4px_24px_rgba(28,176,246,0.18)] border-blue-200",
    purple: "shadow-[0_4px_24px_rgba(168,85,247,0.18)] border-purple-200",
    orange: "shadow-[0_4px_24px_rgba(249,115,22,0.18)] border-orange-200",
  }[glow];

  return (
    <div
      className={clsx(
        "rounded-3xl bg-white border border-zinc-100 shadow-sm",
        glowMap,
        hover &&
          "transition-all hover:shadow-md hover:-translate-y-0.5 Claude Code-pointer",
        className,
      )}
      {...props}
    />
  );
}
