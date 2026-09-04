import type { AppConfig } from "../config";
import { processInputImage, readImageAsDataUri } from "./image-processing";
import { imageOptionsFromPreset, ModularClient } from "./modular";
import { DEFAULT_PRESET_ID, loadDefaultPreset } from "./preset";
import type { CameraFacing, StylePreset, TransformResult } from "../types";

export interface TransformServiceDeps {
  config: AppConfig;
  modularClient: ModularClient;
  preset?: StylePreset;
}

export class TransformService {
  private readonly config: AppConfig;
  private readonly modularClient: ModularClient;
  private presetPromise: Promise<StylePreset>;

  constructor(deps: TransformServiceDeps) {
    this.config = deps.config;
    this.modularClient = deps.modularClient;
    this.presetPromise =
      deps.preset !== undefined
        ? Promise.resolve(deps.preset)
        : loadDefaultPreset(deps.config.dataDir);
  }

  async transform(params: {
    photoBuffer: Buffer;
    mimeType: string;
    camera: CameraFacing;
    presetId?: string;
  }): Promise<TransformResult> {
    const preset = await this.resolvePreset(params.presetId);
    const processed = await processInputImage(
      params.photoBuffer,
      this.config.inputCompression,
    );

    const inputImage = {
      mimeType: "image/jpeg" as const,
      dataUri: `data:image/jpeg;base64,${processed.buffer.toString("base64")}`,
    };
    const captureBase64 = processed.buffer.toString("base64");

    let referenceImageBase64: string | undefined;
    let referenceMimeType: string | undefined;

    if (preset.referenceImagePath) {
      const reference = await readImageAsDataUri(preset.referenceImagePath);
      referenceImageBase64 = reference.dataUri.split(",")[1] ?? "";
      referenceMimeType = reference.mimeType;
    }

    const result = await this.modularClient.transformImage({
      captureImageBase64: captureBase64,
      captureMimeType: inputImage.mimeType,
      prompt: preset.prompt,
      referenceImageBase64,
      referenceMimeType,
      model: preset.model,
      imageOptions: imageOptionsFromPreset(
        preset,
        processed.outputWidth,
        processed.outputHeight,
        this.config.modularSeed,
      ),
    });

    return {
      outputBuffer: result.imageData,
      aspectRatio: processed.aspectRatio,
      outputWidth: processed.outputWidth,
      outputHeight: processed.outputHeight,
      presetId: preset.id,
    };
  }

  private async resolvePreset(presetId?: string): Promise<StylePreset> {
    const preset = await this.presetPromise;
    if (presetId && presetId !== preset.id) {
      throw new Error(`Preset not found or disabled: ${presetId}`);
    }
    if (!preset.enabled) {
      throw new Error(`Preset not found or disabled: ${preset.id}`);
    }
    return preset;
  }
}

export { DEFAULT_PRESET_ID };
