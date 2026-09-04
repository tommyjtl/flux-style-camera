import { CaptureFooter } from "@/components/camera/CaptureFooter";
import { downloadPolaroidPrint } from "@/components/result/download-print";
import { formatPrintDate } from "@/lib/format-date";
import type { useCameraSession } from "@/hooks/useCameraSession";
import type { useCaptureFlow } from "@/hooks/useCaptureFlow";
import type { AppLayout } from "@/components/app/useAppLayout";

type CaptureFlow = ReturnType<typeof useCaptureFlow>;
type CameraSession = ReturnType<typeof useCameraSession>;

interface AppFooterProps {
  flow: CaptureFlow;
  layout: AppLayout;
  camera: CameraSession;
}

export function AppFooter({ flow, layout, camera }: AppFooterProps) {
  if (layout.showCameraFooter) {
    return (
      <CaptureFooter
        mode="camera"
        ready={camera.ready}
        busy={flow.busy}
        canCapture={flow.remainingExposures > 0}
        onFlipCamera={camera.flipCamera}
        onCapture={() => void camera.capturePhoto()}
        onOpenGallery={flow.openGallery}
      />
    );
  }

  if (layout.showDevelopingFooter) {
    return (
      <CaptureFooter
        mode="developing"
        canCancel={flow.canCancelDevelop}
        onCancel={flow.cancelDeveloping}
      />
    );
  }

  if (layout.showDownloadFooter) {
    return (
      <CaptureFooter
        mode="download"
        onBack={flow.backFromPrintView}
        onOpenGallery={flow.openGallery}
        onDownload={() => {
          if (!flow.activePrint) return;
          void downloadPolaroidPrint({
            imageBlob: flow.activePrint.outputBlob,
            caption: formatPrintDate(flow.activePrint.createdAt),
          });
        }}
      />
    );
  }

  return null;
}
