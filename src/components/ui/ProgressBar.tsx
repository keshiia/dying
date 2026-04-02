import { clsx } from "clsx";

type Props = {
  value: number;
  className?: string;
  color?: "green" | "blue" | "purple" | "orange";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
};

export default function ProgressBar({
  value,
  className,
  color = "green",
  showLabel = false,
  size = "md",
  animated = true,
}: Props) {
  const v = Math.max(0, Math.min(100, value));

  const heights = { sm: "h-2", md: "h-3", lg: "h-4" }[size];

  const fills = {
    green: "bg-gradient-to-r from-[#1cb0f6] to-[#57cbff]",
    blue: "bg-gradient-to-r from-[#1cb0f6] to-[#57cbff]",
    purple: "bg-gradient-to-r from-[#a855f7] to-[#c084fc]",
    orange: "bg-gradient-to-r from-[#f97316] to-[#fb923c]",
  }[color];

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div
        className={clsx(
          "flex-1 rounded-full bg-zinc-100 overflow-hidden",
          heights,
        )}
      >
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            fills,
            animated && "xp-bar-glow",
          )}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-bold text-zinc-600 w-8 text-right">
          {v}%
        </span>
      )}
    </div>
  );
}
