import type { useCaptureFlow } from "@/hooks/useCaptureFlow";

type CaptureFlow = ReturnType<typeof useCaptureFlow>;

export interface AppLayout {
  showCameraFooter: boolean;
  showDevelopingFooter: boolean;
  showPrintView: boolean;
  showDownloadFooter: boolean;
  showViewfinder: boolean;
  showBackButton: boolean;
}

export function useAppLayout(flow: CaptureFlow): AppLayout {
  const showCameraFooter =
    flow.tab === "camera" && flow.stage === "camera" && !flow.outputUrl;

  const showDevelopingFooter = flow.tab === "camera" && flow.stage === "developing";

  const showPrintView = flow.tab === "camera" && flow.stage === "camera" && !!flow.outputUrl;

  return {
    showCameraFooter,
    showDevelopingFooter,
    showPrintView,
    showDownloadFooter: showPrintView,
    showViewfinder: showCameraFooter,
    showBackButton: flow.tab === "gallery",
  };
}
