import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect } from "react";
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={clsx(
            "animate-bounce-in w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-zinc-100",
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
