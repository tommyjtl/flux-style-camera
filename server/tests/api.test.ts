import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { processInputImage } from "../src/services/image-processing";
import {
  createPhotoFormData,
  createTestContext,
  createTestPhoto,
  mockModularFailure,
  mockModularSuccess,
} from "./helpers";

describe("processInputImage", () => {
  test("compresses large photos under configured max bytes", async () => {
    const photo = await createTestPhoto(3000, 2000);
    const processed = await processInputImage(photo, {
      minWidth: 768,
      minHeight: 768,
      maxBytes: 120_000,
      maxLongEdge: 2048,
      quality: 85,
    });

    expect(processed.buffer.byteLength).toBeLessThanOrEqual(120_000);
    expect(processed.sourceWidth).toBe(3000);
    expect(processed.outputWidth).toBe(1024);
    expect(processed.outputHeight).toBe(680);
  });
});

describe("POST /api/transform", () => {
  test("returns styled PNG with metadata headers", async () => {
    const output = await sharp({
      create: {
        width: 768,
        height: 1024,
        channels: 3,
        background: { r: 255, g: 120, b: 90 },
      },
    })
      .png()
      .toBuffer();

    const ctx = await createTestContext({
      fetchImpl: mockModularSuccess(output),
    });

    try {
      const photo = await createTestPhoto(1200, 1600);
      const response = await ctx.app.request("/api/transform", {
        method: "POST",
        body: createPhotoFormData(photo, "front"),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("image/png");
      expect(response.headers.get("X-Fluxoid-Aspect-Ratio")).toBe("0.75");
      expect(response.headers.get("X-Fluxoid-Output-Width")).toBe("768");
      expect(response.headers.get("X-Fluxoid-Output-Height")).toBe("1024");
      expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
    } finally {
      await ctx.cleanup();
    }
  });

  test("returns 502 when Modular fails", async () => {
    const ctx = await createTestContext({
      fetchImpl: mockModularFailure(500, "upstream error"),
    });

    try {
      const photo = await createTestPhoto(800, 600);
      const response = await ctx.app.request("/api/transform", {
        method: "POST",
        body: createPhotoFormData(photo),
      });

      expect(response.status).toBe(502);
    } finally {
      await ctx.cleanup();
    }
  });

  test("GET /api/health returns ok", async () => {
    const ctx = await createTestContext();
    try {
      const response = await ctx.app.request("/api/health");
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true, service: "fluxoid-server" });
    } finally {
      await ctx.cleanup();
    }
  });
});
