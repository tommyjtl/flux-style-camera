import { readFile } from "node:fs/promises";
import sharp from "sharp";
import {
  computeInputResizePlan,
  computeOutputDimensions,
  mimeTypeForPath,
} from "./image";
import type { ImageCompressionConfig } from "../types";

export interface ProcessedInputImage {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
  sourceWidth: number;
  sourceHeight: number;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
}

export async function processInputImage(
  inputBuffer: Buffer,
  config: ImageCompressionConfig,
): Promise<ProcessedInputImage> {
  const metadata = await sharp(inputBuffer).metadata();
  const sourceWidth = metadata.width;
  const sourceHeight = metadata.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Unable to read image dimensions");
  }

  const resizePlan = computeInputResizePlan(sourceWidth, sourceHeight, config);
  const outputDimensions = computeOutputDimensions(sourceWidth, sourceHeight);

  let quality = config.quality;
  let buffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: resizePlan.width,
      height: resizePlan.height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (buffer.byteLength > config.maxBytes && quality > 40) {
    quality -= 10;
    buffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: resizePlan.width,
        height: resizePlan.height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  if (buffer.byteLength > config.maxBytes) {
    let width = resizePlan.width;
    let height = resizePlan.height;

    while (buffer.byteLength > config.maxBytes && width > 256 && height > 256) {
      width = Math.floor(width * 0.85);
      height = Math.floor(height * 0.85);
      buffer = await sharp(inputBuffer)
        .rotate()
        .resize({ width, height, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: Math.max(quality, 60), mozjpeg: true })
        .toBuffer();
    }
  }

  const processedMeta = await sharp(buffer).metadata();
  const width = processedMeta.width ?? resizePlan.width;
  const height = processedMeta.height ?? resizePlan.height;

  return {
    buffer,
    width,
    height,
    mimeType: "image/jpeg",
    sourceWidth,
    sourceHeight,
    aspectRatio: sourceWidth / sourceHeight,
    outputWidth: outputDimensions.width,
    outputHeight: outputDimensions.height,
  };
}

export async function readImageAsDataUri(filePath: string): Promise<{ dataUri: string; mimeType: string }> {
  const mimeType = mimeTypeForPath(filePath);
  const buffer = await readFile(filePath);
  return {
    mimeType,
    dataUri: `data:${mimeType};base64,${buffer.toString("base64")}`,
  };
}

export { computeOutputDimensions, computeInputResizePlan };
