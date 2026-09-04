import { RiArrowLeftLine, RiCameraSwitchLine, RiCloseLine, RiDownloadLine, RiGalleryLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { CircleActionButton } from "@/components/camera/CircleActionButton";

type CaptureFooterProps =
  | {
      mode: "camera";
      ready: boolean;
      busy?: boolean;
      canCapture?: boolean;
      onFlipCamera: () => void;
      onCapture: () => void;
      onOpenGallery: () => void;
    }
  | {
      mode: "developing";
      canCancel: boolean;
      onCancel: () => void;
    }
  | {
      mode: "download";
      onBack: () => void;
      onDownload: () => void;
      onOpenGallery: () => void;
      disabled?: boolean;
    };

export function CaptureFooter(props: CaptureFooterProps) {
  if (props.mode === "developing") {
    return (
      <div className="flex w-full flex-col items-center">
        <div className="flex w-full max-w-[min(100%,320px)] items-center justify-center">
          {props.canCancel ? (
            <CircleActionButton
              onClick={props.onCancel}
              ariaLabel="Cancel development"
              innerClassName="bg-neutral-300 text-neutral-600"
            >
              <RiCloseLine className="size-7" />
            </CircleActionButton>
          ) : (
            <CircleActionButton
              onClick={() => undefined}
              disabled
              ariaLabel="Developing photo"
              innerClassName="bg-neutral-200"
            >
              <span className="size-6 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
            </CircleActionButton>
          )}
        </div>
      </div>
    );
  }

  if (props.mode === "download") {
    return (
      <div className="flex w-full flex-col items-center">
        <div className="flex w-full max-w-[min(100%,320px)] items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="shadow-sm"
            onClick={props.onBack}
            aria-label="Back to camera"
          >
            <RiArrowLeftLine className="size-5" />
          </Button>

          <CircleActionButton
            onClick={props.onDownload}
            disabled={props.disabled}
            ariaLabel="Save to device"
            innerClassName="bg-stone-800 text-stone-50"
          >
            <RiDownloadLine className="size-7" />
          </CircleActionButton>

          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="shadow-sm"
            onClick={props.onOpenGallery}
            aria-label="Open gallery"
          >
            <RiGalleryLine className="size-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full max-w-[min(100%,320px)] items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="shadow-sm"
          onClick={props.onFlipCamera}
          disabled={props.busy || !props.ready}
          aria-label="Flip camera"
        >
          <RiCameraSwitchLine className="size-5" />
        </Button>

        <CircleActionButton
          onClick={props.onCapture}
          disabled={props.busy || !props.ready || props.canCapture === false}
          ariaLabel="Capture photo"
          innerClassName="bg-red-500"
        >
          <span className="sr-only">Capture</span>
        </CircleActionButton>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="shadow-sm"
          onClick={props.onOpenGallery}
          disabled={props.busy}
          aria-label="Open gallery"
        >
          <RiGalleryLine className="size-5" />
        </Button>
      </div>
    </div>
  );
}
