import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import Button from "./Button";

type Props = {
  open: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  hideClose?: boolean;
};

export default function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  className,
  hideClose,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 锁住背景滚动：否则在弹窗上滚动时，背后的页面会跟着滚，
  // 关掉弹窗后人已经不在原来的位置了。
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 焦点管理：打开时把焦点移进弹窗、关闭时归还给原来的元素、Tab 在弹窗内循环。
  // 没有这一层时，键盘用户按 Tab 会在背后的页面上游走 —— 视觉上在弹窗里，
  // 焦点却在别处，看不见自己在操作什么。
  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    const card = cardRef.current;
    card?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !card) return;
      const focusables = card.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === card)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // 归还焦点：元素可能已经不在文档里（例如触发它的按钮被卸载）
      const prev = prevFocusRef.current;
      if (prev && document.contains(prev)) prev.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "弹窗"}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={cardRef}
          tabIndex={-1}
          className={clsx(
            "animate-modal-in w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-zinc-100 outline-none",
            className,
          )}
        >
          {(title || !hideClose) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <div>
                <div className="text-base font-extrabold text-zinc-900">
                  {title ?? ""}
                </div>
                {subtitle && (
                  <div className="text-xs text-zinc-500 mt-0.5">{subtitle}</div>
                )}
              </div>
              {!hideClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <div className="p-6 overflow-auto max-h-[calc(92vh-72px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
