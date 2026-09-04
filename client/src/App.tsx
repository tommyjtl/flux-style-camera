import { AppShell } from "@/components/layout/AppShell";
import { AppErrorBanner } from "@/components/app/AppErrorBanner";
import { AppFooter } from "@/components/app/AppFooter";
import { AppHeaderActions } from "@/components/app/AppHeaderActions";
import { CaptureFlow } from "@/components/app/CaptureFlow";
import { useAppLayout } from "@/components/app/useAppLayout";
import { useCameraSession } from "@/hooks/useCameraSession";
import { useCaptureFlow } from "@/hooks/useCaptureFlow";

export function App() {
  const flow = useCaptureFlow();
  const layout = useAppLayout(flow);

  const camera = useCameraSession({
    enabled: layout.showViewfinder,
    onCapture: flow.handleCapture,
    busy: flow.busy,
    captureDisabled: flow.remainingExposures <= 0,
  });

  const onBack = () => {
    flow.backToCamera();
  };

  const headerCaption =
    flow.tab === "camera"
      ? `${flow.remainingExposures} exposures left on this roll`
      : undefined;

  return (
    <AppShell
      centerMain={flow.tab !== "gallery"}
      showBackButton={layout.showBackButton}
      onBack={onBack}
      headerCaption={headerCaption}
      headerRight={<AppHeaderActions flow={flow} layout={layout} />}
      footer={<AppFooter flow={flow} layout={layout} camera={camera} />}
    >
      {flow.error ? (
        <AppErrorBanner message={flow.error} onDismiss={flow.dismissError} />
      ) : null}

      <CaptureFlow
        tab={flow.tab}
        stage={flow.stage}
        pendingCapture={flow.pendingCapture}
        activePrint={flow.activePrint}
        remainingExposures={flow.remainingExposures}
        outputUrl={flow.outputUrl}
        handleGallerySelect={flow.handleGallerySelect}
        handleDevelopingComplete={flow.handleDevelopingComplete}
        handleDevelopingFailed={flow.handleDevelopingFailed}
        handleDevelopingCancelled={flow.handleDevelopingCancelled}
        handleCancelAvailableChange={flow.handleCancelAvailableChange}
        developAbort={flow.developAbort}
        rollVersion={flow.rollVersion}
        camera={camera}
        showViewfinder={layout.showViewfinder}
      />
    </AppShell>
  );
}

export default App;
