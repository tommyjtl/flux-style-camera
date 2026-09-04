import { RiDeleteBinLine } from "@remixicon/react";
import { ClearRollDialog } from "@/components/gallery/ClearRollDialog";
import { Button } from "@/components/ui/button";
import type { useCaptureFlow } from "@/hooks/useCaptureFlow";
import type { AppLayout } from "@/components/app/useAppLayout";

type CaptureFlow = ReturnType<typeof useCaptureFlow>;

interface AppHeaderActionsProps {
  flow: CaptureFlow;
  layout: AppLayout;
}

export function AppHeaderActions({ flow, layout }: AppHeaderActionsProps) {
  if (flow.tab === "gallery" && flow.printCount > 0) {
    return (
      <ClearRollDialog
        printCount={flow.printCount}
        onConfirm={() => void flow.handleClearRoll()}
      />
    );
  }

  if (layout.showPrintView && flow.viewSource === "gallery") {
    return (
      <Button
        type="button"
        variant="destructive"
        size="icon-lg"
        className="shadow-sm"
        aria-label="Delete print"
        onClick={() => void flow.handleDeleteActivePrint()}
      >
        <RiDeleteBinLine className="size-5" />
      </Button>
    );
  }

  return null;
}
