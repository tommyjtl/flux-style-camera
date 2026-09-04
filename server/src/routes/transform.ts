import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { TransformService } from "../services/transform";
import { isAllowedImageMimeType } from "../services/image";
import type { CameraFacing } from "../types";

function parseCamera(value: FormDataEntryValue | null): CameraFacing {
  if (value !== "front" && value !== "back") {
    throw new HTTPException(400, { message: "camera must be 'front' or 'back'" });
  }
  return value;
}

export function createTransformRouter(transformService: TransformService): Hono {
  const app = new Hono();

  app.post("/", async (c) => {
    const body = await c.req.parseBody();
    const photo = body.photo;

    if (!(photo instanceof File)) {
      throw new HTTPException(400, { message: "photo file is required" });
    }

    const mimeType = photo.type || "application/octet-stream";
    if (!isAllowedImageMimeType(mimeType)) {
      throw new HTTPException(400, { message: "photo must be jpeg, png, or webp" });
    }

    const camera = parseCamera(body.camera ?? null);
    const presetId = typeof body.presetId === "string" ? body.presetId : undefined;
    const photoBuffer = Buffer.from(await photo.arrayBuffer());

    try {
      const result = await transformService.transform({
        photoBuffer,
        mimeType,
        camera,
        presetId,
      });

      return c.body(result.outputBuffer, 200, {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Fluxoid-Aspect-Ratio": String(result.aspectRatio),
        "X-Fluxoid-Output-Width": String(result.outputWidth),
        "X-Fluxoid-Output-Height": String(result.outputHeight),
        "X-Fluxoid-Preset-Id": result.presetId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transform failed";
      throw new HTTPException(502, { message });
    }
  });

  return app;
}
