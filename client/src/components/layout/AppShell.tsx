import type { ReactNode } from "react";
import { RiArrowLeftLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PAGE_INSET_X = "px-6";

interface AppShellProps {
  children: ReactNode;
  footer?: ReactNode;
  centerMain?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  headerRight?: ReactNode;
  headerCaption?: ReactNode;
}

export function AppShell({
  children,
  footer,
  centerMain = true,
  showBackButton,
  onBack,
  headerRight,
  headerCaption,
}: AppShellProps) {
  return (
    <div className="mx-auto flex h-svh w-full max-w-lg flex-col overflow-hidden bg-background">
      <header
        className={`sticky top-0 z-40 shrink-0 bg-background pt-6 pb-4 ${PAGE_INSET_X}`}
      >
        <div className="relative isolate px-12">
          {showBackButton ? (
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="absolute top-0 left-0 z-50 shadow-sm"
              onClick={onBack}
              aria-label="Back to camera"
            >
              <RiArrowLeftLine className="size-5" />
            </Button>
          ) : null}

          {headerRight ? (
            <div className="absolute top-0 right-0 z-50">{headerRight}</div>
          ) : null}

          <div className="relative z-30 text-center">
            <h1 className="font-heading text-[1.65rem] font-bold tracking-[0.14em] text-foreground uppercase">
              Fluxoid
            </h1>
            {headerCaption ? (
              <p className="mt-2 text-sm text-muted-foreground">{headerCaption}</p>
            ) : null}
          </div>
        </div>
      </header>

      <main
        className={cn(
          "relative z-0 flex min-h-0 flex-1 flex-col items-center overflow-y-auto",
          PAGE_INSET_X,
          centerMain ? "justify-center" : "justify-start pt-3 pb-6",
          footer ? "pb-2" : "pb-6 pt-3",
        )}
      >
        {children}
      </main>

      {footer ? (
        <footer
          className={`sticky bottom-0 z-40 shrink-0 bg-background pt-4 pb-6 ${PAGE_INSET_X}`}
        >
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
