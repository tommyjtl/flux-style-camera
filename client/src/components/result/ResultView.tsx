import { useEffect, useRef, useState } from "react";
import { PolaroidFrame } from "@/components/layout/PolaroidFrame";
import { PhotoStage } from "@/components/layout/PhotoStage";
import { formatPrintDate } from "@/lib/format-date";

interface ResultViewProps {
  imageUrl: string;
  aspectRatio: number;
  createdAt: string;
}

export function ResultView({ imageUrl, aspectRatio, createdAt }: ResultViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      setLoaded(true);
      requestAnimationFrame(() => {
        setVisible(true);
        setSettled(true);
      });
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return (
    <PhotoStage>
      <PolaroidFrame
        aspectRatio={aspectRatio}
        caption={formatPrintDate(createdAt)}
        settled={settled}
      >
        <canvas
          ref={canvasRef}
          className="size-full object-cover transition-opacity duration-1000 ease-out"
          style={{ opacity: visible && loaded ? 1 : 0 }}
        />
        {!loaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-sm text-muted-foreground">
            Revealing…
          </div>
        ) : null}
      </PolaroidFrame>
    </PhotoStage>
  );
}
