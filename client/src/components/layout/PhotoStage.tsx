import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PhotoStageProps {
  children: ReactNode;
  className?: string;
}

/** Centers a polaroid between header and footer without over-stretching on tall screens. */
export function PhotoStage({ children, className }: PhotoStageProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 items-center justify-center",
        className,
      )}
    >
      <div className="w-full max-w-[min(100%,320px)] max-h-[calc(100svh-14rem)] min-h-0 shrink">
        {children}
      </div>
    </div>
  );
}
