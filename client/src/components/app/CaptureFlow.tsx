import { CameraViewfinder } from "@/components/camera/CameraViewfinder";
import { DevelopingView } from "@/components/developing/DevelopingView";
import { GalleryView } from "@/components/gallery/GalleryView";
import { ResultView } from "@/components/result/ResultView";
import type { useCameraSession } from "@/hooks/useCameraSession";
import type { useCaptureFlow } from "@/hooks/useCaptureFlow";

type CaptureFlowProps = Pick<
  ReturnType<typeof useCaptureFlow>,
  | "tab"
  | "stage"
  | "pendingCapture"
  | "activePrint"
  | "remainingExposures"
  | "outputUrl"
  | "handleGallerySelect"
  | "handleDevelopingComplete"
  | "handleDevelopingFailed"
  | "handleDevelopingCancelled"
  | "handleCancelAvailableChange"
  | "developAbort"
  | "rollVersion"
> & {
  camera: ReturnType<typeof useCameraSession>;
  showViewfinder: boolean;
};

export function CaptureFlow({
  tab,
  stage,
  pendingCapture,
  activePrint,
  outputUrl,
  handleGallerySelect,
  handleDevelopingComplete,
  handleDevelopingFailed,
  handleDevelopingCancelled,
  handleCancelAvailableChange,
  developAbort,
  rollVersion,
  remainingExposures,
  camera,
  showViewfinder,
}: CaptureFlowProps) {
  const developSignal = developAbort?.signal;

  return (
    <>
      {tab === "gallery" && stage === "camera" ? (
        <GalleryView
          onSelect={handleGallerySelect}
          remainingExposures={remainingExposures}
          rollVersion={rollVersion}
        />
      ) : null}

      {showViewfinder ? (
        <CameraViewfinder
          videoRef={camera.videoRef}
          facing={camera.facing}
          ready={camera.ready}
          error={camera.error}
        />
      ) : null}

      {tab === "camera" && stage === "camera" && outputUrl && activePrint ? (
        <ResultView
          imageUrl={outputUrl}
          aspectRatio={activePrint.aspectRatio}
          createdAt={activePrint.createdAt}
        />
      ) : null}

      {stage === "developing" && pendingCapture && developSignal ? (
        <DevelopingView
          photo={pendingCapture.photo}
          camera={pendingCapture.camera}
          aspectRatio={pendingCapture.aspectRatio}
          signal={developSignal}
          onComplete={(result) => void handleDevelopingComplete(result)}
          onCancelled={handleDevelopingCancelled}
          onFailed={handleDevelopingFailed}
          onCancelAvailableChange={handleCancelAvailableChange}
        />
      ) : null}
    </>
  );
}
