import type { RefObject } from "react";
import { PolaroidFrame } from "@/components/layout/PolaroidFrame";
import { PhotoStage } from "@/components/layout/PhotoStage";
import { cn } from "@/lib/utils";

const VIEWFINDER_ASPECT_RATIO = 1;

interface CameraViewfinderProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  facing: "front" | "back";
  ready: boolean;
  error: string | null;
}

export function CameraViewfinder({
  videoRef,
  facing,
  ready,
  error,
}: CameraViewfinderProps) {
  return (
    <PhotoStage>
      <PolaroidFrame aspectRatio={VIEWFINDER_ASPECT_RATIO}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={cn(
            "size-full object-cover",
            facing === "front" && "scale-x-[-1]",
          )}
        />
        {!ready && !error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-sm text-muted-foreground">
            Starting camera…
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 p-4 text-center text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </PolaroidFrame>
    </PhotoStage>
  );
}
