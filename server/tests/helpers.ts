import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { createApp } from "../src/app";
import type { AppConfig } from "../src/config";
import type { StylePreset } from "../src/types";

export const TEST_PRESET: StylePreset = {
  id: "travel-gouache-v1",
  name: "Travel Gouache",
  prompt: "Transform this photo into an editorial gouache illustration.",
  referenceImagePath: null,
  model: "black-forest-labs/FLUX.2-klein-4B",
  guidanceScale: 7.5,
  steps: 4,
  seed: 42,
  enabled: true,
};

export async function createTestContext(options: {
  fetchImpl?: typeof fetch;
  configOverrides?: Partial<AppConfig>;
  preset?: StylePreset;
} = {}) {
  const rootDir = await mkdtemp(join(tmpdir(), "fluxoid-test-"));
  const dataDir = join(rootDir, "data");

  const config: AppConfig = {
    port: 0,
    dataDir,
    staticDir: null,
    corsOrigin: "http://localhost:5173",
    auth: {
      enabled: false,
      username: "",
      password: "",
      secret: "test-secret",
      secureCookies: false,
    },
    modularApiKey: "test-key",
    modularApiUrl: "https://api.modular.com/v1/responses",
    modularSteps: 4,
    modularGuidanceScale: 7.5,
    modularSeed: 42,
    inputCompression: {
      minWidth: 768,
      minHeight: 768,
      maxBytes: 1_500_000,
      maxLongEdge: 2048,
      quality: 85,
    },
    ...options.configOverrides,
  };

  const { app, transformService } = await createApp({
    config,
    preset: options.preset ?? TEST_PRESET,
    fetchImpl: options.fetchImpl,
  });

  return {
    app,
    config,
    transformService,
    rootDir,
    async cleanup() {
      await rm(rootDir, { recursive: true, force: true });
    },
  };
}

export async function createTestPhoto(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 180, b: 220 },
    },
  })
    .jpeg()
    .toBuffer();
}

export function mockModularSuccess(imageBuffer: Buffer) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("api.modular.com") && init?.method === "POST") {
      return Response.json({
        id: "resp_test_123",
        output: [{ content: [{ image_data: imageBuffer.toString("base64") }] }],
      });
    }
    return Response.error();
  };
}

export function mockModularFailure(status = 500, message = "upstream error") {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("api.modular.com") && init?.method === "POST") {
      return new Response(message, { status });
    }
    return Response.error();
  };
}

export function createPhotoFormData(
  photo: Buffer,
  camera: "front" | "back" = "back",
): FormData {
  const formData = new FormData();
  formData.append("photo", new File([photo], "photo.jpg", { type: "image/jpeg" }));
  formData.append("camera", camera);
  return formData;
}
