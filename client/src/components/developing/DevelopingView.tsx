import { useEffect, useMemo, useRef, useState } from "react";
import { Water } from "@paper-design/shaders-react";
import { PolaroidFrame } from "@/components/layout/PolaroidFrame";
import { PhotoStage } from "@/components/layout/PhotoStage";
import { transformPhoto } from "@/lib/api";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { cn } from "@/lib/utils";
import type { CameraFacing, TransformResponse } from "@/types";

const MIN_DEVELOP_MS = 1500;
const MORPH_MS = 1000;
/** Show cancel only if the transform request is still pending after this long. */
const CANCEL_AFTER_MS = 10_000;

interface DevelopingViewProps {
  photo: Blob;
  camera: CameraFacing;
  aspectRatio: number;
  signal: AbortSignal;
  onComplete: (result: TransformResponse) => void;
  onCancelled: () => void;
  onFailed: (message: string) => void;
  onCancelAvailableChange: (available: boolean) => void;
}

export function DevelopingView({
  photo,
  camera,
  aspectRatio,
  signal,
  onComplete,
  onCancelled,
  onFailed,
  onCancelAvailableChange,
}: DevelopingViewProps) {
  const previewUrl = useObjectUrl(photo);
  const startedAt = useMemo(() => Date.now(), []);
  const morphStartedRef = useRef(false);
  const completedRef = useRef(false);
  const morphTimerRef = useRef<number | null>(null);
  const developTimerRef = useRef<number | null>(null);
  const cancelTimerRef = useRef<number | null>(null);
  const requestPendingRef = useRef(true);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const setCancelAvailable = (available: boolean) => {
      if (!cancelled) {
        onCancelAvailableChange(available);
      }
    };

    const clearTimers = () => {
      if (cancelTimerRef.current !== null) {
        window.clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }
      if (developTimerRef.current !== null) {
        window.clearTimeout(developTimerRef.current);
        developTimerRef.current = null;
      }
      if (morphTimerRef.current !== null) {
        window.clearTimeout(morphTimerRef.current);
        morphTimerRef.current = null;
      }
    };

    const endRequestPending = () => {
      requestPendingRef.current = false;
      setCancelAvailable(false);
    };

    cancelTimerRef.current = window.setTimeout(() => {
      if (requestPendingRef.current) {
        setCancelAvailable(true);
      }
    }, CANCEL_AFTER_MS);

    const handleAbort = () => {
      cancelled = true;
      endRequestPending();
      clearTimers();
      onCancelled();
    };

    if (signal.aborted) {
      handleAbort();
      return clearTimers;
    }

    signal.addEventListener("abort", handleAbort);

    void transformPhoto(photo, camera, signal)
      .then((result) => {
        if (cancelled || signal.aborted || morphStartedRef.current) return;

        endRequestPending();

        const beginMorph = () => {
          if (cancelled || signal.aborted || morphStartedRef.current) return;
          morphStartedRef.current = true;
          const url = URL.createObjectURL(result.outputBlob);
          setResultUrl(url);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (cancelled || signal.aborted) return;
              setRevealing(true);
            });
          });

          morphTimerRef.current = window.setTimeout(() => {
            if (cancelled || signal.aborted || completedRef.current) return;
            completedRef.current = true;
            onComplete(result);
          }, MORPH_MS);
        };

        const elapsed = Date.now() - startedAt;
        developTimerRef.current = window.setTimeout(
          beginMorph,
          Math.max(0, MIN_DEVELOP_MS - elapsed),
        );
      })
      .catch((err) => {
        if (cancelled || signal.aborted) return;
        endRequestPending();
        if (err instanceof DOMException && err.name === "AbortError") {
          onCancelled();
          return;
        }
        const message = err instanceof Error ? err.message : "Transform failed";
        onFailed(message);
      });

    return () => {
      cancelled = true;
      requestPendingRef.current = false;
      setCancelAvailable(false);
      signal.removeEventListener("abort", handleAbort);
      clearTimers();
    };
  }, [
    photo,
    camera,
    onComplete,
    onCancelled,
    onCancelAvailableChange,
    onFailed,
    signal,
    startedAt,
  ]);

  useEffect(() => {
    return () => {
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

  return (
    <PhotoStage>
      <PolaroidFrame aspectRatio={aspectRatio}>
        {previewUrl ? (
          <Water
            key={previewUrl}
            image={previewUrl}
            colorBack="#8f8f8f"
            colorHighlight="#ffffff"
            highlights={0.07}
            layering={0.5}
            edges={0.8}
            waves={0.3}
            caustic={0.1}
            size={1}
            speed={1}
            scale={0.8}
            fit="contain"
            className={cn(
              "absolute inset-0 size-full transition-opacity duration-1000 ease-out",
              revealing ? "pointer-events-none opacity-0" : "opacity-100",
            )}
            style={{ width: "100%", height: "100%" }}
          />
        ) : null}

        {resultUrl ? (
          <img
            src={resultUrl}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-out",
              revealing ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}

        {!revealing ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium tracking-wide text-white/95 uppercase">
              Developing
            </span>
          </div>
        ) : null}
      </PolaroidFrame>
    </PhotoStage>
  );
}
