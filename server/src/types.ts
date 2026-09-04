export type CameraFacing = "front" | "back";

export interface StylePreset {
  id: string;
  name: string;
  prompt: string;
  referenceImagePath: string | null;
  model: string;
  guidanceScale: number;
  steps: number;
  seed: number | null;
  enabled: boolean;
}

export interface TransformResult {
  outputBuffer: Buffer;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  presetId: string;
}

export interface ImageCompressionConfig {
  minWidth: number;
  minHeight: number;
  maxBytes: number;
  maxLongEdge: number;
  quality: number;
}

export interface ModularImageOptions {
  width: number;
  height: number;
  steps: number;
  guidanceScale: number;
  seed: number;
}

export interface ModularTransformInput {
  captureImageBase64: string;
  captureMimeType: string;
  prompt: string;
  referenceImageBase64?: string;
  referenceMimeType?: string;
  model: string;
  imageOptions: ModularImageOptions;
}

export interface ModularTransformResult {
  imageData: Buffer;
  requestId: string | null;
}

export type FetchFn = typeof fetch;
