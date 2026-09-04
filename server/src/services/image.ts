import type { ImageCompressionConfig } from "../types";

const OUTPUT_LONG_EDGE = 1024;
const DIMENSION_SNAP = 8;

export interface OutputDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface InputResizePlan {
  width: number;
  height: number;
  scale: number;
}

export function snapDimension(value: number): number {
  const snapped = Math.round(value / DIMENSION_SNAP) * DIMENSION_SNAP;
  return Math.max(DIMENSION_SNAP, snapped);
}

export function computeOutputDimensions(
  sourceWidth: number,
  sourceHeight: number,
): OutputDimensions {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Source dimensions must be positive");
  }

  const aspectRatio = sourceWidth / sourceHeight;

  let width: number;
  let height: number;

  if (sourceWidth >= sourceHeight) {
    width = OUTPUT_LONG_EDGE;
    height = OUTPUT_LONG_EDGE / aspectRatio;
  } else {
    height = OUTPUT_LONG_EDGE;
    width = OUTPUT_LONG_EDGE * aspectRatio;
  }

  return {
    width: snapDimension(width),
    height: snapDimension(height),
    aspectRatio,
  };
}

export function computeInputResizePlan(
  sourceWidth: number,
  sourceHeight: number,
  config: ImageCompressionConfig,
): InputResizePlan {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Source dimensions must be positive");
  }

  let scale = 1;
  const longEdge = Math.max(sourceWidth, sourceHeight);

  if (longEdge > config.maxLongEdge) {
    scale = config.maxLongEdge / longEdge;
  }

  let width = Math.max(1, Math.floor(sourceWidth * scale));
  let height = Math.max(1, Math.floor(sourceHeight * scale));

  // Never upscale to satisfy minimum dimensions.
  if (width < config.minWidth && height < config.minHeight) {
    return { width: sourceWidth, height: sourceHeight, scale: 1 };
  }

  return { width, height, scale };
}

export function mimeTypeForPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(mimeType);
}
