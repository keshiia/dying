import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent" | "warning";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center font-bold transition-all active:scale-[0.96] disabled:opacity-50 disabled:Claude Code-not-allowed select-none";
  const sizes = {
    sm: "h-9 px-4 text-sm rounded-2xl",
    md: "h-11 px-5 text-sm rounded-2xl",
    lg: "h-13 px-7 text-base rounded-2xl",
  }[size];
  const variants = {
    primary:
      "bg-[var(--p-primary)] text-white shadow-md shadow-blue-200 hover:bg-[var(--p-primary-dark)] hover:shadow-blue-300",
    secondary:
      "bg-white text-zinc-800 border-2 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm",
    ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
    danger:
      "bg-[var(--p-danger)] text-white shadow-md shadow-red-200 hover:brightness-95",
    accent:
      "bg-[var(--p-accent)] text-white shadow-md shadow-blue-200 hover:bg-[var(--p-accent-dark)]",
    warning:
      "bg-[var(--p-warning)] text-white shadow-md shadow-yellow-200 hover:brightness-95",
  }[variant];

  return (
    <button className={clsx(base, sizes, variants, className)} {...props} />
  );
}
