import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PolaroidFrameProps {
  children: ReactNode;
  /** Handwritten-style date on finished prints; omit for a blank chin. */
  caption?: string;
  aspectRatio?: number;
  className?: string;
  settled?: boolean;
  compact?: boolean;
}

export function PolaroidFrame({
  children,
  caption,
  aspectRatio = 1,
  className,
  settled = false,
  compact = false,
}: PolaroidFrameProps) {
  return (
    <div className={cn("w-full max-w-[min(100%,320px)]", className)}>
      <div
        className={cn(
          "flex w-full flex-col bg-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)]",
          compact ? "p-2 pb-5" : "p-3 pb-8",
          settled && "animate-polaroid-settle",
        )}
      >
        <div
          className="relative w-full overflow-hidden bg-neutral-100"
          style={{ aspectRatio: aspectRatio > 0 ? aspectRatio : 1 }}
        >
          <div className="absolute inset-0">{children}</div>
        </div>
        <div className={cn("flex min-h-[1.75rem] items-center justify-center", compact ? "mt-2" : "mt-3")}>
          {caption ? (
            <p
              className={cn(
                "font-caption leading-none text-neutral-700",
                compact ? "text-base" : "text-xl",
              )}
            >
              {caption}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
