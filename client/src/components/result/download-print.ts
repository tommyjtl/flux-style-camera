/** Layout ratios matched to PolaroidFrame (320px outer / 296px image width). */
const LAYOUT = {
  refImageWidth: 296,
  padSide: 12,
  padTop: 12,
  captionGap: 12,
  captionAreaHeight: 28,
  padBottom: 32,
  captionFontSize: 20,
  captionColor: "#404040",
} as const;

function scaleLayout(imageWidth: number) {
  const ratio = imageWidth / LAYOUT.refImageWidth;
  return {
    padSide: Math.round(LAYOUT.padSide * ratio),
    padTop: Math.round(LAYOUT.padTop * ratio),
    captionGap: Math.round(LAYOUT.captionGap * ratio),
    captionAreaHeight: Math.round(LAYOUT.captionAreaHeight * ratio),
    padBottom: Math.round(LAYOUT.padBottom * ratio),
    captionFontSize: Math.max(12, Math.round(LAYOUT.captionFontSize * ratio)),
  };
}

async function ensureCaptionFont(sizePx: number): Promise<void> {
  if (!document.fonts) return;
  await document.fonts.load(`500 ${sizePx}px Caveat`);
  await document.fonts.ready;
}

export interface PolaroidPrintOptions {
  imageBlob: Blob;
  caption?: string;
}

/** Renders the white-border photoprint with optional handwritten-style caption. */
export async function composePolaroidPrint({
  imageBlob,
  caption,
}: PolaroidPrintOptions): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(imageBlob);
  try {
    const imageWidth = bitmap.width;
    const imageHeight = bitmap.height;

    const layout = scaleLayout(imageWidth);
    const canvasWidth = imageWidth + layout.padSide * 2;
    const canvasHeight =
      layout.padTop +
      imageHeight +
      layout.captionGap +
      layout.captionAreaHeight +
      layout.padBottom;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create print canvas");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.drawImage(bitmap, layout.padSide, layout.padTop, imageWidth, imageHeight);

    if (caption) {
      await ensureCaptionFont(layout.captionFontSize);
      ctx.fillStyle = LAYOUT.captionColor;
      ctx.font = `500 ${layout.captionFontSize}px Caveat, cursive`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const captionY =
        layout.padTop +
        imageHeight +
        layout.captionGap +
        layout.captionAreaHeight / 2;
      ctx.fillText(caption, canvasWidth / 2, captionY);
    }

    return canvas;
  } finally {
    bitmap.close();
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadPolaroidPrint(options: PolaroidPrintOptions): Promise<void> {
  const canvas = await composePolaroidPrint(options);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new Error("Failed to export print");
  }
  triggerDownload(blob, `fluxoid-${Date.now()}.png`);
}

/** @deprecated Use downloadPolaroidPrint for framed exports. */
export function downloadPrintBlob(blob: Blob): void {
  triggerDownload(blob, `fluxoid-${Date.now()}.png`);
}
