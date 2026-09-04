import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CircleActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  innerClassName?: string;
  children: ReactNode;
}

export function CircleActionButton({
  onClick,
  disabled,
  ariaLabel,
  innerClassName,
  children,
}: CircleActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="relative size-[72px] rounded-full border-4 border-white bg-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
    >
      <span
        className={cn(
          "absolute inset-2 flex items-center justify-center rounded-full",
          innerClassName,
        )}
      >
        {children}
      </span>
    </button>
  );
}
