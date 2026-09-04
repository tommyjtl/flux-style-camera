import { useCallback, useEffect, useRef, useState } from "react";

async function playVideo(video: HTMLVideoElement): Promise<void> {
  try {
    await video.play();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    throw error;
  }
}

interface UseCameraSessionOptions {
  enabled: boolean;
  onCapture: (
    photo: Blob,
    camera: "front" | "back",
    aspectRatio: number,
  ) => Promise<void>;
  busy?: boolean;
  captureDisabled?: boolean;
}

export function useCameraSession({
  enabled,
  onCapture,
  busy,
  captureDisabled,
}: UseCameraSessionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef(0);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      setError(null);
      return;
    }

    const session = ++sessionRef.current;
    let activeStream: MediaStream | null = null;

    async function start() {
      setError(null);
      setReady(false);

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing === "back" ? "environment" : "user",
            width: { ideal: 1920 },
            height: { ideal: 1920 },
          },
          audio: false,
        });

        if (session !== sessionRef.current) {
          activeStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = activeStream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = activeStream;
        await playVideo(video);

        if (session !== sessionRef.current) return;

        setReady(true);
      } catch (err) {
        if (session !== sessionRef.current) return;
        activeStream?.getTracks().forEach((track) => track.stop());

        setError(
          err instanceof Error
            ? err.message
            : "Camera permission is required to capture photos.",
        );
      }
    }

    void start();

    return () => {
      sessionRef.current += 1;
      activeStream?.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };
  }, [enabled, facing]);

  const flipCamera = useCallback(() => {
    setReady(false);
    setFacing((current) => (current === "back" ? "front" : "back"));
  }, []);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !ready || busy || captureDisabled) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const cropSize = Math.min(width, height);
    const sx = (width - cropSize) / 2;
    const sy = (height - cropSize) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facing === "front") {
      ctx.translate(cropSize, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );

    if (!blob) return;
    await onCapture(blob, facing, 1);
  }, [busy, captureDisabled, facing, onCapture, ready]);

  return {
    videoRef,
    facing,
    ready,
    error,
    flipCamera,
    capturePhoto,
  };
}
